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
        $user = $this->resolveIdentifier($request);
        $response = parent::verifyOtp($request);

        if ($response->getStatusCode() < 300 && $user) {
            $payload = $response->getData(true);
            $payload['user']['username'] = $user->username;
            $response->setData($payload);
        }

        return $response;
    }

    public function resendOtp(Request $request): JsonResponse
    {
        $this->resolveIdentifier($request);
        return parent::resendOtp($request);
    }

    private function resolveIdentifier(Request $request): ?User
    {
        $identifier = Str::lower(trim((string) ($request->input('login') ?: $request->input('email'))));
        if ($identifier === '') return null;

        $user = User::whereRaw('LOWER(email) = ?', [$identifier])
            ->orWhereRaw('LOWER(username) = ?', [$identifier])
            ->first();

        $request->merge(['email' => $user?->email ?: 'invalid-login@invalid.local']);
        return $user;
    }
}
