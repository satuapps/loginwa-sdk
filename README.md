# LoginWA Client SDKs & Tools

Client-side assets for integrating the LoginWA WhatsApp API — OTP, messaging,
media, broadcast, devices and webhooks. JavaScript, PHP and Android SDKs, an
embeddable OTP widget, and a Postman collection. No server code is included.

## Contents
- `js/` — JavaScript SDK (ESM), dependency-free client.
- `php/` — PHP SDK (cURL-based, PHP >= 8.0).
- `android/` — Android SDK (Kotlin library + runnable sample app).
- `snippet/otp-widget.html` — drop-in OTP widget example.
- `docs/postman/loginwa-api.postman_collection.json` — Postman collection.
- `docs/sdk.md` — quick reference for these assets.

Paths are relative to the repository root. Inside the LoginWA application
repository these same files live under `laravel-app/sdk/`, which is the single
source they are published from — edit them there, never here.

## API Basics
- Base URL: `https://loginwa.com/api/v1`
- Auth: `Authorization: Bearer <YOUR_API_KEY>`
- Content-Type: `application/json`

## Quick Start
### JavaScript SDK
```bash
cd sdk/js
npm install
# import into your app (ESM)
```
```js
import { LoginWAClient } from '@loginwa/sdk';
const client = new LoginWAClient({ apiKey: process.env.LOGINWA_API_KEY });
try {
  const start = await client.startOtp({ phone: '6281234567890', countryCode: '62' });
  const verify = await client.verifyOtp({ sessionId: start.session_id, otpCode: '123456' });
  console.log('verified', verify);
} catch (err) {
  console.error('OTP error', err?.response?.status, err?.response?.data || err.message);
}
```

### PHP SDK
```bash
cd sdk/php
composer install
```
```php
<?php
require __DIR__ . '/vendor/autoload.php';
$client = new LoginWA\SDK\Client('YOUR_API_KEY');
try {
    $start = $client->startOtp(['phone' => '6281234567890', 'country_code' => '62']);
    $verify = $client->verifyOtp(['session_id' => $start['session_id'], 'otp_code' => '123456']);
    var_dump($verify);
} catch (\RuntimeException $e) {
    // HTTP status is in $e->getCode()
    echo 'OTP error: ' . $e->getCode() . ' ' . $e->getMessage();
}
```

### OTP Widget Snippet
Open `sdk/snippet/otp-widget.html`, set your API key/Base URL, and embed in any page. Uses Fetch to call `/auth/start` and `/auth/verify`.

### Postman Collection
Import `docs/postman/loginwa-api.postman_collection.json`, set `baseUrl` (default `https://loginwa.com/api/v1`) and `apiKey` variables, then run start/verify flows.

## Common errors
- `401 unauthorized` — missing/invalid API key.
- `422 invalid_phone` — phone format not accepted.
- `422 invalid_code` | `expired` | `max_attempts` — verification failed.
- `429 quota_exceeded` — rate/quota exceeded for this key.
- Network/timeout — retry with backoff; SDK throws with HTTP status in error object/exception code.

## Download
Packaged ZIP (same contents as this repo): `https://loginwa.com/loginwa-batch1-sdk.zip`

## Changelog
- `0.1.0` — Initial client SDKs (JS, PHP), snippet, Postman, docs.

## Support
Questions/feedback: dev@loginwa.com
