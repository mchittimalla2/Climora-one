<?php
namespace Tests\Feature;

use App\Models\Customer;
use App\Models\CustomerOauthState;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Services\CustomerRecommendationService;
use App\Services\CustomerTokenService;
use App\Services\RazorpayService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Tests\TestCase;

class CustomerAccountFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp(); Http::fake(['https://api.brevo.com/*' => Http::response(['messageId'=>'test'],201)]); Storage::fake('invoices'); config(['invoices.disk'=>'invoices','services.customer_app_url'=>'http://store.test']);
    }

    public function test_registration_normalizes_email_hashes_password_and_rejects_weak_or_duplicate_values(): void
    {
        $response=$this->postJson('/api/customer/auth/register',['name'=>'Customer One','email'=>' Customer@Example.COM ','phone'=>'98765 43210','password'=>'StrongPass1','password_confirmation'=>'StrongPass1','terms'=>true])->assertCreated();
        $customer=Customer::firstOrFail(); $this->assertSame('customer@example.com',$customer->email); $this->assertSame('+919876543210',$customer->phone); $this->assertTrue(Hash::check('StrongPass1',$customer->password)); $this->assertNull($customer->phone_verified_at); $this->assertNotEmpty($response->json('token'));
        $this->postJson('/api/customer/auth/register',['name'=>'Other','email'=>'CUSTOMER@example.com','password'=>'StrongPass1','password_confirmation'=>'StrongPass1','terms'=>true])->assertStatus(422);
        $this->postJson('/api/customer/auth/register',['name'=>'Weak','email'=>'weak@example.com','password'=>'password','password_confirmation'=>'password','terms'=>true])->assertStatus(422);
    }

    public function test_email_login_logout_blocking_and_mobile_login_deferral(): void
    {
        $customer=$this->customer(['phone'=>'+919999999999']);
        $login=$this->postJson('/api/customer/auth/login',['identifier'=>'LOGIN@EXAMPLE.COM','password'=>'StrongPass1'])->assertOk(); $token=$login->json('token');
        $this->withToken($token)->postJson('/api/customer/auth/logout')->assertOk(); $this->app['auth']->forgetGuards(); $this->withToken($token)->getJson('/api/customer/me')->assertUnauthorized();
        $this->postJson('/api/customer/auth/login',['identifier'=>'login@example.com','password'=>'wrong'])->assertUnauthorized()->assertJson(['message'=>'The supplied credentials are invalid.']);
        $this->postJson('/api/customer/auth/login',['identifier'=>'9999999999','password'=>'StrongPass1'])->assertStatus(422);
        $customer->forceFill(['status'=>'blocked'])->save(); $this->postJson('/api/customer/auth/login',['identifier'=>'login@example.com','password'=>'StrongPass1'])->assertForbidden();
    }

    public function test_verified_email_links_only_matching_guest_orders_idempotently(): void
    {
        $customer=$this->customer(['email'=>'guest@example.com','email_verified_at'=>null]); $matching=$this->order('Guest@Example.com'); $otherCustomer=$this->customer(['email'=>'owner@example.com']); $owned=$this->order('guest@example.com',$otherCustomer);
        $payment=Payment::create(['order_id'=>$matching->id,'provider_order_id'=>'rzp_link','provider_payment_id'=>'pay_link','amount'=>10000,'status'=>'captured','verified_at'=>now()]);
        $invoice=Invoice::create(['order_id'=>$matching->id,'invoice_number'=>'CLM-INV-2026-000099','invoice_date'=>now(),'disk'=>'invoices','file_path'=>'issued/link.pdf','file_name'=>'link.pdf','mime_type'=>'application/pdf','file_size'=>4,'generated_at'=>now()]);
        $plain=app(CustomerTokenService::class)->issue($customer,'verify_email',60);
        $this->postJson('/api/customer/auth/email/verify',['token'=>$plain])->assertOk(); $this->postJson('/api/customer/auth/email/verify',['token'=>$plain])->assertOk();
        $this->assertSame($customer->id,$matching->fresh()->customer_id); $this->assertSame($otherCustomer->id,$owned->fresh()->customer_id); $this->assertSame('captured',$payment->fresh()->status); $this->assertSame($invoice->invoice_number,$invoice->fresh()->invoice_number);
    }

    public function test_unverified_customer_cannot_read_orders_and_ownership_is_enforced(): void
    {
        $unverified=$this->customer(['email_verified_at'=>null]); Sanctum::actingAs($unverified,['customer']); $this->getJson('/api/customer/orders')->assertForbidden();
        $owner=$this->customer(['email'=>'owner@example.com']); $stranger=$this->customer(['email'=>'stranger@example.com']); $order=$this->paidOrder($owner);
        Sanctum::actingAs($stranger,['customer']); $this->getJson("/api/customer/orders/{$order->order_number}")->assertForbidden(); $this->getJson("/api/customer/orders/{$order->order_number}/invoice")->assertForbidden();
    }

    public function test_customer_downloads_same_existing_invoice_and_unpaid_has_no_invoice_metadata(): void
    {
        $customer=$this->customer(); $paid=$this->paidOrder($customer); $invoice=$paid->invoice; Storage::disk('invoices')->put($invoice->file_path,'%PDF-test'); $unpaid=$this->order('login@example.com',$customer,'Pending');
        Sanctum::actingAs($customer,['customer']); $list=$this->getJson('/api/customer/orders')->assertOk(); $this->assertCount(1,$list->json()); $this->assertTrue($list->json('0.has_invoice'));
        $this->get("/api/customer/orders/{$paid->order_number}/invoice")->assertOk()->assertHeader('content-type','application/pdf'); $this->assertSame(1,Invoice::where('order_id',$paid->id)->count()); $this->assertFalse($unpaid->fresh()->relationLoaded('invoice'));
    }

    public function test_guest_checkout_remains_unowned_and_authenticated_checkout_assigns_customer(): void
    {
        $product=Product::create(['name'=>'Craft','category'=>'Decor','price'=>100,'stock'=>5]); $razorpay=Mockery::mock(RazorpayService::class); $razorpay->shouldReceive('createOrder')->twice()->andReturnUsing(fn()=>['id'=>uniqid('order_'),'amount'=>10000,'currency'=>'INR','status'=>'created']); $razorpay->shouldReceive('keyId')->twice()->andReturn('rzp_test'); $this->app->instance(RazorpayService::class,$razorpay);
        $payload=['customer_name'=>'Guest','email'=>'guest@example.com','phone'=>'9876543210','address'=>'Test address','city'=>'Jaipur','state'=>'Rajasthan','pincode'=>'302001','items'=>[['product_id'=>$product->id,'quantity'=>1]]];
        $guest=$this->postJson('/api/payments/create-order',$payload)->assertCreated(); $this->assertNull(Order::find($guest->json('order.id'))->customer_id);
        $customer=$this->customer(); Sanctum::actingAs($customer,['customer']); $owned=$this->postJson('/api/payments/create-order',$payload)->assertCreated(); $this->assertSame($customer->id,Order::find($owned->json('order.id'))->customer_id);
    }

    public function test_password_reset_is_expiring_one_time_and_recommendations_exclude_unavailable_products(): void
    {
        $customer=$this->customer(); $plain=app(CustomerTokenService::class)->issue($customer,'password_reset',30);
        $this->postJson('/api/customer/auth/reset-password',['token'=>$plain,'password'=>'NewStrong2','password_confirmation'=>'NewStrong2'])->assertOk(); $this->postJson('/api/customer/auth/reset-password',['token'=>$plain,'password'=>'OtherStrong3','password_confirmation'=>'OtherStrong3'])->assertStatus(422);
        Product::create(['name'=>'Available','category'=>'Decor','price'=>50,'stock'=>2]); Product::create(['name'=>'Empty','category'=>'Decor','price'=>50,'stock'=>0]); $deleted=Product::create(['name'=>'Deleted','category'=>'Decor','price'=>50,'stock'=>2]); $deleted->delete();
        $recommendations=app(CustomerRecommendationService::class)->for($customer); $this->assertSame(['Available'],$recommendations->pluck('name')->all());
    }

    public function test_profile_and_password_changes_enforce_verification_and_current_password(): void
    {
        $customer=$this->customer(['phone'=>'+919876543210','phone_verified_at'=>now()]); Sanctum::actingAs($customer,['customer']);
        $this->putJson('/api/customer/profile',['name'=>'Updated Customer','email'=>'new@example.com','phone'=>'+919999999999'])->assertOk();
        $this->assertSame('Updated Customer',$customer->fresh()->name); $this->assertSame('login@example.com',$customer->fresh()->email); $this->assertNull($customer->fresh()->phone_verified_at); $this->assertDatabaseHas('customer_auth_tokens',['customer_id'=>$customer->id,'purpose'=>'email_change','pending_email'=>'new@example.com']);
        $this->putJson('/api/customer/password',['current_password'=>'wrong','password'=>'AnotherPass2','password_confirmation'=>'AnotherPass2'])->assertStatus(422);
        $this->putJson('/api/customer/password',['current_password'=>'StrongPass1','password'=>'AnotherPass2','password_confirmation'=>'AnotherPass2'])->assertOk(); $this->assertTrue(Hash::check('AnotherPass2',$customer->fresh()->password));
    }

    public function test_customer_routes_reject_unauthenticated_and_customer_tokens_do_not_grant_admin_access(): void
    {
        $this->getJson('/api/customer/me')->assertUnauthorized(); $this->getJson('/api/customer/orders')->assertUnauthorized();
        $customer=$this->customer(); Sanctum::actingAs($customer,['customer']); $this->getJson('/api/admin/orders')->assertStatus(401);
    }

    public function test_login_is_throttled_by_identifier_and_ip(): void
    {
        $this->customer();
        for($attempt=0;$attempt<5;$attempt++) $this->postJson('/api/customer/auth/login',['identifier'=>'throttle@example.com','password'=>'wrong'])->assertUnauthorized();
        $this->postJson('/api/customer/auth/login',['identifier'=>'throttle@example.com','password'=>'wrong'])->assertStatus(429);
    }

    public function test_google_callback_rejects_invalid_state_and_creates_verified_identity_with_valid_mock(): void
    {
        $this->get('/api/customer/auth/google/callback?state=bad&code=x')->assertRedirect('http://store.test/auth/google/callback?oauth_error=invalid_state');
        $state='validstate'; CustomerOauthState::create(['state_hash'=>hash('sha256',$state),'flow'=>'login','expires_at'=>now()->addMinute()]);
        $identity=new class { public $user=['verified_email'=>true]; public function getEmail(){return 'google@example.com';} public function getId(){return 'google-123';} public function getName(){return 'Google Customer';} public function getAvatar(){return null;} };
        $driver=Mockery::mock(); $driver->shouldReceive('stateless')->once()->andReturnSelf(); $driver->shouldReceive('user')->once()->andReturn($identity); Socialite::shouldReceive('driver')->with('google')->once()->andReturn($driver);
        $this->get("/api/customer/auth/google/callback?state={$state}&code=x")->assertRedirectContains('code='); $customer=Customer::where('email','google@example.com')->firstOrFail(); $this->assertNotNull($customer->email_verified_at); $this->assertDatabaseHas('customer_social_accounts',['customer_id'=>$customer->id,'provider_user_id'=>'google-123']);
    }

    private function customer(array $overrides=[]): Customer { return Customer::create(array_merge(['name'=>'Login Customer','email'=>'login@example.com','email_verified_at'=>now(),'password'=>Hash::make('StrongPass1'),'status'=>'active'],$overrides)); }
    private function order(string $email, ?Customer $customer=null, string $paymentStatus='Paid'): Order { return Order::create(['customer_id'=>$customer?->id,'order_number'=>uniqid('CLM-2026-'),'customer_name'=>'Customer','email'=>$email,'phone'=>'9876543210','address'=>'Address','city'=>'Jaipur','state'=>'Rajasthan','pincode'=>'302001','total'=>100,'status'=>'Confirmed','payment_status'=>$paymentStatus]); }
    private function paidOrder(Customer $customer): Order { $order=$this->order($customer->email,$customer); OrderItem::create(['order_id'=>$order->id,'product_name'=>'Craft','quantity'=>1,'price'=>100,'subtotal'=>100]); Payment::create(['order_id'=>$order->id,'provider_order_id'=>uniqid('rzp_'),'provider_payment_id'=>uniqid('pay_'),'amount'=>10000,'status'=>'captured','verified_at'=>now()]); $invoice=Invoice::create(['order_id'=>$order->id,'invoice_number'=>uniqid('CLM-INV-'),'invoice_date'=>now(),'disk'=>'invoices','file_path'=>uniqid('issued/').'.pdf','file_name'=>'invoice.pdf','mime_type'=>'application/pdf','file_size'=>9,'generated_at'=>now()]); return $order->fresh(['items.product','payment','invoice']); }
}
