<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Services\CustomerEmailService;
use App\Services\CustomerRecommendationService;
use App\Services\CustomerTokenService;
use App\Services\InvoiceService;
use App\Support\SecurityAudit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class CustomerAccountController extends Controller
{
    public function me(Request $request) { return response()->json(['customer' => $request->user(), 'order_count' => $request->user()->orders()->where('payment_status','Paid')->count(), 'latest_order' => $request->user()->orders()->where('payment_status','Paid')->latest()->first()]); }

    public function orders(Request $request, InvoiceService $invoices)
    {
        return response()->json($request->user()->orders()->where('payment_status', 'Paid')->with(['items.product','payment','invoice'])->latest()->get()->map(fn ($order) => $this->orderPayload($order, $invoices)));
    }

    public function order(Request $request, string $order, InvoiceService $invoices)
    {
        $owned = $request->user()->orders()->with(['items.product','payment','invoice'])->where('order_number', $order)->first();
        if (!$owned) return response()->json(['message' => 'You are not authorized to access this order.'], 403);
        return response()->json($this->orderPayload($owned, $invoices));
    }

    public function invoice(Request $request, string $order, InvoiceService $invoices)
    {
        $owned = $request->user()->orders()->with(['payment','invoice'])->where('order_number', $order)->first();
        if (!$owned) return response()->json(['message' => 'You are not authorized to access this order.'], 403);
        if (!$invoices->isPaidAndVerified($owned)) return response()->json(['message' => 'An invoice is available only for a verified paid order.'], 422);
        $invoice = $owned->invoice;
        if (!$invoice || !Storage::disk($invoice->disk)->exists($invoice->file_path)) return response()->json(['message' => 'The invoice was not found.'], 404);
        SecurityAudit::record($request, 'customer.invoice_access', 'success', null, 'invoice', $invoice->id, ['customer_id' => $request->user()->id, 'order_id' => $owned->id]);
        return Storage::disk($invoice->disk)->download($invoice->file_path, $invoice->file_name, ['Content-Type' => $invoice->mime_type]);
    }

    public function profile(Request $request, CustomerTokenService $tokens, CustomerEmailService $emails)
    {
        $customer = $request->user();
        $data = $request->validate([
            'name' => ['required','string','min:2','max:100'],
            'username' => ['nullable','string','min:3','max:50','regex:/^[a-zA-Z0-9._-]+$/','unique:customers,username,'.$customer->id],
            'phone' => ['nullable','regex:/^\+91[6-9][0-9]{9}$/','unique:customers,phone,'.$customer->id],
            'email' => ['required','email','not_regex:/[^\r\n]*[\r\n][^\r\n]*/','max:255'],
        ]);
        $email = strtolower(trim($data['email']));
        if ($email !== $customer->email) {
            if (!$customer->email_verified_at) return response()->json(['message' => 'Verify your current email before changing it.'], 403);
            if (Customer::where('email',$email)->whereKeyNot($customer->id)->exists()) return response()->json(['message' => 'This email cannot be used.'], 422);
            $plain = $tokens->issue($customer, 'email_change', 60, $email); $emails->verificationTo($customer, $email, rtrim(config('services.customer_app_url'),'/').'/verify-email-change?token='.$plain);
        }
        $phoneChanged = ($data['phone'] ?: null) !== $customer->phone;
        $customer->forceFill([
            'name' => trim($data['name']),
            'username' => !empty($data['username']) ? strtolower(trim($data['username'])) : $customer->username,
            'phone' => $data['phone'] ?: null,
            'phone_verified_at' => $phoneChanged ? null : $customer->phone_verified_at,
        ])->save();
        return response()->json(['message' => $email !== $customer->email ? 'Profile updated. Verify the new email before it replaces the current email.' : 'Profile updated.', 'customer' => $customer->fresh()]);
    }

    public function verifyEmailChange(Request $request, CustomerTokenService $tokens, CustomerEmailService $emails)
    {
        $data = $request->validate(['token' => ['required','string']]); $token = $tokens->consume($data['token'], 'email_change');
        if (!$token || !$token->pending_email || Customer::where('email',$token->pending_email)->whereKeyNot($token->customer_id)->exists()) return response()->json(['message' => 'This email-change link is invalid or expired.'], 422);
        $customer = $token->customer; $customer->forceFill(['email' => $token->pending_email, 'email_verified_at' => now()])->save(); $customer->tokens()->delete(); $emails->emailChanged($customer);
        return response()->json(['message' => 'Email changed. Please sign in again.']);
    }

    public function password(Request $request, CustomerEmailService $emails)
    {
        $customer = $request->user(); $creating = !$customer->password;
        $rules = ['password' => ['required','confirmed',Password::min(8)->mixedCase()->numbers()]];
        if (!$creating) $rules['current_password'] = ['required','string'];
        $data = $request->validate($rules);
        if (!$creating && !Hash::check($data['current_password'], $customer->password)) return response()->json(['message' => 'The current password is incorrect.'], 422);
        if ($customer->password && Hash::check($data['password'], $customer->password)) return response()->json(['message' => 'Choose a password you have not just used.'], 422);
        if ($creating && !$customer->email_verified_at) return response()->json(['message' => 'Verify your email before creating a password.'], 403);
        $currentTokenId = $customer->currentAccessToken()?->id; $customer->forceFill(['password' => Hash::make($data['password'])])->save(); $customer->tokens()->when($currentTokenId, fn ($q) => $q->where('id','!=',$currentTokenId))->delete(); $emails->passwordChanged($customer);
        SecurityAudit::record($request, 'customer.password_changed', 'success', null, 'customer', $customer->id, ['customer_id' => $customer->id]);
        return response()->json(['message' => $creating ? 'Password created.' : 'Password changed.']);
    }

    public function recommendations(Request $request, CustomerRecommendationService $service) { return response()->json($service->for($request->user())); }

    private function orderPayload(Order $order, InvoiceService $invoices): array
    {
        $available = $invoices->isPaidAndVerified($order) && $order->invoice && Storage::disk($order->invoice->disk)->exists($order->invoice->file_path);
        return array_merge($order->toArray(), ['has_invoice' => (bool) $available, 'invoice_number' => $available ? $order->invoice->invoice_number : null, 'invoice_file_name' => $available ? $order->invoice->file_name : null, 'customer_invoice_url' => $available ? "/api/customer/orders/{$order->order_number}/invoice" : null]);
    }
}
