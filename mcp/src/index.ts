#!/usr/bin/env node
/**
 * @loginwa/mcp, unofficial LoginWA MCP server (stdio).
 *
 * Env:
 *   LOGINWA_API_KEY  required to call tools. The process starts without it so
 *                    unauthenticated clients (Glama checks) can list tools.
 *   LOGINWA_BASE_URL optional, default https://api.loginwa.com/api/v1
 *
 * Pairing: when devices are offline, tools point users to https://loginwa.com/welcome
 * (P0). In-chat pairing-code / QR auto-reissue is intentionally deferred to P1.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { LoginWAClient } from './client.js';
import { DEFAULT_BASE_URL, PRICING_URL, REGISTER_URL, WELCOME_URL } from './constants.js';
import { registerTools } from './tools.js';

const PACKAGE_VERSION = '0.1.2';

function createServer(): McpServer {
  const apiKey = process.env.LOGINWA_API_KEY?.trim() ?? '';
  const baseUrl = process.env.LOGINWA_BASE_URL?.trim() || DEFAULT_BASE_URL;
  const client = new LoginWAClient({ apiKey, baseUrl });

  if (!apiKey) {
    console.error(
      '[loginwa-mcp] LOGINWA_API_KEY is unset; tools are advertised, ' +
        'calls will fail until a key is provided. ' +
        `Register at ${REGISTER_URL} then create an API key in the dashboard.`,
    );
  }

  const server = new McpServer({
    name: 'loginwa',
    version: PACKAGE_VERSION,
  });

  server.registerResource(
    'loginwa-overview',
    'loginwa://overview',
    {
      title: 'LoginWA overview',
      description: 'What this unofficial MCP server can do and where to pair devices',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [
        {
          uri: 'loginwa://overview',
          mimeType: 'text/markdown',
          text: [
            '# LoginWA MCP (unofficial)',
            '',
            'Hosted WhatsApp API gateway, **no VPS required**. Free tier available.',
            `- Pair / reconnect devices: ${WELCOME_URL}`,
            `- Pricing: ${PRICING_URL}`,
            `- Register: ${REGISTER_URL}`,
            '',
            '## Tools (P0)',
            '- `device_status`, list devices; honestly report offline; send user to /welcome',
            '- `otp_start` / `otp_verify`, WhatsApp OTP flow',
            '- `send_message`, text/media send',
            '- `list_campaigns` / `get_campaign` / `create_campaign` / `send_campaign`, broadcast',
            '',
            '## Not in P0',
            'In-chat QR / pairing-code TTL racing and auto-reissue (planned P1).',
          ].join('\n'),
        },
      ],
    }),
  );

  registerTools(server, client);
  return server;
}

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[loginwa-mcp] running on stdio (v${PACKAGE_VERSION})`);
}

main().catch((err) => {
  console.error('[loginwa-mcp] fatal:', err);
  process.exit(1);
});
