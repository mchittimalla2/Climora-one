<?php

namespace App\Http\Middleware;

use App\Models\AdminSession;
use App\Support\SecurityAudit;
use Closure;
use Illuminate\Http\Request;

class RequireRecentReauthentication
{
    private const FRESH_MINUTES = 15;

    public function handle(Request $request, Closure $next)
    {
        /** @var AdminSession|null $session */
        $session = $request->attributes->get('admin_session');

        if (!$session?->mfa_verified_at || $session->mfa_verified_at->lt(now()->subMinutes(self::FRESH_MINUTES))) {
            SecurityAudit::record($request, 'auth.reauthentication_required', 'failure', $request->user(), 'admin_session', $session?->id);

            return response()->json([
                'message' => 'Recent reauthentication is required. Please sign in again before continuing.',
                'reauthentication_required' => true,
            ], 428);
        }

        return $next($request);
    }
}
