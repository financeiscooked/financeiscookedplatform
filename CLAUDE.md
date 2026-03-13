# financeiscooked Platform

## Stack
- **Backend**: TypeScript, Express 5, Prisma, PostgreSQL
- **Frontend**: React 19 (JSX), Vite 8, Tailwind CSS v3
- **MCP Server**: TypeScript, @modelcontextprotocol/sdk, Zod

## Running Dev Servers

**Backend** (port 3001):
```bash
cd backend && npm run dev
```

**Frontend** (port 5173):
```bash
cd frontend && npm run dev
```

## Production URLs
- Frontend: https://frontend-production-54e9.up.railway.app
- Backend API: https://backend-production-0e40.up.railway.app
- API Docs: https://backend-production-0e40.up.railway.app/api/docs
- GitHub: https://github.com/financeiscooked/financeiscookedplatform

## Railway
- Project: financeiscooked-platform
- Deploy token: `a50a135b-4379-4970-acdb-7878a76b515c`
- **IMPORTANT**: Always deploy from the PROJECT ROOT (both services have `rootDirectory` set on Railway)
- Deploy backend: `RAILWAY_TOKEN=<token> railway up -s backend`
- Deploy frontend: `RAILWAY_TOKEN=<token> railway up -s frontend`

## New Feature Checklist — MANDATORY

Every new API endpoint or feature MUST update ALL of these:

1. **Backend route** — Add/modify route in `backend/src/routes/`
2. **API docs** — Update `backend/src/api-docs/api-docs.html` with the new endpoint
3. **Comprehensive tests** — Add tests to `backend/Comprehensive Test Suite/{Domain}/`
4. **MCP server api-client** — Add method to `mcp-server/src/api-client.ts`
5. **MCP server tools** — Add tool definition to `mcp-server/src/tools.ts`
6. **MCP server rebuild** — Run `cd mcp-server && npm run build`
7. **MCP docs (frontend)** — Update `frontend/src/components/McpDocs.jsx` TOOL_DOCS array
8. **MCP docs (standalone)** — Update `mcp-server/docs/index.html` TOOLS array

This ensures the API, tests, API docs, MCP tools, and MCP docs all stay in sync. Skipping any step creates drift that breaks the agent workflow.

## Testing

Run the full API test suite:
```bash
cd backend && node "Comprehensive Test Suite/run-all-tests.js"
```

Run individual domain tests:
```bash
node "Comprehensive Test Suite/Episodes/episodes-tests.js"
node "Comprehensive Test Suite/Slides/slides-tests.js"
```

## Project Structure
```
financeiscookedplatform/
├── backend/           # Express + Prisma API
│   ├── src/routes/    # API endpoints
│   ├── src/api-docs/  # Swagger-like API docs HTML
│   ├── prisma/        # Database schema
│   └── Comprehensive Test Suite/  # API tests
├── frontend/          # React + Vite app
│   ├── src/components/  # React components
│   └── public/        # Static assets (sounds, memes, images)
└── mcp-server/        # MCP server for Claude
    ├── src/           # Server source (api-client, tools, index, hub-server)
    ├── docs/          # Standalone MCP docs HTML
    └── test/          # MCP tool tests
```

## Auth
No auth currently (public API). User model exists in schema for future use with roles: anonymous, basic, advanced, admin.

## Response Format
All API responses: `{ ok: true, data: ... }` or `{ ok: false, error: "message" }`
