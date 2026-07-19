<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Order;
use Dompdf\Dompdf;
use Dompdf\Options;

class InvoicePdfService
{
    public function render(Invoice $invoice, Order $order): string
    {
        $options = new Options();
        $options->set('isRemoteEnabled', false);
        $options->set('isHtml5ParserEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($this->renderHtml($invoice, $order), 'UTF-8');
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }

    public function renderHtml(Invoice $invoice, Order $order): string
    {
        $order->loadMissing(['items', 'payment']);

        return view('invoices.pdf', [
            'invoice' => $invoice,
            'order' => $order,
            'logoDataUri' => $this->logoDataUri(),
            'supportEmail' => (string) config('invoices.support_email'),
            'websiteUrl' => (string) config('invoices.website_url'),
            'country' => (string) config('invoices.country'),
            'subtotal' => (float) $order->items->sum(fn ($item) => (float) ($item->subtotal ?? ((float) $item->price * (int) $item->quantity))),
            'shippingCharge' => 0.0,
            'discount' => 0.0,
        ])->render();
    }

    private function logoDataUri(): ?string
    {
        $path = (string) config('invoices.logo_path');
        if ($path === '' || !is_file($path) || !is_readable($path)) {
            return null;
        }

        $mime = mime_content_type($path) ?: 'image/png';

        return 'data:' . $mime . ';base64,' . base64_encode((string) file_get_contents($path));
    }
}
