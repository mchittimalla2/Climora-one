<?php

namespace Tests\Feature;

use App\Models\EmailNotification;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use App\Services\InvoiceAccessService;
use App\Services\InvoicePdfService;
use App\Services\InvoiceService;
use App\Services\OrderEmailService;
use App\Services\PaymentProcessor;
use App\Services\RazorpayService;
use App\Http\Middleware\EnforceAdminSession;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class InvoiceFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('invoices');
        config([
            'invoices.disk' => 'invoices',
            'invoices.directory' => 'issued',
            'services.brevo.api_key' => 'test-key',
            'services.brevo.admin_email' => '',
        ]);

        $pdf = Mockery::mock(InvoicePdfService::class);
        $pdf->shouldReceive('render')->andReturn('%PDF-1.4 test invoice');
        $this->app->instance(InvoicePdfService::class, $pdf);
    }

    public function test_captured_payment_generates_one_invoice_and_retries_reuse_it(): void
    {
        [$order, $payment, $product] = $this->pendingCheckout();
        Http::fake(['https://api.brevo.com/*' => Http::response(['messageId' => 'mail-1'], 201)]);

        $processor = $this->app->make(PaymentProcessor::class);
        $first = $processor->confirmCapturedPayment($payment, $this->gatewayPayment($payment));
        $second = $processor->confirmCapturedPayment($payment->fresh(), $this->gatewayPayment($payment));

        $this->assertSame('Paid', $first->order->payment_status);
        $this->assertSame(1, Invoice::where('order_id', $order->id)->count());
        $this->assertSame($first->order->invoice->invoice_number, $second->order->invoice->invoice_number);
        $this->assertSame(8, $product->fresh()->stock);
    }

    public function test_unpaid_and_failed_orders_do_not_generate_invoices(): void
    {
        [$order, $payment] = $this->pendingCheckout();
        $service = $this->app->make(InvoiceService::class);

        foreach (['Pending', 'Failed', 'Cancelled'] as $status) {
            $order->forceFill(['payment_status' => $status])->save();
            $payment->forceFill(['status' => strtolower($status), 'verified_at' => null])->save();

            try {
                $service->issue($order->fresh());
                $this->fail("{$status} order unexpectedly generated an invoice.");
            } catch (RuntimeException $error) {
                $this->assertStringContainsString('verified and captured', $error->getMessage());
            }
        }

        $this->assertDatabaseCount('invoices', 0);
    }

    public function test_webhook_retry_does_not_create_duplicate_invoice(): void
    {
        [$order, $payment] = $this->pendingCheckout();
        Http::fake(['https://api.brevo.com/*' => Http::response(['messageId' => 'mail-1'], 201)]);

        $razorpay = Mockery::mock(RazorpayService::class);
        $razorpay->shouldReceive('verifyWebhookSignature')->twice()->andReturnTrue();
        $this->app->instance(RazorpayService::class, $razorpay);

        $payload = json_encode([
            'event' => 'payment.captured',
            'payload' => ['payment' => ['entity' => $this->gatewayPayment($payment)]],
        ]);

        $headers = [
            'HTTP_X_RAZORPAY_SIGNATURE' => 'valid-test-signature',
            'HTTP_X_RAZORPAY_EVENT_ID' => 'evt_invoice_retry',
            'CONTENT_TYPE' => 'application/json',
        ];

        $this->call('POST', '/api/razorpay/webhook', [], [], [], $headers, $payload)->assertOk();
        $this->call('POST', '/api/razorpay/webhook', [], [], [], $headers, $payload)->assertOk();

        $this->assertSame(1, Invoice::where('order_id', $order->id)->count());
        $this->assertSame(1, \App\Models\PaymentEvent::where('provider_event_id', 'evt_invoice_retry')->count());
    }

    public function test_invoice_number_and_order_are_database_unique(): void
    {
        [$order] = $this->paidOrder();
        $invoice = $this->app->make(InvoiceService::class)->issue($order);

        $other = $this->makeOrder('CLM-2026-OTHER', '9999999999');
        $this->expectException(QueryException::class);

        Invoice::create([
            'order_id' => $other->id,
            'invoice_number' => $invoice->invoice_number,
            'invoice_date' => now()->toDateString(),
            'disk' => 'invoices',
            'file_path' => 'issued/duplicate.pdf',
            'file_name' => 'duplicate.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 10,
            'generated_at' => now(),
        ]);
    }

    public function test_three_customer_lifecycle_emails_attach_the_same_invoice(): void
    {
        [$order] = $this->paidOrder();
        $invoice = $this->app->make(InvoiceService::class)->issue($order);
        Http::fake(['https://api.brevo.com/*' => Http::response(['messageId' => 'mail-id'], 201)]);

        $emails = $this->app->make(OrderEmailService::class);
        $emails->sendCustomerOrderConfirmed($order->fresh());
        $emails->sendCustomerOutForDelivery($order->fresh());
        $emails->sendCustomerDelivered($order->fresh());
        $emails->sendCustomerOrderConfirmed($order->fresh());
        $emails->sendCustomerOutForDelivery($order->fresh());
        $emails->sendCustomerDelivered($order->fresh());

        Http::assertSentCount(3);
        Http::assertSent(function ($request) use ($invoice) {
            $attachment = $request['attachment'][0] ?? [];

            return ($attachment['name'] ?? null) === $invoice->file_name
                && base64_decode($attachment['content'] ?? '', true) === Storage::disk('invoices')->get($invoice->file_path);
        });
        $this->assertSame(3, EmailNotification::where('order_id', $order->id)->where('status', 'sent')->count());
    }

    public function test_unpaid_order_receives_no_lifecycle_email(): void
    {
        [$order] = $this->pendingCheckout();
        Http::fake();

        $emails = $this->app->make(OrderEmailService::class);
        $emails->sendCustomerOrderConfirmed($order);
        $emails->sendCustomerOutForDelivery($order);
        $emails->sendCustomerDelivered($order);

        Http::assertNothingSent();
        $this->assertDatabaseCount('email_notifications', 0);
    }

    public function test_authorized_token_download_succeeds_and_unknown_token_is_rejected(): void
    {
        [$order] = $this->paidOrder();
        $invoice = $this->app->make(InvoiceService::class)->issue($order);
        $signed = $this->app->make(InvoiceAccessService::class)->createDownloadUrl($invoice);

        $this->get($signed)
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->get('/api/invoices/download/' . str_repeat('a', 64))->assertForbidden();
        $this->assertTrue(Storage::disk('invoices')->exists($invoice->file_path));
    }

    public function test_invoice_download_is_rejected_if_payment_is_no_longer_paid(): void
    {
        [$order, $payment] = $this->paidOrder();
        $invoice = $this->app->make(InvoiceService::class)->issue($order);
        $url = $this->app->make(InvoiceAccessService::class)->createDownloadUrl($invoice);
        $order->forceFill(['payment_status' => 'Failed'])->save();
        $payment->forceFill(['status' => 'failed'])->save();

        $this->getJson($url)->assertStatus(422);
    }

    public function test_paid_order_with_missing_invoice_returns_not_found(): void
    {
        [$order] = $this->paidOrder();
        $invoice = $this->app->make(InvoiceService::class)->issue($order);
        $signed = $this->app->make(InvoiceAccessService::class)->createDownloadUrl($invoice);
        Storage::disk('invoices')->delete($invoice->file_path);

        $this->getJson($signed)->assertNotFound();
    }

    public function test_unpaid_order_cannot_enter_customer_email_milestones(): void
    {
        $this->withoutMiddleware();
        [$order] = $this->pendingCheckout();
        $order->forceFill(['status' => 'Shipped'])->save();
        Http::fake();

        $this->putJson("/api/admin/orders/{$order->order_number}/status", [
            'status' => 'Out for Delivery',
        ])->assertStatus(422);

        Http::assertNothingSent();
        $this->assertSame('Shipped', $order->fresh()->status);
    }

    public function test_lifecycle_transitions_require_payment_and_do_not_resend_duplicate_emails(): void
    {
        $this->withoutMiddleware();
        [$order] = $this->paidOrder();
        $this->app->make(InvoiceService::class)->issue($order);
        $order->forceFill([
            'status' => 'Shipped',
            'status_history' => json_encode([
                'Confirmed' => now()->subDay()->toDateTimeString(),
                'Packed' => now()->subHours(12)->toDateTimeString(),
                'Shipped' => now()->subHour()->toDateTimeString(),
            ]),
        ])->save();
        Http::fake(['https://api.brevo.com/*' => Http::response(['messageId' => 'mail-id'], 201)]);

        $uri = "/api/admin/orders/{$order->order_number}/status";
        $this->putJson($uri, ['status' => 'Out for Delivery'])->assertOk();
        $this->putJson($uri, ['status' => 'Out for Delivery'])->assertStatus(409);
        $this->putJson($uri, ['status' => 'Delivered'])->assertOk();

        Http::assertSentCount(2);
        $this->assertSame(1, EmailNotification::where('event_type', 'customer.out_for_delivery')->count());
        $this->assertSame(1, EmailNotification::where('event_type', 'customer.delivered')->count());
    }

    public function test_authenticated_admin_downloads_existing_invoice_without_regeneration(): void
    {
        $this->authenticateAdmin();
        [$order] = $this->paidOrder();
        $invoice = $this->app->make(InvoiceService::class)->issue($order);
        $before = Storage::disk('invoices')->get($invoice->file_path);

        $this->get("/api/admin/orders/{$order->order_number}/invoice")
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->assertSame(1, Invoice::where('order_id', $order->id)->count());
        $this->assertSame($before, Storage::disk('invoices')->get($invoice->file_path));
        $this->assertDatabaseHas('audit_logs', [
            'event' => 'admin.invoice_access',
            'resource_id' => (string) $invoice->id,
        ]);
    }

    public function test_admin_invoice_endpoint_rejects_unpaid_and_missing_invoices_or_files(): void
    {
        $this->authenticateAdmin();
        [$unpaid] = $this->pendingCheckout();
        $this->getJson("/api/admin/orders/{$unpaid->order_number}/invoice")->assertStatus(422);

        [$paid] = $this->paidOrder('CLM-2026-MISSING', '8888888888');
        $this->getJson("/api/admin/orders/{$paid->order_number}/invoice")->assertNotFound();

        $invoice = $this->app->make(InvoiceService::class)->issue($paid);
        Storage::disk('invoices')->delete($invoice->file_path);
        $this->getJson("/api/admin/orders/{$paid->order_number}/invoice")->assertNotFound();
    }

    public function test_admin_orders_include_invoice_metadata_without_hiding_failed_orders(): void
    {
        $this->authenticateAdmin();
        [$paid] = $this->paidOrder();
        $invoice = $this->app->make(InvoiceService::class)->issue($paid);
        [$failed, $payment] = $this->pendingCheckout('CLM-2026-FAILED', '9999999999');
        $failed->forceFill(['payment_status' => 'Failed'])->save();
        $payment->forceFill(['status' => 'failed'])->save();

        $response = $this->getJson('/api/admin/orders')->assertOk();
        $paidJson = collect($response->json())->firstWhere('order_number', $paid->order_number);
        $failedJson = collect($response->json())->firstWhere('order_number', $failed->order_number);

        $this->assertTrue($paidJson['has_invoice']);
        $this->assertSame($invoice->invoice_number, $paidJson['invoice_number']);
        $this->assertSame($invoice->file_name, $paidJson['invoice_file_name']);
        $this->assertSame("/api/admin/orders/{$paid->order_number}/invoice", $paidJson['admin_invoice_url']);
        $this->assertNotNull($failedJson);
        $this->assertFalse($failedJson['has_invoice']);
        $this->assertNull($failedJson['admin_invoice_url']);
    }

    public function test_invoice_logo_uses_local_png_and_retains_text_fallback(): void
    {
        [$order] = $this->paidOrder();
        $invoice = new Invoice(['invoice_number' => 'CLM-INV-2026-000001', 'invoice_date' => now()]);
        $logo = resource_path('images/climoraone-logo.png');
        config(['invoices.logo_path' => $logo]);

        $html = (new InvoicePdfService())->renderHtml($invoice, $order);
        $this->assertFileExists($logo);
        $this->assertStringContainsString('data:image/png;base64,', $html);
        $this->assertStringContainsString('<img class="logo"', $html);
        $logoPdf = (new InvoicePdfService())->render($invoice, $order);
        $this->assertStringContainsString('/Subtype /Image', $logoPdf);

        config(['invoices.logo_path' => resource_path('images/missing-logo.png')]);
        $fallback = (new InvoicePdfService())->renderHtml($invoice, $order);
        $this->assertStringContainsString('<div class="brand-fallback">Climoraone</div>', $fallback);
        $this->assertStringNotContainsString('<img class="logo"', $fallback);
    }

    public function test_invoice_html_contains_every_item_totals_and_no_gst_fields(): void
    {
        [$order] = $this->paidOrder();
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => null,
            'product_name' => 'Second artisan product',
            'quantity' => 2,
            'price' => 50,
            'subtotal' => 100,
        ]);
        $order->forceFill(['total' => 300])->save();

        $invoice = new Invoice([
            'invoice_number' => 'CLM-INV-2026-000001',
            'invoice_date' => now()->toDateString(),
            'generated_at' => now(),
        ]);

        $realPdf = new InvoicePdfService();
        $html = $realPdf->renderHtml($invoice, $order->fresh());

        $this->assertStringContainsString('Test artisan product', $html);
        $this->assertStringContainsString('Second artisan product', $html);
        $this->assertStringContainsString('300.00', $html);
        $this->assertStringContainsString('PAID', $html);
        $this->assertStringNotContainsString('GSTIN', $html);
        $this->assertStringNotContainsString('HSN', $html);
        $this->assertStringNotContainsString('CGST', $html);
        $this->assertStringNotContainsString('SGST', $html);
        $this->assertStringNotContainsString('IGST', $html);

        $pdf = $realPdf->render($invoice, $order->fresh());
        $this->assertStringStartsWith('%PDF-', $pdf);
        $this->assertLessThanOrEqual(1, preg_match_all('~/Type\s*/Page\b~', $pdf));
    }

    private function authenticateAdmin(): User
    {
        $this->withoutMiddleware(EnforceAdminSession::class);
        $admin = User::factory()->create([
            'role' => User::ROLE_OWNER,
            'is_active' => true,
            'mfa_enabled' => true,
        ]);
        Sanctum::actingAs($admin, ['admin']);

        return $admin;
    }

    private function pendingCheckout(string $orderNumber = 'CLM-2026-TESTORDER', string $phone = '9876543210'): array
    {
        $product = Product::create([
            'name' => 'Test artisan product',
            'category' => 'Decor',
            'price' => 200,
            'stock' => 10,
        ]);
        $order = $this->makeOrder($orderNumber, $phone);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'quantity' => 2,
            'price' => 200,
            'subtotal' => 400,
        ]);

        $payment = Payment::create([
            'order_id' => $order->id,
            'provider_order_id' => 'order_' . $order->id,
            'amount' => 40000,
            'currency' => 'INR',
            'status' => 'created',
        ]);

        return [$order, $payment, $product];
    }

    private function paidOrder(string $orderNumber = 'CLM-2026-TESTORDER', string $phone = '9876543210'): array
    {
        [$order, $payment, $product] = $this->pendingCheckout($orderNumber, $phone);
        $order->forceFill(['payment_status' => 'Paid', 'status' => 'Confirmed'])->save();
        $payment->forceFill([
            'provider_payment_id' => 'pay_' . $payment->id,
            'status' => 'captured',
            'method' => 'upi',
            'signature_verified' => true,
            'inventory_processed' => true,
            'captured_at' => now(),
            'verified_at' => now(),
        ])->save();

        return [$order->fresh(), $payment->fresh(), $product];
    }

    private function makeOrder(string $number, string $phone): Order
    {
        return Order::create([
            'order_number' => $number,
            'customer_name' => 'Invoice Customer',
            'email' => 'customer@example.com',
            'phone' => $phone,
            'address' => '123 Artisan Street',
            'city' => 'Jaipur',
            'state' => 'Rajasthan',
            'pincode' => '302001',
            'total' => 400,
            'status' => 'Pending Payment',
            'payment_status' => 'Pending',
        ]);
    }

    private function gatewayPayment(Payment $payment): array
    {
        return [
            'id' => 'pay_' . $payment->id,
            'status' => 'captured',
            'amount' => (int) $payment->amount,
            'order_id' => $payment->provider_order_id,
            'method' => 'upi',
            'captured_at' => now()->timestamp,
        ];
    }
}
