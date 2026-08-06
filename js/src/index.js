/**
 * LoginWA JavaScript SDK
 *
 * A thin, dependency-free client for the LoginWA WhatsApp API (v1).
 * Works in Node 18+ and modern browsers (uses the global `fetch`).
 *
 * Covers: OTP, messaging (text + media), number check, devices (QR &
 * pairing-code linking, groups), webhooks, broadcast campaigns, and the
 * IP whitelist.
 *
 *   import LoginWAClient from '@loginwa/sdk';
 *   const wa = new LoginWAClient({ apiKey: process.env.LOGINWA_API_KEY });
 *   await wa.sendText({ phone: '6281234567890', message: 'Hello!' });
 *
 * Keep your API key on the server side — never ship it to a browser bundle.
 */

const DEFAULT_BASE_URL = 'https://api.loginwa.com/api/v1';

/** Drop keys whose value is `undefined` so we never send them in the body. */
function compact(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/**
 * Error thrown for any non-2xx API response.
 * `status` is the HTTP status code and `data` the parsed JSON body (if any).
 */
export class LoginWAError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'LoginWAError';
    this.status = status;
    this.data = data;
  }
}

async function request(client, method, path, { body, query } = {}) {
  let url = `${client.baseUrl}${path}`;

  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) params.append(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const options = {
    method,
    headers: { Authorization: `Bearer ${client.apiKey}` },
  };

  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // No / invalid JSON body — handled by the status check below.
  }

  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP ${res.status}`;
    throw new LoginWAError(message, res.status, data);
  }

  return data;
}

export class LoginWAClient {
  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL } = {}) {
    if (!apiKey) throw new Error('apiKey is required');
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  // --- low-level verbs (exposed for endpoints not yet wrapped) -------------

  _get(path, query) {
    return request(this, 'GET', path, { query });
  }

  _post(path, body = {}) {
    return request(this, 'POST', path, { body });
  }

  _put(path, body = {}) {
    return request(this, 'PUT', path, { body });
  }

  _delete(path) {
    return request(this, 'DELETE', path);
  }

  // --- OTP -----------------------------------------------------------------

  /**
   * Start an OTP flow. Returns { session_id, expires_in, ... }.
   * @param {Object} params
   * @param {string} params.phone - e.g. 6281234567890
   * @param {string} [params.countryCode]
   * @param {number} [params.otpLength] - 4..8
   * @param {string} [params.messageTemplate]
   * @param {string} [params.deviceId]
   * @param {Object} [params.meta]
   */
  async startOtp(params) {
    return this._post('/auth/start', compact({
      phone: params.phone,
      country_code: params.countryCode,
      otp_length: params.otpLength,
      message_template: params.messageTemplate,
      device_id: params.deviceId,
      meta: params.meta,
    }));
  }

  /**
   * Verify an OTP code against a session.
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} params.otpCode
   */
  async verifyOtp(params) {
    return this._post('/auth/verify', compact({
      session_id: params.sessionId,
      otp_code: params.otpCode,
    }));
  }

  // --- Messaging -----------------------------------------------------------

  /**
   * Send a WhatsApp message (text or media). For media types, `mediaUrl`
   * must be a public https URL the engine can fetch.
   * @param {Object} params
   * @param {string} params.phone
   * @param {string} [params.message]   - required for text
   * @param {'text'|'image'|'video'|'document'|'audio'} [params.type='text']
   * @param {string} [params.mediaUrl]  - required for media types
   * @param {string} [params.caption]
   * @param {string} [params.filename]  - for documents
   * @param {string} [params.mimetype]
   * @param {boolean} [params.ptt]      - send audio as a voice note
   * @param {string} [params.deviceId]
   * @param {Object} [params.meta]
   */
  async sendMessage(params) {
    return this._post('/messages/send', compact({
      phone: params.phone,
      message: params.message,
      type: params.type,
      media_url: params.mediaUrl,
      caption: params.caption,
      filename: params.filename,
      mimetype: params.mimetype,
      ptt: params.ptt,
      device_id: params.deviceId,
      meta: params.meta,
    }));
  }

  /** Convenience: send a plain text message. */
  sendText({ phone, message, deviceId, meta } = {}) {
    return this.sendMessage({ phone, message, type: 'text', deviceId, meta });
  }

  /** Convenience: send an image by public URL. */
  sendImage({ phone, mediaUrl, caption, deviceId, meta } = {}) {
    return this.sendMessage({ phone, type: 'image', mediaUrl, caption, deviceId, meta });
  }

  /** Convenience: send a video by public URL. */
  sendVideo({ phone, mediaUrl, caption, deviceId, meta } = {}) {
    return this.sendMessage({ phone, type: 'video', mediaUrl, caption, deviceId, meta });
  }

  /** Convenience: send a document by public URL. */
  sendDocument({ phone, mediaUrl, filename, caption, mimetype, deviceId, meta } = {}) {
    return this.sendMessage({ phone, type: 'document', mediaUrl, filename, caption, mimetype, deviceId, meta });
  }

  /** Convenience: send audio by public URL (set ptt:true for a voice note). */
  sendAudio({ phone, mediaUrl, ptt, mimetype, deviceId, meta } = {}) {
    return this.sendMessage({ phone, type: 'audio', mediaUrl, ptt, mimetype, deviceId, meta });
  }

  /**
   * Check which numbers are registered on WhatsApp before sending.
   * @param {Object} params
   * @param {string[]} params.phones - up to 100
   * @param {string} [params.deviceId]
   */
  async checkNumbers(params) {
    return this._post('/numbers/check', compact({
      phones: params.phones,
      device_id: params.deviceId,
    }));
  }

  // --- Devices -------------------------------------------------------------

  /** List the devices connected to this app. */
  listDevices() {
    return this._get('/devices');
  }

  /** Register a new device and start QR pairing (returns 202, then poll getDevice). */
  createDevice({ label } = {}) {
    return this._post('/devices', compact({ label }));
  }

  /** Get a device's status (and QR token while it is qr_waiting). */
  getDevice(deviceId) {
    return this._get(`/devices/${encodeURIComponent(deviceId)}`);
  }

  /** Disconnect and remove a device. */
  deleteDevice(deviceId) {
    return this._delete(`/devices/${encodeURIComponent(deviceId)}`);
  }

  /** Request a fresh QR code for a device that is not yet connected. */
  refreshQr(deviceId) {
    return this._post(`/devices/${encodeURIComponent(deviceId)}/refresh-qr`);
  }

  /**
   * Link a device WITHOUT scanning a QR: pass the phone number and get back
   * an 8-character pairing code to enter on the phone.
   */
  requestPairingCode(deviceId, phone) {
    return this._post(`/devices/${encodeURIComponent(deviceId)}/pairing-code`, compact({ phone }));
  }

  /** List the WhatsApp groups a connected device participates in. */
  listGroups(deviceId) {
    return this._get(`/devices/${encodeURIComponent(deviceId)}/groups`);
  }

  // --- Webhooks ------------------------------------------------------------

  /** List configured webhooks (and the available event names). */
  listWebhooks() {
    return this._get('/webhooks');
  }

  /**
   * Register a webhook. The secret is only returned once on creation.
   * @param {Object} params
   * @param {string} params.url
   * @param {string[]} [params.events]
   * @param {string} [params.secret]
   * @param {number} [params.retryCount]
   */
  createWebhook(params) {
    return this._post('/webhooks', compact({
      url: params.url,
      events: params.events,
      secret: params.secret,
      retry_count: params.retryCount,
    }));
  }

  /** Get a webhook by id. */
  getWebhook(id) {
    return this._get(`/webhooks/${encodeURIComponent(id)}`);
  }

  /** Update a webhook (only the fields you pass are changed). */
  updateWebhook(id, params = {}) {
    return this._put(`/webhooks/${encodeURIComponent(id)}`, compact({
      url: params.url,
      events: params.events,
      active: params.active,
      secret: params.secret,
      retry_count: params.retryCount,
    }));
  }

  /** Delete a webhook. */
  deleteWebhook(id) {
    return this._delete(`/webhooks/${encodeURIComponent(id)}`);
  }

  /** Rotate a webhook's signing secret (returns the new secret once). */
  regenerateWebhookSecret(id) {
    return this._post(`/webhooks/${encodeURIComponent(id)}/regenerate-secret`);
  }

  /** Send a signed test event to a webhook. */
  testWebhook(id) {
    return this._post(`/webhooks/${encodeURIComponent(id)}/test`);
  }

  // --- Broadcast campaigns -------------------------------------------------

  /** List broadcast campaigns (paginated). */
  listCampaigns({ page } = {}) {
    return this._get('/broadcast/campaigns', compact({ page }));
  }

  /**
   * Create a broadcast campaign with an inline contact list. It starts in
   * `draft` (or `queued` when `scheduleAt` is given); call sendCampaign to begin.
   * @param {Object} params
   * @param {string} params.name
   * @param {string} params.message - supports {{variables}}
   * @param {Array<{phone:string,name?:string,variables?:Object}>} params.contacts
   * @param {string} [params.mediaUrl]
   * @param {'image'|'document'|'video'|'audio'} [params.mediaType]
   * @param {number} [params.delaySeconds] - 1..60 between messages
   * @param {string} [params.scheduleAt]   - ISO datetime in the future
   */
  createCampaign(params) {
    return this._post('/broadcast/campaigns', compact({
      name: params.name,
      message: params.message,
      contacts: params.contacts,
      media_url: params.mediaUrl,
      media_type: params.mediaType,
      delay_seconds: params.delaySeconds,
      schedule_at: params.scheduleAt,
    }));
  }

  /** Get a campaign (includes message/media details). */
  getCampaign(campaignId) {
    return this._get(`/broadcast/campaigns/${encodeURIComponent(campaignId)}`);
  }

  /** Start (or resume queueing) a campaign. */
  sendCampaign(campaignId) {
    return this._post(`/broadcast/campaigns/${encodeURIComponent(campaignId)}/send`);
  }

  /** Pause a sending campaign. */
  pauseCampaign(campaignId) {
    return this._post(`/broadcast/campaigns/${encodeURIComponent(campaignId)}/pause`);
  }

  /** Resume a paused campaign. */
  resumeCampaign(campaignId) {
    return this._post(`/broadcast/campaigns/${encodeURIComponent(campaignId)}/resume`);
  }

  /** Delete a campaign (pause it first if it is sending). */
  deleteCampaign(campaignId) {
    return this._delete(`/broadcast/campaigns/${encodeURIComponent(campaignId)}`);
  }

  /**
   * List a campaign's contacts and their per-contact status (paginated).
   * @param {string} campaignId
   * @param {Object} [opts]
   * @param {'pending'|'sending'|'sent'|'failed'} [opts.status] - filter
   */
  getCampaignContacts(campaignId, { status } = {}) {
    return this._get(`/broadcast/campaigns/${encodeURIComponent(campaignId)}/contacts`, compact({ status }));
  }

  // --- IP whitelist --------------------------------------------------------

  /** List whitelisted IPs and whether restriction is enabled. */
  listIpWhitelist() {
    return this._get('/ip-whitelist');
  }

  /** Add an IP to the whitelist. */
  addIp({ ipAddress, label } = {}) {
    return this._post('/ip-whitelist', compact({ ip_address: ipAddress, label }));
  }

  /** Remove an IP from the whitelist by entry id. */
  removeIp(id) {
    return this._delete(`/ip-whitelist/${encodeURIComponent(id)}`);
  }

  /** Enable or disable IP restriction for this API key. */
  setIpRestriction(enabled) {
    return this._post('/ip-whitelist/toggle', { enabled: !!enabled });
  }
}

/** Strip everything but digits from a phone number. */
export function formatPhone(phone) {
  return (phone || '').replace(/[^0-9]/g, '');
}

export default LoginWAClient;
