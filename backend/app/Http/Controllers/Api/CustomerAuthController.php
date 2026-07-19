<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\CustomerEmailService;
use App\Services\CustomerOrderLinkService;
use App\Services\CustomerTokenService;
use App\Support\SecurityAudit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class CustomerAuthController extends Controller
{
    public function register(Request $request, CustomerTokenService $tokens, CustomerEmailService $emails)
    {
        $request->merge(['email' => strtolower(trim((string) $request->email)), 'phone' => $this->phone($request->phone)]);
        $data = $request->validate(['name' => ['required','string','min:2','max:100'], 'email' => ['required','email','not_regex:/[^\r\n]*[\r\n][^\r\n]*/','max:255','unique:customers,email'], 'phone' => ['nullable','regex:/^\+91[6-9][0-9]{9}$/','unique:customers,phone'], 'password' => ['required','confirmed',Password::min(8)->mixedCase()->numbers()], 'terms' => ['accepted']]);
        $customer = Customer::create(['name' => trim($data['name']), 'email' => $data['email'], 'phone' => $data['phone'] ?: null, 'password' => Hash::make($data['password'])]);
        $plain = $tokens->issue($customer, 'verify_email', 60);
        $emails->verification($customer, $this->customerUrl('/verify-email?token='.$plain));
        SecurityAudit::record($request, 'customer.registered', 'success', null, 'customer', $customer->id, ['customer_id' => $customer->id]);
        return response()->json(['message' => 'Account created. Please check your email to verify it.', 'token' => $customer->createToken('customer', ['customer'])->plainTextToken, 'customer' => $customer], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate(['identifier' => ['required','string','max:255'], 'password' => ['required','string']]);
        $identifier = trim($data['identifier']);
        if (!filter_var($identifier, FILTER_VALIDATE_EMAIL)) return response()->json(['message' => 'Mobile login will be available after your number is verified.'], 422);
        $customer = Customer::where('email', strtolower($identifier))->first();
        if (!$customer || !$customer->password || !Hash::check($data['password'], $customer->password)) { SecurityAudit::record($request, 'customer.login', 'failure', null, 'customer', null); return response()->json(['message' => 'The supplied credentials are invalid.'], 401); }
        if (!$customer->isActive()) return response()->json(['message' => 'This customer account is unavailable.'], 403);
        $customer->forceFill(['last_login_at' => now()])->save();
        SecurityAudit::record($request, 'customer.login', 'success', null, 'customer', $customer->id, ['customer_id' => $customer->id]);
        return response()->json(['token' => $customer->createToken('customer', ['customer'])->plainTextToken, 'customer' => $customer]);
    }

    public function logout(Request $request)
    {
        $customer = $request->user(); $customer->currentAccessToken()?->delete();
        SecurityAudit::record($request, 'customer.logout', 'success', null, 'customer', $customer->id, ['customer_id' => $customer->id]);
        return response()->json(['message' => 'Signed out.']);
    }

    public function verify(Request $request, CustomerTokenService $tokens, CustomerOrderLinkService $linker, CustomerEmailService $emails)
    {
        $request->validate(['token' => ['required','string']]); $token = $tokens->consume($request->token, 'verify_email');
        if (!$token) return response()->json(['message' => 'This verification link is invalid or expired.'], 422);
        $customer = $token->customer;
        if (!$customer->email_verified_at) { $customer->forceFill(['email_verified_at' => now()])->save(); $linker->linkVerifiedEmail($customer, $request); $emails->welcome($customer); }
        SecurityAudit::record($request, 'customer.email_verified', 'success', null, 'customer', $customer->id, ['customer_id' => $customer->id]);
        return response()->json(['message' => 'Email verified.', 'customer' => $customer->fresh()]);
    }

    public function resend(Request $request, CustomerTokenService $tokens, CustomerEmailService $emails)
    {
        $customer = $request->user();
        if ($customer->email_verified_at) return response()->json(['message' => 'Email is already verified.']);
        $plain = $tokens->issue($customer, 'verify_email', 60); $emails->verification($customer, $this->customerUrl('/verify-email?token='.$plain));
        return response()->json(['message' => 'Verification email sent.']);
    }

    public function forgot(Request $request, CustomerTokenService $tokens, CustomerEmailService $emails)
    {
        $data = $request->validate(['email' => ['required','email','not_regex:/[^\r\n]*[\r\n][^\r\n]*/']]); $customer = Customer::where('email', strtolower(trim($data['email'])))->whereNotNull('email_verified_at')->first();
        if ($customer) { $plain = $tokens->issue($customer, 'password_reset', 30); $emails->passwordReset($customer, $this->customerUrl('/reset-password?token='.$plain)); }
        return response()->json(['message' => 'If the account exists, password reset instructions have been sent.']);
    }

    public function reset(Request $request, CustomerTokenService $tokens, CustomerEmailService $emails)
    {
        $data = $request->validate(['token' => ['required','string'], 'password' => ['required','confirmed',Password::min(8)->mixedCase()->numbers()]]); $token = $tokens->consume($data['token'], 'password_reset');
        if (!$token) return response()->json(['message' => 'This reset link is invalid or expired.'], 422);
        $customer = $token->customer; $customer->forceFill(['password' => Hash::make($data['password'])])->save(); $customer->tokens()->delete(); $emails->passwordChanged($customer);
        SecurityAudit::record($request, 'customer.password_reset', 'success', null, 'customer', $customer->id, ['customer_id' => $customer->id]);
        return response()->json(['message' => 'Password reset. Please sign in.']);
    }

    private function phone($value): ?string { if (!$value) return null; $digits = preg_replace('/\D+/', '', (string) $value); if (strlen($digits) === 12 && substr($digits, 0, 2) === '91') $digits = substr($digits, 2); return preg_match('/^[6-9]\d{9}$/', $digits) ? '+91'.$digits : (string) $value; }
    private function customerUrl(string $path): string { return rtrim((string) config('services.customer_app_url'), '/').$path; }
}
