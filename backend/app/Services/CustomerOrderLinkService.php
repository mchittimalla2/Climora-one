<?php
namespace App\Services;

use App\Models\Customer;
use App\Support\SecurityAudit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerOrderLinkService
{
    public function linkVerifiedEmail(Customer $customer, ?Request $request = null): int
    {
        if (!$customer->email_verified_at) return 0;
        $count = DB::transaction(fn () => DB::table('orders')
            ->whereNull('customer_id')->whereRaw('LOWER(email) = ?', [strtolower($customer->email)])
            ->update(['customer_id' => $customer->id, 'updated_at' => now()]));
        if ($request) SecurityAudit::record($request, 'customer.orders_linked', 'success', null, 'customer', $customer->id, ['customer_id' => $customer->id, 'orders_linked' => $count]);
        return $count;
    }
}
