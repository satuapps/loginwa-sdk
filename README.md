# LoginWA MCP Server

Unofficial MCP server for the [LoginWA](https://loginwa.com) WhatsApp API.
LoginWA hosts the WhatsApp engine, so an agent can check devices, send OTP,
run reverse OTP, send messages, and run broadcasts without operating a VPS.

[![loginwa-sdk MCP server](https://glama.ai/mcp/servers/satuapps/loginwa-sdk/badges/card.svg)](https://glama.ai/mcp/servers/satuapps/loginwa-sdk)
[![loginwa-sdk MCP server](https://glama.ai/mcp/servers/satuapps/loginwa-sdk/badges/score.svg)](https://glama.ai/mcp/servers/satuapps/loginwa-sdk)

Tools: `device_status`, `otp_start` / `otp_verify`, `reverse_otp_start` /
`reverse_otp_status`, `send_message`, `delete_message`, `get_message`, and
broadcast (`list_campaigns`, `get_campaign`, `create_campaign`, `send_campaign`).

```bash
npx -y @loginwa/mcp
```

Set `LOGINWA_API_KEY`. Pair devices at [loginwa.com/welcome](https://loginwa.com/welcome).
Client configs: [`mcp/README.md`](./mcp/README.md).

This repository also ships JavaScript, PHP and Android SDKs, an embeddable OTP
widget, and a Postman collection. No server code is included.

## Contents
- `js/`, JavaScript SDK (ESM), dependency-free client.
- `php/`, PHP SDK (cURL-based, PHP >= 8.0).
- `android/`, Android SDK (Kotlin library + runnable sample app).
- `mcp/`, TypeScript MCP server (`@loginwa/mcp`): device status, OTP, reverse OTP, send, broadcast for AI agents. Install with `npx -y @loginwa/mcp`. See [`mcp/README.md`](./mcp/README.md).
- `snippet/otp-widget.html`, drop-in OTP widget example.
- `docs/postman/loginwa-api.postman_collection.json`, Postman collection.
- `docs/sdk.md`, quick reference for these assets.

Paths are relative to the repository root. Inside the LoginWA application
repository these same files live under `laravel-app/sdk/`, which is the single
source they are published from, edit them there, never here.

## API Basics
- Base URL (host): `https://api.loginwa.com`
- SDK default (includes version prefix): `https://api.loginwa.com/api/v1`
- Auth: `Authorization: Bearer <YOUR_API_KEY>` (or `X-Api-Key`)
- Content-Type: `application/json`
- Also reachable at `https://loginwa.com/api` (same routes under `/api/…`)

OTP product paths: SDKs call `/auth/start` and `/auth/verify` against the
`/api/v1` base (i.e. `POST /api/v1/auth/start|verify`). The preferred narrative
docs path `/api/auth/start|verify` is equivalent for sending/verifying codes;
v1 start responses also include `sent_via_engine` and `quota_remaining`, and
v1 verify returns `phone` (not `phone_number`).

Reverse OTP ("Login with WhatsApp"): `POST /api/v1/auth/reverse/start` returns
a `message` (`LOGIN <code>`) and a `wa_link` to your connected number. The user
sends it; LoginWA sends nothing and bills only on success. Poll
`GET /api/v1/auth/reverse/{session_id}` or listen for the `otp.verified`
webhook. Omit `phone` to accept any sender and get their number back; pass
`phone` to accept only that number.

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
  console.error('OTP error', err?.status, err?.data || err.message);
}

// Reverse OTP: show rev.wa_link as a button (mobile) or QR (desktop)
const rev = await client.startReverseOtp();
const state = await client.getReverseOtp(rev.session_id); // pending | verified | expired | failed
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
} catch (\LoginWA\SDK\ApiException $e) {
    // HTTP status is in $e->getCode()
    echo 'OTP error: ' . $e->getCode() . ' ' . $e->getMessage();
}

$rev = $client->startReverseOtp(); // show $rev['wa_link'] as a button or QR
$state = $client->getReverseOtp($rev['session_id']); // status: pending|verified|expired|failed
```

### MCP server (`@loginwa/mcp`)
```bash
cd sdk/mcp && npm install && npm run build
# clients: npx -y @loginwa/mcp
```
Set `LOGINWA_API_KEY`. Details and client configs: [`mcp/README.md`](./mcp/README.md).

### OTP Widget Snippet
Open `sdk/snippet/otp-widget.html`, set your API key/Base URL, and embed in any page. Uses Fetch to call `/auth/start` and `/auth/verify`.

### Postman Collection
Import `docs/postman/loginwa-api.postman_collection.json`, set `base_url` (default `https://api.loginwa.com`) and `api_key` variables, then run the flows.

## Common errors
- `401 unauthorized`, missing/invalid API key.
- `402 subscription_suspended`, inactive, suspended, or past-due subscription.
- `422 invalid_code` | `expired` | `blocked`, verification failed.
- `429 quota_exceeded`, monthly plan quota exceeded.
- `429 rate_limited`, too many requests per minute (`Retry-After` header).
- `404 session_not_found`, reverse OTP session id unknown for this app.
- `503 no_device_connected`, no online WhatsApp device for the app.
- Network/timeout, retry with backoff; SDK throws with HTTP status in error object/exception code.

## Download
Packaged ZIP (same contents as this repo): `https://loginwa.com/loginwa-batch1-sdk.zip`

## Changelog
See `CHANGELOG.md`.

## Support
Questions/feedback: dev@loginwa.com
