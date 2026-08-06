# LoginWA SDKs & Tools

Quick reference for the public client assets in this repository.

## JS SDK
- Path: `js`
- Entry: `src/index.js`
- Package: `@loginwa/sdk`
- Usage:
```js
import { LoginWAClient } from '@loginwa/sdk';
const client = new LoginWAClient({ apiKey: 'YOUR_API_KEY' });
try {
  const start = await client.startOtp({ phone: '6281234567890', countryCode: '62' });
  const verify = await client.verifyOtp({ sessionId: start.session_id, otpCode: '123456' });
  console.log('verified', verify);
} catch (err) {
  console.error('OTP error', err?.status, err?.data || err.message);
}
```

## PHP SDK
- Path: `php`
- Package: `loginwa/sdk`
- Usage:
```php
$client = new LoginWA\SDK\Client('YOUR_API_KEY');
try {
    $start = $client->startOtp(['phone' => '6281234567890', 'country_code' => '62']);
    $verify = $client->verifyOtp(['session_id' => $start['session_id'], 'otp_code' => '123456']);
    var_dump($verify);
} catch (\LoginWA\SDK\ApiException $e) {
    echo 'OTP error: ' . $e->getCode() . ' ' . $e->getMessage();
}
```

## OTP Widget Snippet
- Path: `snippet/otp-widget.html`
- HTML/JS embed; set API key and call `/auth/start` + `/auth/verify` via fetch against the `/api/v1` base.

## Postman
- Path: `docs/postman/loginwa-api.postman_collection.json`
- Variables: `base_url` (default `https://api.loginwa.com`), `api_key`.

## Auth & Headers
- `Authorization: Bearer <SECRET_API_KEY>` (or `X-Api-Key`)
- `Content-Type: `application/json`

## Base URL
- Host: `https://api.loginwa.com`
- SDK default: `https://api.loginwa.com/api/v1` (overrideable in the constructor).
- Also reachable at `https://loginwa.com/api`.

## Common errors
- `401 unauthorized` — missing/invalid API key.
- `402 subscription_suspended` — inactive, suspended, or past-due subscription.
- `422 invalid_code` | `expired` | `blocked` — verification failed.
- `429 quota_exceeded` — monthly plan quota exceeded.
- `429 rate_limited` — too many requests per minute.
- Network/timeout — retry with backoff; SDK throws with HTTP status in error object/exception code.

## Changelog
See `CHANGELOG.md`.
