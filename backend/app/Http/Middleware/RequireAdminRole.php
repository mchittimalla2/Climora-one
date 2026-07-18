<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\SecurityAudit;
use Closure;
use Illuminate\Http\Request;

class RequireAdminRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();
        $authorized = $user && in_array($user->role, $roles, true);

        if (!$authorized) {
            SecurityAudit::record($request, 'authorization.denied', 'failure', $user, 'route', $request->route()?->uri(), [
                'required_roles' => $roles,
                'actual_role' => $user?->role,
            ]);

            return response()->json(['message' => 'Your admin role does not permit this action.'], 403);
        }

        return $next($request);
    }
}
