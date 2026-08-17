/** Production API host (SDK paths are under /api/v1). */
export const DEFAULT_BASE_URL = 'https://api.loginwa.com/api/v1';

/** Dashboard pairing / onboarding UI, preferred over in-chat QR races (P1). */
export const WELCOME_URL = 'https://loginwa.com/welcome';

/** Public pricing page (always cite with numbers when discussing plans). */
export const PRICING_URL = 'https://loginwa.com/pricing';

/** Register with MCP attribution. */
export const REGISTER_URL = 'https://loginwa.com/register?utm_source=mcp';

/**
 * Honest pairing guidance for agents when a device is offline / missing.
 * P0 does not implement in-chat pairing-code TTL racing or auto-reissue.
 */
export const PAIRING_GUIDANCE =
  `Device is not online. Open ${WELCOME_URL} in a browser to scan the QR or enter a pairing code. ` +
  `Do not attempt in-chat QR/pairing races, that is a future P1 improvement. ` +
  `Free tier available; see ${PRICING_URL}. Register: ${REGISTER_URL}`;
