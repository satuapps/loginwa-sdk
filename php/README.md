# LoginWA PHP SDK

Dependency-free (curl) PHP client for the [LoginWA](https://loginwa.com) WhatsApp
API (v1). Requires PHP 8.0+.

Covers OTP, messaging (text + media), number check, devices (QR &
pairing-code linking, groups), webhooks, broadcast campaigns, and the IP
whitelist.

## Install

```bash
composer require loginwa/sdk
```

## Quick start

```php
<?php
require __DIR__.'/vendor/autoload.php';

use LoginWA\SDK\Client;

$wa = new Client(getenv('LOGINWA_API_KEY')); // default base URL https://api.loginwa.com/api/v1

// Plain text
$wa->sendMessage([
    'phone'   => '6281234567890',
    'message' => 'Hello from LoginWA!',
]);

// Image with caption
$wa->sendMessage([
    'phone'     => '6281234567890',
    'type'      => 'image',
    'media_url' => 'https://cdn.example.com/promo.jpg',
    'caption'   => 'Promo today!',
]);
```

## OTP

```php
$start  = $wa->startOtp(['phone' => '6281234567890']);
$verify = $wa->verifyOtp([
    'session_id' => $start['session_id'],
    'otp_code'   => '123456',
]);
```

## Methods

**OTP**
- `startOtp(array $payload)` — `phone`, optional `country_code`, `otp_length`, `message_template`, `device_id`, `meta`
- `verifyOtp(array $payload)` — `session_id`, `otp_code`

**Messaging**
- `sendMessage(array $payload)` — `phone` + (`message` for text, or `type` + `media_url` for media; optional `caption`, `filename`, `mimetype`, `ptt`, `device_id`, `meta`)
- `checkNumbers(array $phones, ?string $deviceId = null)` — up to 100 numbers

**Devices**
- `listDevices()`
- `createDevice(?string $label = null)` — returns 202, then poll `getDevice` for the QR
- `getDevice(string $deviceId)`
- `deleteDevice(string $deviceId)`
- `refreshQr(string $deviceId)`
- `requestPairingCode(string $deviceId, string $phone)` — link without scanning a QR
- `listGroups(string $deviceId)`

**Webhooks**
- `listWebhooks()`
- `createWebhook(array $payload)` — `url` + optional `events`, `secret`, `retry_count`
- `getWebhook(int $id)`
- `updateWebhook(int $id, array $payload)`
- `deleteWebhook(int $id)`
- `regenerateWebhookSecret(int $id)`
- `testWebhook(int $id)`

**Broadcast campaigns**
- `listCampaigns(int $page = 1)`
- `createCampaign(array $payload)` — `name`, `message`, `contacts[]` + optional `media_url`, `media_type`, `delay_seconds`, `schedule_at`
- `getCampaign(string $campaignId)`
- `sendCampaign(string $campaignId)`
- `pauseCampaign(string $campaignId)`
- `resumeCampaign(string $campaignId)`
- `deleteCampaign(string $campaignId)`
- `getCampaignContacts(string $campaignId, ?string $status = null)`

**IP whitelist**
- `listIpWhitelist()`
- `addIp(string $ipAddress, ?string $label = null)`
- `removeIp(int $id)`
- `setIpRestriction(bool $enabled)`

## Broadcast example

```php
$campaign = $wa->createCampaign([
    'name'     => 'May promo',
    'message'  => 'Hi {{name}}, enjoy 20% off this week!',
    'contacts' => [
        ['phone' => '6281234567890', 'name' => 'Andi', 'variables' => ['name' => 'Andi']],
        ['phone' => '6289876543210', 'name' => 'Budi'],
    ],
    'delay_seconds' => 5,
]);

$wa->sendCampaign($campaign['data']['id']);
```

## Error handling

Any non-2xx response throws `\LoginWA\SDK\ApiException` (extends
`RuntimeException`). `getCode()` is the HTTP status; `$e->data` holds the
decoded JSON error body.

```php
use LoginWA\SDK\ApiException;

try {
    $wa->sendMessage(['phone' => '6281234567890', 'message' => 'hi']);
} catch (ApiException $e) {
    error_log($e->getCode() . ' ' . $e->getMessage());
    // $e->data['error'] etc.
}
```

## Auth & base URL

- Header: `Authorization: Bearer <SECRET_API_KEY>` (set automatically)
- Default base URL: `https://api.loginwa.com/api/v1` (override via the constructor's second argument)
