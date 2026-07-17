<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminIdentifierAuthController extends AdminAuthController
{
    public function login(Request $request): JsonResponse
    {
        $this->resolveIdentifier($request);
        return parent::login($request);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $this->resolveIdentifier($request);
        return parent::verifyOtp($request);
    }

    public function resendOtp(Request $request): JsonResponse
    {
        $this->resolveIdentifier($request);
        return parent::resendOtp($request);
    }

    private function resolveIdentifier(Request $request): void
    {
        $identifier = Str::lower(trim((string) ($request->input('login') ?: $request->input('email'))));
        if ($identifier === '') return;

        $user = User::whereRaw('LOWER(email) = ?', [$identifier])
            ->orWhereRaw('LOWER(username) = ?', [$identifier])
            ->first();

        // Preserve a generic failure response by passing a syntactically valid placeholder email.
        $request->merge(['email' => $user?->email ?: 'invalid-login@invalid.local']);
    }
}
