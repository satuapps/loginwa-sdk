# @loginwa/mcp

Unofficial [Model Context Protocol](https://modelcontextprotocol.io) server for the [LoginWA](https://loginwa.com) WhatsApp API.

**USP:** no VPS, LoginWA hosts the WhatsApp engine. Free tier available; see [pricing](https://loginwa.com/pricing). This package is an **unofficial** community-oriented MCP wrapper around the public HTTP API.

Pair devices in the browser at [loginwa.com/welcome](https://loginwa.com/welcome). Register with MCP attribution: [loginwa.com/register?utm_source=mcp](https://loginwa.com/register?utm_source=mcp).

## Tools (P0)

| Tool | Purpose |
|------|---------|
| `device_status` | List devices or fetch one by id. Reports offline honestly and points to `/welcome` for pairing. |
| `otp_start` | Start a WhatsApp OTP session |
| `otp_verify` | Verify an OTP code |
| `send_message` | Send text or media |
| `list_campaigns` | List broadcast campaigns |
| `get_campaign` | Campaign details |
| `create_campaign` | Create campaign with inline contacts |
| `send_campaign` | Queue a campaign to send (needs an online device) |

**Not in P0:** in-chat QR / pairing-code TTL racing or auto-reissue. That remains a future **P1** note, use the dashboard welcome page today.

## Auth

Set `LOGINWA_API_KEY` to your dashboard API key secret. Requests go to `https://api.loginwa.com` with `Authorization: Bearer <key>` (and `X-Api-Key` for compatibility).

Optional: `LOGINWA_BASE_URL` (default `https://api.loginwa.com/api/v1`).

## Install snippets

After publish (`npm i -g @loginwa/mcp`) or from a local checkout (`npm run build` then `node /absolute/path/to/dist/index.js`).

### Cursor

`~/.cursor/mcp.json` (or project `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "loginwa": {
      "command": "npx",
      "args": ["-y", "@loginwa/mcp"],
      "env": {
        "LOGINWA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add loginwa --env LOGINWA_API_KEY=YOUR_API_KEY -- npx -y @loginwa/mcp
```

Or in `~/.claude.json` / project MCP config:

```json
{
  "mcpServers": {
    "loginwa": {
      "command": "npx",
      "args": ["-y", "@loginwa/mcp"],
      "env": { "LOGINWA_API_KEY": "YOUR_API_KEY" }
    }
  }
}
```

### Codex (OpenAI)

`~/.codex/config.toml` (or equivalent MCP section):

```toml
[mcp_servers.loginwa]
command = "npx"
args = ["-y", "@loginwa/mcp"]

[mcp_servers.loginwa.env]
LOGINWA_API_KEY = "YOUR_API_KEY"
```

### VS Code (GitHub Copilot MCP)

`.vscode/mcp.json`:

```json
{
  "servers": {
    "loginwa": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@loginwa/mcp"],
      "env": {
        "LOGINWA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

### Windsurf / Cline

Same stdio shape as Cursor, add under MCP servers:

```json
{
  "mcpServers": {
    "loginwa": {
      "command": "npx",
      "args": ["-y", "@loginwa/mcp"],
      "env": { "LOGINWA_API_KEY": "YOUR_API_KEY" }
    }
  }
}
```

### OpenClaw

```json
{
  "mcpServers": {
    "loginwa": {
      "command": "npx",
      "args": ["-y", "@loginwa/mcp"],
      "env": { "LOGINWA_API_KEY": "YOUR_API_KEY" }
    }
  }
}
```

### Hermes

```json
{
  "mcp": {
    "loginwa": {
      "command": "npx",
      "args": ["-y", "@loginwa/mcp"],
      "env": { "LOGINWA_API_KEY": "YOUR_API_KEY" }
    }
  }
}
```

| Client | Config location (typical) | Command |
|--------|---------------------------|---------|
| Cursor | `~/.cursor/mcp.json` | `npx -y @loginwa/mcp` |
| Claude Code | `claude mcp add` / Claude MCP JSON | same |
| Codex | `~/.codex/config.toml` | same |
| VS Code | `.vscode/mcp.json` | same |
| Windsurf / Cline | IDE MCP settings | same |
| OpenClaw | host MCP JSON | same |
| Hermes | host MCP JSON | same |

## Run locally (from this repo)

```bash
cd server-code/laravel-app/sdk/mcp
npm install
npm run build
export LOGINWA_API_KEY=YOUR_API_KEY
node dist/index.js
```

Dev (tsx, no build):

```bash
LOGINWA_API_KEY=YOUR_API_KEY npm run dev
```

Inspector:

```bash
LOGINWA_API_KEY=YOUR_API_KEY npx @modelcontextprotocol/inspector node dist/index.js
```

Local Cursor entry (before npm publish):

```json
{
  "mcpServers": {
    "loginwa": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/loginwa/server-code/laravel-app/sdk/mcp/dist/index.js"],
      "env": { "LOGINWA_API_KEY": "YOUR_API_KEY" }
    }
  }
}
```

## Publish to npm / catalogs

Full steps (create `@loginwa` org in the browser, `npm publish --access public`, Smithery, Glama): see **[PUBLISH.md](./PUBLISH.md)**.

Until published, clients can run from a git checkout via `node …/dist/index.js` as above.

## License

MIT, see [LICENSE](./LICENSE).
