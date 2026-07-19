<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
    @page { margin: 24px 30px; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #26362c; font-family: "DejaVu Sans", sans-serif; font-size: 9.5px; line-height: 1.35; }
    .header { width: 100%; border-bottom: 3px solid #b6873d; padding-bottom: 13px; margin-bottom: 14px; }
    .header td { vertical-align: top; }
    .logo { width: 175px; max-height: 58px; object-fit: contain; }
    .brand-fallback { color: #173f2a; font-family: serif; font-size: 26px; font-weight: bold; }
    .invoice-title { margin: 0 0 5px; color: #173f2a; font-family: serif; font-size: 26px; letter-spacing: 2px; }
    .meta { color: #667168; font-size: 9px; }
    .meta strong { color: #26362c; }
    .columns { width: 100%; margin-bottom: 13px; border-collapse: separate; border-spacing: 8px 0; }
    .columns td { width: 33.33%; vertical-align: top; padding: 10px; border: 1px solid #dfe5dc; background: #f9faf7; }
    h2 { margin: 0 0 6px; color: #b6873d; font-size: 8.5px; letter-spacing: 1.2px; text-transform: uppercase; }
    .details { margin: 0; color: #465148; }
    .details strong { color: #173f2a; font-size: 10.5px; }
    .items { width: 100%; margin-bottom: 12px; border-collapse: collapse; }
    .items th { padding: 7px 8px; background: #173f2a; color: #fff; font-size: 8.5px; text-align: left; text-transform: uppercase; }
    .items td { padding: 7px 8px; border-bottom: 1px solid #e3e7df; }
    .items .number { text-align: right; white-space: nowrap; }
    .summary-wrap { width: 100%; margin-bottom: 13px; }
    .summary-wrap td { vertical-align: top; }
    .payment-note { width: 54%; padding: 10px; border: 1px solid #e0d4bb; background: #fbf7ed; }
    .summary { width: 42%; margin-left: auto; border-collapse: collapse; }
    .summary td { padding: 4px 5px; }
    .summary td:last-child { text-align: right; white-space: nowrap; }
    .summary .grand td { padding-top: 7px; border-top: 2px solid #173f2a; color: #173f2a; font-size: 12px; font-weight: bold; }
    .paid { display: inline-block; margin-top: 5px; padding: 4px 10px; background: #e7f3e5; color: #286331; font-size: 10px; font-weight: bold; letter-spacing: 1px; }
    .payment-id { margin-top: 5px; color: #788078; font-size: 7.5px; overflow-wrap: anywhere; }
    .impact { margin: 0 0 13px; padding: 10px 14px; border-left: 4px solid #b6873d; background: #f8f2e7; text-align: center; }
    .impact strong { display: block; margin-bottom: 3px; color: #173f2a; font-family: serif; font-size: 13px; }
    .footer { padding-top: 9px; border-top: 1px solid #dfe5dc; color: #697169; text-align: center; font-size: 8px; }
    .footer strong { color: #173f2a; font-size: 10px; }
</style>
</head>
<body>
<table class="header" cellspacing="0" cellpadding="0">
    <tr>
        <td style="width:55%">
            @if($logoDataUri)
                <img class="logo" src="{{ $logoDataUri }}" alt="Climoraone">
            @else
                <div class="brand-fallback">Climoraone</div>
            @endif
        </td>
        <td style="width:45%;text-align:right">
            <h1 class="invoice-title">INVOICE</h1>
            <div class="meta">
                <strong>{{ $invoice->invoice_number }}</strong><br>
                Invoice date: {{ $invoice->invoice_date->format('d M Y') }}<br>
                Order: {{ $order->order_number }}
            </div>
        </td>
    </tr>
</table>

<table class="columns">
    <tr>
        <td>
            <h2>Seller</h2>
            <p class="details"><strong>Climoraone</strong><br>{{ $supportEmail }}<br>{{ $websiteUrl }}</p>
        </td>
        <td>
            <h2>Bill to</h2>
            <p class="details"><strong>{{ $order->customer_name }}</strong><br>{{ $order->email }}<br>{{ $order->phone }}<br>{{ $order->address }}<br>{{ $order->city }}, {{ $order->state }} {{ $order->pincode }}<br>{{ $country }}</p>
        </td>
        <td>
            <h2>Ship to</h2>
            <p class="details"><strong>{{ $order->customer_name }}</strong><br>{{ $order->address }}<br>{{ $order->city }}, {{ $order->state }} {{ $order->pincode }}<br>{{ $country }}</p>
        </td>
    </tr>
</table>

<table class="items">
    <thead>
        <tr>
            <th style="width:50%">Product</th>
            <th class="number" style="width:12%">Qty</th>
            <th class="number" style="width:19%">Unit price</th>
            <th class="number" style="width:19%">Line total</th>
        </tr>
    </thead>
    <tbody>
        @foreach($order->items as $item)
            <tr>
                <td>{{ $item->product_name }}</td>
                <td class="number">{{ $item->quantity }}</td>
                <td class="number">₹{{ number_format((float) $item->price, 2) }}</td>
                <td class="number">₹{{ number_format((float) ($item->subtotal ?? ((float) $item->price * (int) $item->quantity)), 2) }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

<table class="summary-wrap" cellspacing="0" cellpadding="0">
    <tr>
        <td class="payment-note">
            <h2>Payment details</h2>
            <div>Method: <strong>{{ $order->payment->method ?: 'Online payment' }}</strong></div>
            <div>Payment date: <strong>{{ ($order->payment->captured_at ?: $order->payment->verified_at)->format('d M Y, h:i A') }}</strong></div>
            <span class="paid">PAID</span>
            <div class="payment-id">Razorpay payment ID: {{ $order->payment->provider_payment_id }}</div>
        </td>
        <td style="width:4%"></td>
        <td style="width:42%">
            <table class="summary">
                <tr><td>Subtotal</td><td>₹{{ number_format($subtotal, 2) }}</td></tr>
                <tr><td>Shipping</td><td>₹{{ number_format($shippingCharge, 2) }}</td></tr>
                <tr><td>Discount</td><td>- ₹{{ number_format($discount, 2) }}</td></tr>
                <tr class="grand"><td>Grand total</td><td>₹{{ number_format((float) $order->total, 2) }}</td></tr>
            </table>
        </td>
    </tr>
</table>

<div class="impact">
    <strong>Every purchase empowers our partners.</strong>
    Your purchase supports rural women, skilled artisans and meaningful livelihoods while helping preserve traditional craftsmanship for future generations.
</div>

<div class="footer">
    <strong>Thank you for shopping with Climoraone</strong><br>
    {{ $supportEmail }} &nbsp;•&nbsp; {{ $websiteUrl }}<br>
    This is a computer-generated invoice and does not require a signature.
</div>
</body>
</html>
