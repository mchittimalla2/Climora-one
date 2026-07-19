<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\InvoiceSequence;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class InvoiceService
{
    public function __construct(private InvoicePdfService $pdf)
    {
    }

    public function issue(Order $order): Invoice
    {
        $existing = $order->invoice()->first();
        if ($existing) {
            return $existing;
        }

        $storedDisk = null;
        $storedPath = null;

        try {
            return DB::transaction(function () use ($order, &$storedDisk, &$storedPath) {
                if ($storedDisk && $storedPath) {
                    Storage::disk($storedDisk)->delete($storedPath);
                    $storedPath = null;
                }
                $lockedOrder = Order::query()
                    ->with(['items', 'payment', 'invoice'])
                    ->lockForUpdate()
                    ->findOrFail($order->id);

                if ($lockedOrder->invoice) {
                    return $lockedOrder->invoice;
                }

                $this->assertPaidAndVerified($lockedOrder);

                $issuedAt = $lockedOrder->payment->captured_at ?: $lockedOrder->payment->verified_at ?: now();
                $year = (int) $issuedAt->format('Y');

                DB::table('invoice_sequences')->insertOrIgnore([
                    'year' => $year,
                    'last_number' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $sequence = InvoiceSequence::query()->lockForUpdate()->findOrFail($year);
                $nextNumber = (int) $sequence->last_number + 1;
                $sequence->forceFill(['last_number' => $nextNumber])->save();

                $invoiceNumber = sprintf('CLM-INV-%d-%06d', $year, $nextNumber);
                $fileName = "Climoraone-Invoice-{$invoiceNumber}.pdf";
                $storedDisk = (string) config('invoices.disk', 'invoices');
                $directory = trim((string) config('invoices.directory', 'issued'), '/');
                $storedPath = implode('/', array_filter([
                    $directory,
                    (string) $year,
                    (string) Str::uuid() . '.pdf',
                ]));

                $draft = new Invoice([
                    'order_id' => $lockedOrder->id,
                    'invoice_number' => $invoiceNumber,
                    'invoice_date' => $issuedAt->toDateString(),
                    'disk' => $storedDisk,
                    'file_path' => $storedPath,
                    'file_name' => $fileName,
                    'mime_type' => 'application/pdf',
                    'generated_at' => now(),
                ]);

                $contents = $this->pdf->render($draft, $lockedOrder);
                if ($contents === '' || !Storage::disk($storedDisk)->put($storedPath, $contents)) {
                    throw new RuntimeException('The invoice PDF could not be stored.');
                }

                $draft->file_size = strlen($contents);
                $draft->save();

                return $draft->fresh();
            }, 3);
        } catch (Throwable $error) {
            if ($storedDisk && $storedPath) {
                Storage::disk($storedDisk)->delete($storedPath);
            }

            report($error);
            throw $error;
        }
    }

    public function isPaidAndVerified(Order $order): bool
    {
        $order->loadMissing('payment');

        return $order->payment_status === 'Paid'
            && $order->payment
            && $order->payment->status === 'captured'
            && $order->payment->verified_at !== null
            && $order->payment->provider_payment_id !== null;
    }

    private function assertPaidAndVerified(Order $order): void
    {
        if (!$this->isPaidAndVerified($order)) {
            throw new RuntimeException('An invoice can be issued only after payment is verified and captured.');
        }
    }
}
