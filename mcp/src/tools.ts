import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { LoginWAApiError, LoginWAClient } from './client.js';
import { PAIRING_GUIDANCE, PRICING_URL, REGISTER_URL, WELCOME_URL } from './constants.js';

type DeviceLike = {
  id?: string;
  device_id?: string;
  label?: string | null;
  status?: string;
  phone_number?: string | null;
  is_online?: boolean;
  last_seen_at?: string | null;
  created_at?: string | null;
  qr_code?: string | null;
};

function text(payload: unknown, isError = false) {
  return {
    content: [
      {
        type: 'text' as const,
        text: typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2),
      },
    ],
    isError,
  };
}

function errorResult(err: unknown) {
  if (err instanceof LoginWAApiError) {
    return text(
      {
        error: true,
        status: err.status,
        message: err.message,
        data: err.data,
        hint:
          err.status === 401
            ? 'Check LOGINWA_API_KEY. Get a key after registering at ' + REGISTER_URL
            : err.status === 402
              ? `Subscription inactive or past due. See ${PRICING_URL}`
              : undefined,
      },
      true,
    );
  }
  const message = err instanceof Error ? err.message : String(err);
  return text({ error: true, message }, true);
}

function isOnline(device: DeviceLike): boolean {
  if (typeof device.is_online === 'boolean') return device.is_online;
  return device.status === 'online';
}

function summarizeDevices(devices: DeviceLike[]) {
  const online = devices.filter(isOnline);
  const offline = devices.filter((d) => !isOnline(d));

  const lines: string[] = [
    `Found ${devices.length} device(s): ${online.length} online, ${offline.length} not online.`,
  ];

  for (const d of devices) {
    const id = d.id ?? d.device_id ?? '(unknown id)';
    const onlineFlag = isOnline(d) ? 'ONLINE' : 'NOT ONLINE';
    lines.push(
      `- ${id} | ${onlineFlag} | status=${d.status ?? 'unknown'} | label=${d.label ?? '-'} | phone=${d.phone_number ?? '-'} | last_seen_at=${d.last_seen_at ?? 'null'}`,
    );
  }

  if (offline.length > 0 || devices.length === 0) {
    lines.push('');
    lines.push(PAIRING_GUIDANCE);
  }

  return {
    summary: lines.join('\n'),
    welcome_url: WELCOME_URL,
    pricing_url: PRICING_URL,
    register_url: REGISTER_URL,
    devices,
    online_count: online.length,
    offline_count: offline.length,
  };
}

/**
 * Register P0 LoginWA tools on an MCP server instance.
 *
 * Future P1 (not implemented): in-chat pairing code / QR auto-reissue races.
 */
export function registerTools(server: McpServer, client: LoginWAClient): void {
  server.registerTool(
    'device_status',
    {
      title: 'Device status',
      description:
        'List LoginWA WhatsApp devices (or one device by id) and report online/offline honestly. ' +
        `If a device is not online, instruct the user to open ${WELCOME_URL} to pair. ` +
        'Does not start in-chat QR/pairing races.',
      inputSchema: {
        device_id: z
          .string()
          .optional()
          .describe('Optional device id. When omitted, lists all devices.'),
      },
    },
    async ({ device_id }) => {
      try {
        if (device_id) {
          const raw = (await client.getDevice(device_id)) as DeviceLike;
          const online = isOnline(raw);
          const payload = {
            device: raw,
            is_online: online,
            guidance: online ? null : PAIRING_GUIDANCE,
            welcome_url: WELCOME_URL,
            pricing_url: PRICING_URL,
            register_url: REGISTER_URL,
          };
          return text(payload);
        }

        const raw = (await client.listDevices()) as {
          devices?: DeviceLike[];
          count?: number;
        };
        const devices = Array.isArray(raw.devices) ? raw.devices : [];
        return text(summarizeDevices(devices));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    'otp_start',
    {
      title: 'Start OTP',
      description:
        'Start a LoginWA OTP session: send a one-time code to a WhatsApp phone number via a connected device.',
      inputSchema: {
        phone: z.string().describe('Recipient phone (E.164 or digits, e.g. 6281234567890)'),
        country_code: z.string().optional().describe('Optional country code digits, e.g. 62'),
        otp_length: z.number().int().min(4).max(8).optional().describe('OTP length 4..8 (default 6)'),
        message_template: z
          .string()
          .optional()
          .describe('Optional message template; use {{otp}} placeholder if customizing'),
        device_id: z.string().optional().describe('Optional device to send from'),
      },
    },
    async (args) => {
      try {
        const data = await client.startOtp({
          phone: args.phone,
          country_code: args.country_code,
          otp_length: args.otp_length,
          message_template: args.message_template,
          device_id: args.device_id,
        });
        return text(data);
      } catch (err) {
        if (err instanceof LoginWAApiError && /device|online|connect/i.test(err.message)) {
          return text(
            {
              error: true,
              status: err.status,
              message: err.message,
              data: err.data,
              guidance: PAIRING_GUIDANCE,
            },
            true,
          );
        }
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    'otp_verify',
    {
      title: 'Verify OTP',
      description: 'Verify an OTP code against a LoginWA session_id returned by otp_start.',
      inputSchema: {
        session_id: z.string().describe('OTP session_id from otp_start'),
        otp_code: z.string().describe('Code entered by the user'),
      },
    },
    async ({ session_id, otp_code }) => {
      try {
        const data = await client.verifyOtp({ session_id, otp_code });
        return text(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    'send_message',
    {
      title: 'Send WhatsApp message',
      description:
        'Send a WhatsApp text or media message from a connected LoginWA device. ' +
        'Media types require a public https media_url.',
      inputSchema: {
        phone: z
          .string()
          .describe('Recipient phone (E.164/digits) or group JID (...@g.us)'),
        message: z.string().optional().describe('Text body (required for type=text)'),
        type: z
          .enum(['text', 'image', 'video', 'document', 'audio'])
          .optional()
          .describe('Message type (default text)'),
        media_url: z.string().url().optional().describe('Public https URL for media types'),
        caption: z.string().optional().describe('Optional caption for media'),
        filename: z.string().optional().describe('Optional document filename'),
        mimetype: z.string().optional().describe('Optional MIME type hint'),
        ptt: z.boolean().optional().describe('For audio: send as voice note when true'),
        device_id: z.string().optional().describe('Optional device to send from'),
      },
    },
    async (args) => {
      try {
        const data = await client.sendMessage({
          phone: args.phone,
          message: args.message,
          type: args.type,
          media_url: args.media_url,
          caption: args.caption,
          filename: args.filename,
          mimetype: args.mimetype,
          ptt: args.ptt,
          device_id: args.device_id,
        });
        return text(data);
      } catch (err) {
        if (err instanceof LoginWAApiError && /device|online|connect/i.test(err.message)) {
          return text(
            {
              error: true,
              status: err.status,
              message: err.message,
              data: err.data,
              guidance: PAIRING_GUIDANCE,
            },
            true,
          );
        }
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    'list_campaigns',
    {
      title: 'List broadcast campaigns',
      description: 'List LoginWA broadcast campaigns (paginated).',
      inputSchema: {
        page: z.number().int().min(1).optional().describe('Page number (default 1)'),
      },
    },
    async ({ page }) => {
      try {
        const data = await client.listCampaigns(page);
        return text(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    'get_campaign',
    {
      title: 'Get broadcast campaign',
      description: 'Get details for a LoginWA broadcast campaign by id.',
      inputSchema: {
        campaign_id: z.string().describe('Campaign id'),
      },
    },
    async ({ campaign_id }) => {
      try {
        const data = await client.getCampaign(campaign_id);
        return text(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    'create_campaign',
    {
      title: 'Create broadcast campaign',
      description:
        'Create a LoginWA broadcast campaign with an inline contact list. Starts as draft (or queued if schedule_at is set). Call send_campaign to begin.',
      inputSchema: {
        name: z.string().describe('Campaign name'),
        message: z
          .string()
          .describe('Message body; supports {{name}} and custom {{variables}}'),
        contacts: z
          .array(
            z.object({
              phone: z.string(),
              name: z.string().optional(),
              variables: z.record(z.string(), z.unknown()).optional(),
            }),
          )
          .min(1)
          .describe('Inline contact list'),
        media_url: z.string().url().optional().describe('Optional public media URL'),
        media_type: z
          .enum(['image', 'document', 'video', 'audio'])
          .optional()
          .describe('Required when media_url is set'),
        delay_seconds: z
          .number()
          .int()
          .min(1)
          .max(60)
          .optional()
          .describe('Delay between sends (1..60, default 5)'),
        schedule_at: z
          .string()
          .optional()
          .describe('Optional future ISO datetime to auto-start'),
      },
    },
    async (args) => {
      try {
        const data = await client.createCampaign({
          name: args.name,
          message: args.message,
          contacts: args.contacts,
          media_url: args.media_url,
          media_type: args.media_type,
          delay_seconds: args.delay_seconds,
          schedule_at: args.schedule_at,
        });
        return text(data);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    'send_campaign',
    {
      title: 'Send broadcast campaign',
      description:
        'Queue a draft/queued/paused LoginWA campaign for sending. Requires at least one online device; otherwise direct the user to ' +
        WELCOME_URL,
      inputSchema: {
        campaign_id: z.string().describe('Campaign id to send'),
      },
    },
    async ({ campaign_id }) => {
      try {
        const data = await client.sendCampaign(campaign_id);
        return text(data);
      } catch (err) {
        if (err instanceof LoginWAApiError) {
          return text(
            {
              error: true,
              status: err.status,
              message: err.message,
              data: err.data,
              guidance: PAIRING_GUIDANCE,
            },
            true,
          );
        }
        return errorResult(err);
      }
    },
  );
}
