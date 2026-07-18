<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\SecurityAudit;
use Closure;
use Illuminate\Http\Request;

class EnsureAdminAccess
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        $validRoles = [User::ROLE_EDITOR, User::ROLE_OWNER, User::ROLE_BREAK_GLASS];

        if (!$user || !$user->is_active || !in_array($user->role, $validRoles, true) || !$user->tokenCan('admin')) {
            SecurityAudit::record($request, 'authorization.denied', 'failure', $user, 'route', $request->route()?->uri(), [
                'required_ability' => 'admin',
            ]);

            return response()->json(['message' => 'You are not authorized to access this admin route.'], 403);
        }

        return $next($request);
    }
}
