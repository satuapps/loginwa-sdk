# LoginWA SDKs & Tools

Batch 1 deliverables for non-WordPress users.

## JS SDK
- Path: `sdk/js`
- Entry: `src/index.js`
- Install: `npm install @loginwa/sdk` (local package)
- Usage:
```js
import { LoginWAClient } from '@loginwa/sdk';
const client = new LoginWAClient({ apiKey: 'YOUR_API_KEY' });
try {
  const start = await client.startOtp({ phone: '6281234567890', countryCode: '62' });
  const verify = await client.verifyOtp({ sessionId: start.session_id, otpCode: '123456' });
  console.log('verified', verify);
} catch (err) {
  console.error('OTP error', err?.response?.status, err?.response?.data || err.message);
}
```

## PHP SDK
- Path: `sdk/php`
- Install: `composer require loginwa/sdk` (local package)
- Usage:
```php
$client = new LoginWA\SDK\Client('YOUR_API_KEY');
try {
    $start = $client->startOtp(['phone' => '6281234567890', 'country_code' => '62']);
    $verify = $client->verifyOtp(['session_id' => $start['session_id'], 'otp_code' => '123456']);
    var_dump($verify);
} catch (\RuntimeException $e) {
    echo 'OTP error: ' . $e->getCode() . ' ' . $e->getMessage();
}
```

## OTP Widget Snippet
- Path: `sdk/snippet/otp-widget.html`
- HTML/JS embed; set API key and call /auth/start + /auth/verify via fetch.

## Postman
- Path: `docs/postman/loginwa-api.postman_collection.json`
- Variables: `baseUrl` (default `https://loginwa.com/api/v1`), `apiKey`.

## Auth & Headers
- `Authorization: Bearer <SECRET_API_KEY>`
- `Content-Type: application/json`

## Base URL
- Default `https://loginwa.com/api/v1` (overrideable in SDK constructor).

## Common errors
- `401 unauthorized` — missing/invalid API key.
- `422 invalid_phone` — phone format not accepted.
- `422 invalid_code` | `expired` | `max_attempts` — verification failed.
- `429 quota_exceeded` — rate/quota exceeded for this key.
- Network/timeout — retry with backoff; SDK throws with HTTP status in error object/exception code.

## Changelog
- `0.1.0` — Initial client SDKs (JS, PHP), snippet, Postman, docs.
