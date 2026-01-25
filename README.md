# FTP-server

## API Reference 📡

Base URL: `http://localhost:8085` (adjust if you run the server on a different port)

> Note: The project currently has these handler implementations:
> - **Start / Stop** (start/stop the local FTP server)
> - **Live logs** (SSE stream)
> - **Directory listing** (`/api/ftp/server/ls`)
> - **Client connect** helper (query-based)
>
> Some endpoints referenced in `mux.go` are not implemented yet: **get-file**, **connected-clients**, **server connect**, and **client auth**. See the "Backend notes / TODOs" section below.

---

### Endpoints

1) Start FTP server ✅

- **Endpoint:** `POST /api/ftp/server/start-ftp`
- **Description:** Start the local FTP server.
- **Request:** No body required.
- **Response:** `204 No Content` on success. `500` with error message on failure.
- **Example (curl):**

  curl -X POST http://localhost:8085/api/ftp/server/start-ftp


2) Stop FTP server ✅

- **Endpoint:** `POST /api/ftp/server/stop-ftp`
- **Description:** Stop the running FTP server.
- **Request:** No body required.
- **Response:** `204 No Content` on success.
- **Example (curl):**

  curl -X POST http://localhost:8085/api/ftp/server/stop-ftp


3) Live server logs (SSE) ✅

- **Endpoint:** `GET /api/logs`
- **Description:** Server-Sent Events stream of live logs. Response headers include `Content-Type: text/event-stream` and `Connection: keep-alive`.
- **Client (JS) example:**

  const evtSource = new EventSource('http://localhost:8085/api/logs');
  evtSource.onmessage = (e) => console.log('log:', e.data);

- **Notes:** The handler sets CORS header `Access-Control-Allow-Origin: *` for this route. Use `EventSource` or fetch streaming reader to receive logs.


4) List directory on server ✅

- **Endpoint:** `GET /api/ftp/server/ls`
- **Query params:**
  - `path` (optional) - path to directory on the FTP server. If omitted, defaults to `/` (root).
- **Description:** Returns the directory entries at the given path.
- **Response:** `200 OK` with JSON body containing a `Dir` object. Current server code uses Go structs without JSON tags, so JSON keys are exported Go field names (capitalized):

  Example response body:
  {
    "Entries": [
      { "Name": "subfolder", "IsFolder": true },
      { "Name": "file.txt", "IsFolder": false }
    ]
  }

- **Error codes:** `400` for invalid/non-directory path, `500` for internal errors.
- **Client (curl) example:**

  curl "http://localhost:8085/api/ftp/server/ls?path=/some/path"


5) Client connect helper (implemented) ✅

- **Endpoint (intended):** `POST /api/ftp/client/connect` or `GET /api/ftp/client/connect` (current implementation reads query params)
- **Query params (current code expects via URL query):**
  - `user` (required)
  - `pass` (required)
  - `server_addr` (required) — server address:port or host
- **Description:** Attempts to authenticate and connect a remote FTP server as a client.
- **Response:** `200 OK` JSON body via `sendJSON` helper on success (e.g., `"successfully connected"`) or errors (`400`/`4xx`) on failure.
- **Example (curl):**

  curl "http://localhost:8085/api/ftp/client/connect?user=test&pass=test&server_addr=192.168.1.2:21"

- **Note:** The handler currently reads credentials from query parameters. You may want to switch this to `POST` + JSON body for security in the future.


6) Stream file (NOT IMPLEMENTED - TODO) ⚠️

- **Endpoint (intended):** `GET /api/ftp/server/get-file`
- **Expected params:** `path` to the file to stream.
- **Expected behavior:** Stream raw file bytes with the proper `Content-Type` (based on file type) and appropriate content-disposition / range support if needed.
- **Current status:** Handler referenced in `mux.go` but implementation missing. Frontend should expect a raw file download/stream.


7) Connected clients (NOT IMPLEMENTED - TODO) ⚠️

- **Endpoint (intended):** `GET /api/ftp/server/connected-clients`
- **Expected response:** A JSON list of connected clients (e.g., remote addresses and optionally metadata). The server drivers maintain an in-memory `connectedClients` map.
- **Current status:** Route is registered in `mux.go` but handler is not implemented. Implementor should expose the `connectedClients` list via a handler.


8) Server-to-server connect & client auth (NOT IMPLEMENTED - TODO) ⚠️

- **Endpoints referenced:** `POST /api/ftp/server/connect` and `POST /api/ftp/client/auth`
- **Expected behavior:**
  - `server/connect`: connect this server to another FTP server (credentials + host)
  - `client/auth`: authenticate an incoming client connection attempt (for custom auth workflows)
- **Current status:** Handlers are referenced but not implemented.


---

## Examples & Quick snippets ✨

- Simple JS fetch to list directory:

  async function listDir(path = '/') {
    const res = await fetch(`/api/ftp/server/ls?path=${encodeURIComponent(path)}`);
    const json = await res.json();
    return json; // shape: { Entries: [ { Name, IsFolder } ] }
  }

- Start/Stop from front-end (POST no body):

  await fetch('/api/ftp/server/start-ftp', { method: 'POST' });
  await fetch('/api/ftp/server/stop-ftp', { method: 'POST' });

- Logs using EventSource:

  const es = new EventSource('/api/logs');
  es.onmessage = e => console.log('log:', e.data);


---

## Backend notes / TODOs 🔧

- mux.go uses `mux.HandleFunc("POST /api/ftp/server/start-ftp", handleStart)` etc. The `http.ServeMux` pattern should be the path only (e.g., `"/api/ftp/server/start-ftp"`). HTTP method checks should be done inside the handler or by using a router that supports method-based routes (e.g., gorilla/mux).
- Several routes referenced in `mux.go` are missing implementations: `handleStreamFile`, `handleConnectedClients`, `handleConnectToServer`, `handleAuthClient`.
- `sendJSON` writes JSON using Go exported field names (capitalized). Consider adding explicit JSON tags to structs for predictable keys (e.g., `json:"name"`).
- CORS: only the logs handler sets `Access-Control-Allow-Origin: *`. If the frontend is served from a different origin, add CORS headers globally or to the relevant endpoints.
- Consider switching sensitive operations (auth/connect) to `POST` with JSON bodies and HTTPS.

---

If you'd like, I can:
- Add concrete examples and a sample frontend component for file listing and streaming logs ✅
- Implement the missing handlers (`get-file`, `connected-clients`, `connect`, `auth`) and fix `mux.go` routing to use path-only patterns 🔧

---

Happy to expand the docs or open PRs for the backend follow-ups you prefer. 🚀
