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
  await client.sendMessage({ phone: '6281234567890', message: 'hi', replyTo: { id: start.message_id } });
  await client.getMessage(start.message_id);
  await client.deleteMessage({ messageId: start.message_id, phone: '6281234567890' });
  console.log('verified', verify);
} catch (err) {
  console.error('OTP error', err?.status, err?.data || err.message);
}

// Reverse OTP: the user sends rev.message to your number via rev.wa_link; LoginWA sends nothing
const rev = await client.startReverseOtp();                 // any sender, 8-digit code
const bound = await client.startReverseOtp({ phone: '6281234567890' }); // only this number, 6-digit code
const state = await client.getReverseOtp(rev.session_id);   // pending | verified (phone) | expired | failed (reason)
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

$rev = $client->startReverseOtp();                           // any sender, 8-digit code
$state = $client->getReverseOtp($rev['session_id']);         // status: pending|verified|expired|failed
```

## Reverse OTP
- `POST /api/v1/auth/reverse/start` → `session_id`, `mode` (`any_sender` | `phone_bound`), `code`, `message` (`LOGIN <code>`), `receiver_phone`, `wa_link`, `expires_in`, `quota_remaining`.
- `GET /api/v1/auth/reverse/{session_id}` → `status` plus `expires_in` (pending), `phone` + `verified_at` (verified), or `reason` (failed, e.g. `sender_hidden`).
- Webhook events `otp.verified` and `otp.expired` carry `session_id`, `channel`, `mode`, `phone` and your `meta`.
- Billed once per successful login. Needs an online device owned by the app; otherwise `503 no_device_connected`.
- Standard OTP `message_template` placeholders: `{code}`, `{ttl}` (minutes), `{app}`.

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
- `422 too_late` — WhatsApp no longer allows the message to be deleted.
- `429 quota_exceeded` — monthly plan quota exceeded.
- `429 rate_limited` — too many requests per minute.
- `404 not_found` | `device_not_found` — message not owned, or engine session missing.
- `404 session_not_found` — reverse OTP session id unknown for this app.
- `503 no_device_connected` — no online WhatsApp device for the app.
- `502 send_failed` | `delete_failed` — engine could not send or revoke.
- Network/timeout — retry with backoff; SDK throws with HTTP status in error object/exception code.

## Changelog
See `CHANGELOG.md`.
