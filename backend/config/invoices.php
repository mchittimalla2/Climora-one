<?php

return [
    'disk' => env('INVOICE_DISK', 'invoices'),
    'directory' => trim(env('INVOICE_DIRECTORY', 'issued'), '/'),
    'support_email' => env('INVOICE_SUPPORT_EMAIL', 'info@climoraone.com'),
    'website_url' => rtrim(env('CLIMORAONE_STORE_URL', 'https://dev.climoraone.com'), '/'),
    'country' => env('INVOICE_COUNTRY', 'India'),
    'logo_path' => env('INVOICE_LOGO_PATH') ?: public_path('images/climoraone-logo.png'),
];
