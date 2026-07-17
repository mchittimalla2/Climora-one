<?php

return [

    'brevo' => [
    'api_key' => env('BREVO_API_KEY'),
    'from_email' => env('BREVO_FROM_EMAIL', 'info@climoraone.com'),
    'from_name' => env('BREVO_FROM_NAME', 'Climoraone'),
],

];
