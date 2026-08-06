# @loginwa/sdk (JS)

Dependency-free JavaScript client for the [LoginWA](https://loginwa.com) WhatsApp
API (v1). Works in Node 18+ and modern browsers (uses the global `fetch`).

Covers OTP, messaging (text + media), number check, devices (QR &
pairing-code linking, groups), webhooks, broadcast campaigns, and the IP
whitelist.

## Install

```bash
npm install @loginwa/sdk
```

## Quick start

```js
import LoginWAClient from '@loginwa/sdk';

const wa = new LoginWAClient({
  apiKey: process.env.LOGINWA_API_KEY,
  // baseUrl: 'https://api.loginwa.com/api/v1' // optional
});

// Plain text
await wa.sendText({ phone: '6281234567890', message: 'Hello from LoginWA!' });

// Image with caption
await wa.sendImage({
  phone: '6281234567890',
  mediaUrl: 'https://cdn.example.com/promo.jpg',
  caption: 'Promo today!',
});
```

> Keep your API key on the server side. Never ship it to a browser bundle.

## OTP

```js
const start = await wa.startOtp({ phone: '6281234567890' });
const result = await wa.verifyOtp({ sessionId: start.session_id, otpCode: '123456' });
```

## Methods

**OTP**
- `startOtp({ phone, countryCode?, otpLength?, messageTemplate?, deviceId?, meta? })`
- `verifyOtp({ sessionId, otpCode })`

**Messaging**
- `sendMessage({ phone, message?, type?, mediaUrl?, caption?, filename?, mimetype?, ptt?, deviceId?, meta? })`
- `sendText({ phone, message, deviceId?, meta? })`
- `sendImage({ phone, mediaUrl, caption?, deviceId?, meta? })`
- `sendVideo({ phone, mediaUrl, caption?, deviceId?, meta? })`
- `sendDocument({ phone, mediaUrl, filename?, caption?, mimetype?, deviceId?, meta? })`
- `sendAudio({ phone, mediaUrl, ptt?, mimetype?, deviceId?, meta? })`
- `checkNumbers({ phones, deviceId? })` — up to 100 numbers

**Devices**
- `listDevices()`
- `createDevice({ label? })` — returns 202, then poll `getDevice` for the QR
- `getDevice(deviceId)`
- `deleteDevice(deviceId)`
- `refreshQr(deviceId)`
- `requestPairingCode(deviceId, phone)` — link without scanning a QR
- `listGroups(deviceId)`

**Webhooks**
- `listWebhooks()`
- `createWebhook({ url, events?, secret?, retryCount? })`
- `getWebhook(id)`
- `updateWebhook(id, { url?, events?, active?, secret?, retryCount? })`
- `deleteWebhook(id)`
- `regenerateWebhookSecret(id)`
- `testWebhook(id)`

**Broadcast campaigns**
- `listCampaigns({ page? })`
- `createCampaign({ name, message, contacts, mediaUrl?, mediaType?, delaySeconds?, scheduleAt? })`
- `getCampaign(campaignId)`
- `sendCampaign(campaignId)`
- `pauseCampaign(campaignId)`
- `resumeCampaign(campaignId)`
- `deleteCampaign(campaignId)`
- `getCampaignContacts(campaignId, { status? })`

**IP whitelist**
- `listIpWhitelist()`
- `addIp({ ipAddress, label? })`
- `removeIp(id)`
- `setIpRestriction(enabled)`

**Helpers**
- `formatPhone(phone)` — strip everything but digits

## Broadcast example

```js
const campaign = await wa.createCampaign({
  name: 'May promo',
  message: 'Hi {{name}}, enjoy 20% off this week!',
  contacts: [
    { phone: '6281234567890', name: 'Andi', variables: { name: 'Andi' } },
    { phone: '6289876543210', name: 'Budi' },
  ],
  delaySeconds: 5,
});

await wa.sendCampaign(campaign.data.id);
```

## Error handling

Any non-2xx response throws a `LoginWAError`:

```js
import { LoginWAError } from '@loginwa/sdk';

try {
  await wa.sendText({ phone: '6281234567890', message: 'hi' });
} catch (e) {
  if (e instanceof LoginWAError) {
    console.error(e.status, e.message, e.data);
  }
}
```

## Auth & base URL

- Header: `Authorization: Bearer <SECRET_API_KEY>` (set automatically)
- Default base URL: `https://api.loginwa.com/api/v1` (override via `baseUrl`)
