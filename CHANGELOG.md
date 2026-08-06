# Changelog

## 0.2.1 — Docs & contract alignment
- Document correct production base URL (`https://api.loginwa.com`) and `/api/v1` SDK prefix.
- Cap `checkNumbers` docs/comments at **20** phones (API limit).
- Postman collection: add `numbers/check`, device `pairing-code`, and device `groups`.
- Android: read API `error` (and OTP `status`) from error bodies; treat a present `session_id` as start success.
- Common errors: `402 subscription_suspended`, `429 rate_limited`, `blocked` (not `max_attempts`).

## 0.2.0 — Messaging, devices, broadcast
- JavaScript and PHP SDKs cover messaging (text + media), number check, devices
  (QR + pairing-code + groups), webhooks, broadcast, and IP whitelist.
- Package metadata points at `https://github.com/satuapps/loginwa-sdk`.

## 0.1.0 — Initial release
- JavaScript SDK (`js`) with start/verify OTP helpers.
- PHP SDK (`php`) with start/verify OTP helpers.
- OTP widget snippet (`snippet/otp-widget.html`).
- Postman collection (`docs/postman/loginwa-api.postman_collection.json`).
- SDK quick reference and README.
