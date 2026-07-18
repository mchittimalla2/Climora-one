<?php

namespace App\Http\Middleware;

use App\Models\AdminSession;
use App\Support\SecurityAudit;
use Closure;
use Illuminate\Http\Request;

class EnforceAdminSession
{
    private const IDLE_MINUTES = 30;

    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();
        $session = $token
            ? AdminSession::where('token_hash', hash('sha256', $token))->first()
            : null;

        if (!$session || !$session->isActive() || $session->last_activity_at->lt(now()->subMinutes(self::IDLE_MINUTES))) {
            if ($session && !$session->revoked_at) {
                $session->forceFill(['revoked_at' => now()])->save();
            }

            $request->user()?->currentAccessToken()?->delete();
            SecurityAudit::record($request, 'auth.session_expired', 'failure', $request->user(), 'admin_session', $session?->id, [
                'reason' => !$session ? 'missing' : ($session->expires_at->isPast() ? 'absolute_timeout' : 'idle_timeout'),
            ]);

            return response()->json(['message' => 'Your admin session has expired. Please sign in again.'], 401);
        }

        if (!$request->user()?->is_active || $session->user_id !== $request->user()?->id) {
            $session->forceFill(['revoked_at' => now()])->save();
            $request->user()?->currentAccessToken()?->delete();

            return response()->json(['message' => 'This admin session is no longer authorized.'], 401);
        }

        if ($session->last_activity_at->lt(now()->subMinute())) {
            $session->forceFill(['last_activity_at' => now()])->save();
        }

        $request->attributes->set('admin_session', $session);

        return $next($request);
    }
}
