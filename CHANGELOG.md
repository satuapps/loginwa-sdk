# Changelog

## 0.3.0 — Reverse OTP
- `startReverseOtp` / `getReverseOtp` on JS and PHP SDKs (`POST /api/v1/auth/reverse/start`, `GET /api/v1/auth/reverse/{session_id}`). The user sends `LOGIN <code>` to your number; LoginWA sends nothing and bills only on success.
- Webhook events `otp.verified` and `otp.expired`.
- MCP server `@loginwa/mcp` 0.2.0: `reverse_otp_start` and `reverse_otp_status` tools (12 tools).
- `otp_start` / `messageTemplate` docs name the real placeholders `{code}`, `{ttl}` (minutes) and `{app}`; the old `{{otp}}` hint was never substituted.

## 0.2.2 — Delete, status, reply_to
- `deleteMessage` / `getMessage` on JS and PHP SDKs.
- Send accepts `reply_to` (`{ id, remote_jid?, from_me? }`; aliases `replyTo` / `quoted`).
- Send response includes `message_id` (WhatsApp key.id) and `remote_jid` for later delete.

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
