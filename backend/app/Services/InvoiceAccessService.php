<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\InvoiceDownloadToken;

class InvoiceAccessService
{
    public function createDownloadUrl(Invoice $invoice): string
    {
        $plainToken = bin2hex(random_bytes(32));

        InvoiceDownloadToken::create([
            'invoice_id' => $invoice->id,
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => now()->addMinutes(15),
        ]);

        return route(
            'invoices.download',
            ['token' => $plainToken],
            false
        );
    }

    public function resolve(string $plainToken): ?InvoiceDownloadToken
    {
        if (!preg_match('/^[a-f0-9]{64}$/', $plainToken)) {
            return null;
        }

        return InvoiceDownloadToken::query()
            ->with(['invoice.order.payment'])
            ->where('token_hash', hash('sha256', $plainToken))
            ->where('expires_at', '>', now())
            ->first();
    }
}
