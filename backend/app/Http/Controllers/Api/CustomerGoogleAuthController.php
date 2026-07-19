<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerAuthToken;
use App\Models\CustomerOauthState;
use App\Models\CustomerSocialAccount;
use App\Services\CustomerOrderLinkService;
use App\Support\SecurityAudit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Laravel\Socialite\Facades\Socialite;

class CustomerGoogleAuthController extends Controller
{
    public function redirect(Request $request)
    {
        if (!config('services.google.client_id') || !config('services.google.client_secret')) return response()->json(['message' => 'Google sign-in is not configured.'], 503);
        $plain = bin2hex(random_bytes(32)); CustomerOauthState::create(['state_hash' => hash('sha256',$plain), 'flow' => 'login', 'expires_at' => now()->addMinutes(10)]);
        return response()->json(['url' => Socialite::driver('google')->stateless()->with(['state' => $plain])->redirect()->getTargetUrl()]);
    }

    public function callback(Request $request, CustomerOrderLinkService $linker)
    {
        $state = CustomerOauthState::where('state_hash',hash('sha256',(string)$request->state))->where('expires_at','>',now())->first();
        if (!$state) return $this->front('oauth_error=invalid_state'); $state->delete();
        try { $google = Socialite::driver('google')->stateless()->user(); } catch (\Throwable $e) { report($e); return $this->front('oauth_error=provider_failed'); }
        $email = strtolower((string)$google->getEmail()); if (!$email || !((bool) ($google->user['verified_email'] ?? false))) return $this->front('oauth_error=verified_email_required');
        $social = CustomerSocialAccount::with('customer')->where(['provider'=>'google','provider_user_id'=>(string)$google->getId()])->first();
        if ($social) $customer = $social->customer;
        else {
            $existing = Customer::where('email',$email)->first();
            if ($existing) return $this->front('oauth_error=link_required');
            $customer = DB::transaction(function () use ($google,$email) { $customer = Customer::create(['name'=>$google->getName() ?: 'Climoraone Customer','email'=>$email,'email_verified_at'=>now(),'avatar_url'=>$google->getAvatar()]); $customer->socialAccounts()->create(['provider'=>'google','provider_user_id'=>(string)$google->getId(),'provider_email'=>$email]); return $customer->refresh(); });
            $linker->linkVerifiedEmail($customer, $request);
        }
        if (!$customer->isActive()) return $this->front('oauth_error=account_unavailable');
        $code = bin2hex(random_bytes(32)); CustomerAuthToken::create(['customer_id'=>$customer->id,'purpose'=>'oauth_exchange','token_hash'=>hash('sha256',$code),'expires_at'=>now()->addMinutes(5)]);
        return $this->front('code='.$code);
    }

    public function exchange(Request $request)
    {
        $data=$request->validate(['code'=>['required','string']]); $token=CustomerAuthToken::with('customer')->where('purpose','oauth_exchange')->where('token_hash',hash('sha256',$data['code']))->whereNull('used_at')->where('expires_at','>',now())->first();
        if(!$token) return response()->json(['message'=>'This Google sign-in code is invalid or expired.'],422); $token->forceFill(['used_at'=>now()])->save(); $customer=$token->customer;
        SecurityAudit::record($request,'customer.login','success',null,'customer',$customer->id,['customer_id'=>$customer->id,'provider'=>'google']);
        return response()->json(['token'=>$customer->createToken('customer',['customer'])->plainTextToken,'customer'=>$customer]);
    }

    private function front(string $query) { return redirect(rtrim((string)config('services.customer_app_url'),'/').'/auth/google/callback?'.$query); }
}
