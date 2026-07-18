<?php

namespace Tests\Feature;

use Tests\TestCase;

class RouteAuthorizationTest extends TestCase
{
    /**
     * @dataProvider protectedAdminRoutes
     */
    public function test_admin_routes_reject_unauthenticated_requests(string $method, string $uri): void
    {
        $this->json($method, $uri)->assertUnauthorized();
    }

    public function protectedAdminRoutes(): array
    {
        return [
            ['GET', '/api/admin/auth/me'],
            ['POST', '/api/admin/auth/logout'],
            ['PUT', '/api/admin/profile'],
            ['PUT', '/api/admin/profile/password'],
            ['POST', '/api/admin/profile/email-change'],
            ['POST', '/api/admin/profile/email-change/verify'],
            ['GET', '/api/admin/products'],
            ['POST', '/api/admin/products'],
            ['PUT', '/api/admin/products/1'],
            ['DELETE', '/api/admin/products/1'],
            ['GET', '/api/admin/products/recycle-bin'],
            ['POST', '/api/admin/products/1/restore'],
            ['DELETE', '/api/admin/products/1/permanent'],
            ['GET', '/api/admin/orders'],
            ['PUT', '/api/admin/orders/CLM-2026-TEST/status'],
        ];
    }
}
