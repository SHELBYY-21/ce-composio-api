# CE Composio API

Secure Composio session gateway for CE AI OS and CE VAULT.

## Endpoints

- `GET /health` — health check
- `POST /v1/sessions` — create a scoped Composio session with hosted MCP access

## Create a session

```bash
curl -X POST "$BASE_URL/v1/sessions" \
  -H "Authorization: Bearer $CE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"ce-vault-user","toolkits":["gmail","github"]}'
```

The response contains `sessionId` and session-scoped `mcp` connection details. Store and reuse the session ID instead of creating a new session for every turn.

## Environment variables

- `COMPOSIO_API_KEY` — required secret from Composio
- `CE_API_TOKEN` — required bearer token, minimum 24 characters
- `PORT` — injected by Render; defaults to `10000`

Never commit real secrets.
  
