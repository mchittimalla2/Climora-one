<?php

return [
    'brevo' => [
        'api_key' => env('BREVO_API_KEY'),
        'from_email' => env('BREVO_FROM_EMAIL', 'info@climoraone.com'),
        'from_name' => env('BREVO_FROM_NAME', 'Climoraone'),
        'admin_email' => env('ADMIN_NOTIFICATION_EMAIL', env('BREVO_FROM_EMAIL', 'info@climoraone.com')),
    ],

    'storefront' => [
        'url' => rtrim(env('CLIMORAONE_STORE_URL', 'https://dev.climoraone.com'), '/'),
    ],

    'razorpay' => [
        'key_id' => env('RAZORPAY_KEY_ID'),
        'key_secret' => env('RAZORPAY_KEY_SECRET'),
        'webhook_secret' => env('RAZORPAY_WEBHOOK_SECRET'),
        'currency' => env('RAZORPAY_CURRENCY', 'INR'),
    ],
];
