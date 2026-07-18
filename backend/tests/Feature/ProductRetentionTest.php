<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductRetentionTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_owner_delete_sets_a_thirty_day_retention_deadline(): void
    {
        Carbon::setTestNow('2026-07-19 12:00:00');
        $owner = $this->user(User::ROLE_OWNER);
        $product = $this->product();
        Sanctum::actingAs($owner, ['admin']);

        $this->deleteJson("/api/admin/products/{$product->id}")->assertOk();

        $deleted = Product::onlyTrashed()->findOrFail($product->id);
        $this->assertTrue($deleted->purge_eligible_at->equalTo(now()->addDays(30)));
        $this->assertSame($owner->id, $deleted->deleted_by);
    }

    public function test_no_account_can_permanently_delete_during_retention(): void
    {
        Carbon::setTestNow('2026-07-19 12:00:00');
        Storage::fake('public');
        $breakGlass = $this->user(User::ROLE_BREAK_GLASS, true);
        $product = $this->trashedProduct(now()->addSecond(), $breakGlass);
        Sanctum::actingAs($breakGlass, ['admin']);

        $this->deleteJson("/api/admin/products/{$product->id}/permanent", [
            'current_password' => 'Valid-password-123!',
            'confirmation' => "DELETE PRODUCT-{$product->id}",
        ])->assertStatus(409);

        $this->assertNotNull(Product::onlyTrashed()->find($product->id));
    }

    public function test_break_glass_can_permanently_delete_only_after_retention(): void
    {
        Carbon::setTestNow('2026-07-19 12:00:00');
        Storage::fake('public');
        $breakGlass = $this->user(User::ROLE_BREAK_GLASS, true);
        $product = $this->trashedProduct(now(), $breakGlass);
        Sanctum::actingAs($breakGlass, ['admin']);

        $this->deleteJson("/api/admin/products/{$product->id}/permanent", [
            'current_password' => 'Valid-password-123!',
            'confirmation' => "DELETE PRODUCT-{$product->id}",
        ])->assertOk();

        $this->assertNull(Product::withTrashed()->find($product->id));
    }

    public function test_owner_can_restore_during_retention_but_break_glass_cannot(): void
    {
        $owner = $this->user(User::ROLE_OWNER);
        $breakGlass = $this->user(User::ROLE_BREAK_GLASS, true);
        $product = $this->trashedProduct(now()->addDays(30), $owner);

        Sanctum::actingAs($breakGlass, ['admin']);
        $this->postJson("/api/admin/products/{$product->id}/restore")->assertForbidden();

        Sanctum::actingAs($owner, ['admin']);
        $this->postJson("/api/admin/products/{$product->id}/restore")->assertOk();

        $this->assertNull($product->fresh()->deleted_at);
        $this->assertNull($product->fresh()->purge_eligible_at);
    }

    private function user(string $role, bool $breakGlass = false): User
    {
        return User::factory()->create([
            'role' => $role,
            'is_break_glass' => $breakGlass,
            'is_active' => true,
            'mfa_enabled' => true,
            'password' => Hash::make('Valid-password-123!'),
        ]);
    }

    private function product(): Product
    {
        return Product::create([
            'name' => 'Retention test product',
            'category' => 'Test',
            'price' => 100,
            'stock' => 5,
        ]);
    }

    private function trashedProduct(Carbon $purgeEligibleAt, User $actor): Product
    {
        $product = $this->product();
        $product->forceFill([
            'deleted_by' => $actor->id,
            'purge_eligible_at' => $purgeEligibleAt,
        ])->save();
        $product->delete();

        return $product;
    }
}
