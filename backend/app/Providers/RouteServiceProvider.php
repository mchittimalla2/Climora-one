<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    public const HOME = '/home';

    // protected $namespace = 'App\\Http\\Controllers';

    public function boot()
    {
        $this->configureRateLimiting();

        $this->routes(function () {
            Route::prefix('api')
                ->middleware('api')
                ->namespace($this->namespace)
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->namespace($this->namespace)
                ->group(base_path('routes/web.php'));
        });
    }

    protected function configureRateLimiting()
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by(optional($request->user())->id ?: $request->ip());
        });

        RateLimiter::for('admin-auth', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));
        RateLimiter::for('checkout', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));
        RateLimiter::for('order-track', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));

        // Registration retries include validation failures. Allow a practical retry window
        // while still protecting the endpoint from automated account-creation abuse.
        RateLimiter::for('customer-register', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));

        RateLimiter::for('customer-login', fn (Request $request) => Limit::perMinute(5)->by(strtolower((string) $request->input('identifier')).'|'.$request->ip()));
        RateLimiter::for('customer-sensitive', fn (Request $request) => Limit::perMinute(3)->by(optional($request->user())->id ?: $request->ip()));
    }
}
