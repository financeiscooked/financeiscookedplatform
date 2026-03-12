# financeiscooked MCP Server

MCP (Model Context Protocol) server for the **financeiscooked** platform API. Provides 18 tools across 5 categories for managing YouTube show episodes, segments, slides, votes, and admin operations.

## Tools (18)

| Category | Tools |
|----------|-------|
| **Episodes** (5) | `episodes_list`, `episode_get`, `episode_create`, `episode_update`, `episode_delete` |
| **Segments** (3) | `segment_create`, `segment_update`, `segment_delete` |
| **Slides** (5) | `slide_create`, `slide_update`, `slide_delete`, `slide_move`, `slide_finalize` |
| **Votes** (2) | `vote_cast`, `votes_get` |
| **Admin** (3) | `admin_seed`, `admin_stats`, `health_check` |

## Setup

```bash
git clone https://github.com/financeiscooked/financeiscookedplatform.git
cd financeiscookedplatform/mcp-server
npm install
npm run build
```

## Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "financeiscooked": {
      "command": "node",
      "args": ["/Users/oreph/Desktop/APPs/financeiscookedplatform/mcp-server/dist/index.js"]
    }
  }
}
```

To use a custom API URL (e.g., local development):

```json
{
  "mcpServers": {
    "financeiscooked": {
      "command": "node",
      "args": ["/Users/oreph/Desktop/APPs/financeiscookedplatform/mcp-server/dist/index.js"],
      "env": {
        "FINANCEISCOOKED_API_URL": "http://localhost:3001"
      }
    }
  }
}
```

## Testing

```bash
npm test
```

Runs all tools against the live API at `https://backend-production-0e40.up.railway.app`.

## API

- **Base URL:** `https://backend-production-0e40.up.railway.app`
- **Auth:** None (public API)
- **Response format:** `{ ok: true, data: ... }` or `{ ok: false, error: "message" }`
- **API Docs:** https://backend-production-0e40.up.railway.app/api/docs

## Documentation

Open `docs/index.html` for interactive tool reference with search, parameter tables, and example responses.
