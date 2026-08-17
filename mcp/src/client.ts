import { DEFAULT_BASE_URL } from './constants.js';

export class LoginWAApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'LoginWAApiError';
    this.status = status;
    this.data = data;
  }
}

function compact<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export type LoginWAClientOptions = {
  apiKey: string;
  baseUrl?: string;
};

/**
 * Thin fetch client for LoginWA public API v1.
 * Auth: Authorization Bearer (also accepts X-Api-Key via the same secret).
 */
export class LoginWAClient {
  readonly apiKey: string;
  readonly baseUrl: string;

  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL }: LoginWAClientOptions) {
    if (!apiKey) throw new Error('LOGINWA_API_KEY is required');
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private async request(
    method: string,
    path: string,
    { body, query }: { body?: unknown; query?: Record<string, unknown> } = {},
  ): Promise<unknown> {
    let url = `${this.baseUrl}${path}`;
    if (query) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) params.append(k, String(v));
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'X-Api-Key': this.apiKey,
      Accept: 'application/json',
      'User-Agent': '@loginwa/mcp',
    };

    const init: RequestInit = { method, headers };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    const res = await fetch(url, init);
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // non-JSON body
    }

    if (!res.ok) {
      const msg =
        (data && typeof data === 'object' && ('message' in data || 'error' in data)
          ? String((data as { message?: string; error?: string }).message
              ?? (data as { error?: string }).error)
          : null) || `HTTP ${res.status}`;
      throw new LoginWAApiError(msg, res.status, data);
    }

    return data;
  }

  listDevices() {
    return this.request('GET', '/devices');
  }

  getDevice(deviceId: string) {
    return this.request('GET', `/devices/${encodeURIComponent(deviceId)}`);
  }

  startOtp(body: Record<string, unknown>) {
    return this.request('POST', '/auth/start', { body: compact(body) });
  }

  verifyOtp(body: Record<string, unknown>) {
    return this.request('POST', '/auth/verify', { body: compact(body) });
  }

  sendMessage(body: Record<string, unknown>) {
    return this.request('POST', '/messages/send', { body: compact(body) });
  }

  listCampaigns(page?: number) {
    return this.request('GET', '/broadcast/campaigns', {
      query: page !== undefined ? { page } : undefined,
    });
  }

  getCampaign(campaignId: string) {
    return this.request('GET', `/broadcast/campaigns/${encodeURIComponent(campaignId)}`);
  }

  createCampaign(body: Record<string, unknown>) {
    return this.request('POST', '/broadcast/campaigns', { body: compact(body) });
  }

  sendCampaign(campaignId: string) {
    return this.request('POST', `/broadcast/campaigns/${encodeURIComponent(campaignId)}/send`);
  }
}
