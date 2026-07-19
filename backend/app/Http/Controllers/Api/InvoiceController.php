<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\InvoiceAccessService;
use App\Services\InvoiceService;
use App\Support\SecurityAudit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class InvoiceController extends Controller
{
    public function download(string $token, InvoiceAccessService $access, InvoiceService $invoices)
    {
        $downloadToken = $access->resolve($token);
        if (!$downloadToken) {
            return response()->json(['message' => 'This invoice link is invalid or has expired.'], 403);
        }

        $invoice = $downloadToken->invoice;
        $order = $invoice->order;

        if (!$invoices->isPaidAndVerified($order)) {
            return response()->json(['message' => 'An invoice is available only for a verified paid order.'], 422);
        }

        if (!Storage::disk($invoice->disk)->exists($invoice->file_path)) {
            return response()->json(['message' => 'The invoice was not found.'], 404);
        }

        $downloadToken->forceFill(['last_used_at' => now()])->save();

        return Storage::disk($invoice->disk)->download(
            $invoice->file_path,
            $invoice->file_name,
            ['Content-Type' => $invoice->mime_type]
        );
    }

    public function adminDownload(Request $request, string $order, InvoiceService $invoices)
    {
        $order = Order::query()->with(['payment', 'invoice'])->where('order_number', $order)->firstOrFail();

        if (!$invoices->isPaidAndVerified($order)) {
            return response()->json(['message' => 'An invoice is available only for a verified paid order.'], 422);
        }

        $invoice = $order->invoice;
        if (!$invoice || !Storage::disk($invoice->disk)->exists($invoice->file_path)) {
            return response()->json(['message' => 'The invoice was not found.'], 404);
        }

        SecurityAudit::record($request, 'admin.invoice_access', 'success', null, 'invoice', $invoice->id, [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'invoice_number' => $invoice->invoice_number,
        ]);

        return Storage::disk($invoice->disk)->download(
            $invoice->file_path,
            $invoice->file_name,
            ['Content-Type' => $invoice->mime_type]
        );
    }
}
