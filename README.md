# Shank Strategy Ops LLC | Operations & Consulting Workbench

A full-stack AI consulting and logistics workbench for **Shank Strategy Ops LLC**. It features automated market analysis, visual slide concept generation, live supply chain disruption monitoring, and custom corporate consulting frameworks (SWOT, SCOR, PESTEL, DMAIC, and BULLWHIP).

---

## Key Features & Capabilities

1. **Strategy Hub**
   - **Client Discovery Sync** — Scrapes public brand information (industry, description, tone) using search-grounded Gemini models.
   - **Executive Consulting Frameworks** — Generates SWOT, SCOR (logistics), PESTEL (macro-environment), DMAIC (Lean Six Sigma), and BULLWHIP (supply chain volatility) briefs using `gemini-2.5-pro-preview` with an active reasoning budget.
   - **Markdown Rendering** — Formats consulting briefs into rich typography (bullet points, headers, bold accents, divider rules).

2. **Logistics Risk Console**
   - **Operational Risk Summary** — Analyzes custom routing nodes, ports, and transit corridors using `gemini-2.5-flash` grounded in Google Search.
   - **Disruption Radar** — Scans for live geological or transit bottlenecks in real-time, displaying them with styled risk severity badges (high, medium, low).
   - **Route Corridors** — Includes quick-select presets for transpacific marine lanes, European rail networks, and NAFTA highways.

3. **Creative Asset Studio**
   - **Content Studio** — Generates tone-customized LinkedIn copywriting drafts (Thought Leadership, Technical/Operational, Risk/Mitigation, Visionary). Drafts can be deleted one at a time, cleared, or downloaded together as Markdown.
   - **Visual Concept Studio** — Generates high-quality branded slide graphics, presentation backgrounds, and logistics mockups using `imagen-3.0-generate-002` with commercial style presets. Every generated image lands in a per-browser gallery (IndexedDB, last 24) that survives reloads, filters by client, and can be downloaded or deleted individually. The newest four images for the active client are embedded at the end of the full PDF report.

4. **Client Library** (`Clients` in the sidebar)
   - Save the active client (profile plus every brief, draft, and analysis) to the library, then switch between engagements without losing work. The active client auto-syncs to its library entry as you work.
   - Start a fresh client from the library or from Settings; delete saved clients you no longer need.

5. **Exports built for client delivery**
   - Every brief (framework, market, logistics) has a consistent action bar: **Copy**, **.md**, **PDF**, and **Clear**.
   - PDFs are real text documents (selectable, searchable) with headings, bullets, tables, a confidential footer, and page numbers. See [`lib/pdf.ts`](lib/pdf.ts).
   - **Export Report** in the header produces the full client report as PDF or Markdown: profile, market intelligence with sources, logistics with live alerts, every framework, and content drafts.

6. **Reset, clear, and backup** (gear icon in the header)
   - **Reset active workspace** clears the current client without touching the library.
   - **Clear local cache and sign out** removes every copy stored in the browser.
   - **Export / Import workspace backup** moves the active client and the whole library between browsers or machines as a `.json` file.
   - AI failures show actionable messages (sign-in required, bad key, rate limit, proxy offline) instead of raw SDK errors.

---

## Technical Architecture

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · Vite · Tailwind CSS v4 · Lucide Icons |
| **Backend Proxy** | Express 5 — rate-limited reverse proxy injecting the Gemini API key at the edge |
| **Database** | Supabase (PostgreSQL) with Row Level Security and debounced state sync (1.5 s) |
| **PDF Export** | Client-side text layout via `jsPDF` (`lib/pdf.ts`); no screenshots |
| **AI Models** | Configured centrally in `config.ts` (see below) |

### Centralized Model Configuration

All model identifiers are maintained in [`config.ts`](config.ts):

```ts
export const config = {
  models: {
    defaultPro:   'gemini-2.5-pro-preview',
    defaultFlash: 'gemini-2.5-flash',
    defaultImage: 'imagen-3.0-generate-002',
  }
};
```

---

## Project Structure

```
Lumina-Pro/
├── index.html              # HTML entry point (loads index.tsx)
├── index.tsx               # React root render
├── index.css               # Global CSS / Tailwind imports
├── App.tsx                 # Main app shell, routing, and state management
├── config.ts               # Firm name and centralized AI model configuration
├── types.ts                # Shared TypeScript interfaces
├── server.js               # Express reverse-proxy server
├── supabase_schema.sql     # Database DDL for Supabase (new installs)
├── supabase_migrations/    # Incremental SQL for existing databases
├── run-shank-strategy.bat  # One-click Windows launcher
│
├── components/
│   ├── Auth.tsx             # Authentication gate (Supabase or offline mode)
│   ├── Overview.tsx         # Dashboard overview panel
│   ├── ClientLibrary.tsx    # Save / load / delete client workspaces
│   ├── SettingsModal.tsx    # API key, backup/restore, reset, clear cache
│   ├── BriefActions.tsx     # Shared Copy / .md / PDF / Clear action bar
│   ├── StrategyBoard.tsx    # SWOT / SCOR / PESTEL / DMAIC / BULLWHIP
│   ├── MarketInsights.tsx   # Market intelligence console
│   ├── SupplyChainConsole.tsx # Logistics risk & disruption monitor
│   ├── ContentStudio.tsx    # LinkedIn copywriting generator
│   ├── VisualStudio.tsx     # Image / slide concept generator
│   ├── ExportPDF.tsx        # Full-report export menu (PDF or Markdown)
│   └── ErrorBoundary.tsx    # React error boundary wrapper
│
├── lib/
│   ├── api.ts               # Gemini SDK wrapper & proxy routing logic
│   ├── supabase.ts          # Supabase client with offline fallback
│   ├── persistence.ts       # Local + cloud workspace storage, backups, client library
│   ├── pdf.ts               # Markdown-to-PDF layout engine (jsPDF)
│   ├── report.ts            # Full client report sections (PDF and Markdown)
│   ├── download.ts          # Browser file download helpers
│   ├── assets.ts            # Generated image gallery (IndexedDB with memory fallback)
│   ├── errors.ts            # Friendly messages for AI / proxy failures
│   ├── markdown.tsx         # Shared markdown-to-JSX renderer (headings, lists, tables)
│   ├── api.test.ts          # Tests for API client
│   └── markdown.test.tsx    # Tests for markdown renderer
│
├── vite.config.ts           # Vite + Tailwind + Vitest configuration
├── tsconfig.json            # TypeScript compiler options
├── package.json             # Dependencies and npm scripts
└── .env.local               # Environment secrets (not committed)
```

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example file and fill in your keys:

```bash
# On Linux, macOS, or Windows Git Bash:
cp .env.example .env.local

# On Windows Command Prompt (cmd.exe):
copy .env.example .env.local
```

| Variable | Required | Used by | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | **Yes** | `server.js` | Google AI API key — injected by the proxy, never exposed to the browser |
| `VITE_SUPABASE_URL` | No* | Frontend & Server | Supabase project URL. Enforces JWT auth on backend proxy routes when configured. |
| `VITE_SUPABASE_ANON_KEY` | No* | Frontend & Server | Supabase anonymous key. |
| `PORT` | No | `server.js` | Proxy server port (default `3001`) |
| `TRUST_PROXY` | No | `server.js` | Express `trust proxy` setting for deployments behind a reverse proxy (e.g. `1`, `loopback`). Leave unset for local development |
| `FRONTEND_URL` | No | `server.js` | Additional allowed CORS origin for production deployments. `http://localhost:3000` is always allowed |
| `NODE_ENV` | No | `server.js` | When set to `test`, the proxy is exported without calling `app.listen()` so Vitest can mount it. Leave unset for normal dev/prod runs |

> \* The app runs in **offline mode** when Supabase keys are missing. Auth and persistence are disabled on the frontend, and the backend proxy runs without enforcing JWT authentication. When configured, JWT authentication is strictly verified. When Supabase is active, frontend clients in offline mode cannot use the proxy server's AI endpoints (as they do not possess a valid Supabase JWT). To use AI features in offline mode under these conditions, users must enter a personal Gemini API key in the app's Settings to communicate directly with Google's API.

### 3. Initialize the Database (Optional)

If using Supabase for persistence:

1. Open your Supabase project's **SQL Editor**.
2. Paste and run the contents of [`supabase_schema.sql`](supabase_schema.sql) to create the `brand_profiles` and `global_intel` tables with Row Level Security policies.
3. **Existing databases:** run [`supabase_migrations/2026-09-03_workspace_meta.sql`](supabase_migrations/2026-09-03_workspace_meta.sql) once. It adds the `workspace_meta` column that stores the client library, research queries, sources, routes, and live alerts. Until it is applied, the app keeps working and stores those items in the browser only (a console warning tells you the migration is missing).

### 4. Run the Application

Start the concurrent dev stack (Vite on port `3000`, Express proxy on port `3001`):

```bash
npm run dev
```

**Windows shortcut:** Double-click [`run-shank-strategy.bat`](run-shank-strategy.bat) to auto-install dependencies, launch both servers, and open the browser.

### 5. Run Tests

```bash
npm run test
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start frontend + proxy concurrently |
| `npm run server` | Start the Express proxy server only |
| `npm run build` | Production Vite build |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run Vitest test suite |

---

## Health Checks

The proxy exposes two health endpoints (registered before the rate limiter and key gate, so monitoring never burns the per-IP request budget and works even when the upstream key is missing):

| Endpoint | Cost | Reports |
|---|---|---|
| `GET /health` | none | Process uptime, whether `GEMINI_API_KEY` is loaded, trust-proxy setting, allowed CORS origins, `NODE_ENV` |
| `GET /health/upstream` | one Google `models.list` call (no inference, no quota), cached 30 s | Whether the configured Gemini key is actually accepted by Google |

`/health/upstream` is protected against abuse on publicly reachable deployments with **two complementary defenses**: a stricter per-IP rate limit (10 req/min, separate from the global limiter) and a 30-second in-process result cache that covers both successes and failures. Cached responses include `"cached": true` and a `cachedForMs` countdown so you can tell the difference from a fresh probe.

Quick checks:

```bash
# Is the proxy alive and did it pick up .env.local?
curl http://localhost:3001/health

# Is the key actually valid as far as Google is concerned?
curl http://localhost:3001/health/upstream
```

`/health/upstream` returns `200 ok` on success, `502 upstream_error` (with Google's error message) when the key is rejected, `502 unreachable` on network failure, and `503 misconfigured` when no key is loaded at all.

---

## Proxy Architecture

The frontend never holds the Gemini API key. Instead, all AI requests flow through the Express proxy:

```
Browser  ──▶  Vite dev server (/api/*)  ──▶  Express proxy (:3001)  ──▶  Google GenAI API
                                                  │
                                          Injects x-goog-api-key
                                          Rate-limits (100 req / 15 min)
                                          Helmet security headers
```

Users can also paste a personal API key in the app UI, which bypasses the proxy and calls Google directly from the browser.

---

## Security Posture & Production Deployment

When deploying this workbench publicly, please note the following security configuration aspects:

1. **Proxy Posture When Unconfigured**: If the server is run without Supabase URL and anonymous keys, it permits unrestricted proxy access to the Gemini API (`open-proxy-when-unconfigured` behavior). In `production` (`NODE_ENV=production`), this behavior is blocked and the server fails-safe with a `500 Internal Server Error` to prevent accidental proxy exposure.
2. **User Sign-up Restriction**: By default, the Supabase schema allows public user registration. For public production deployments, it is recommended to disable sign-ups or restrict emails in the Supabase Project Settings under **Auth > Provider Settings** to control access to the proxy and keep API costs bounded.

---

## Extension Guidelines

### 1. Modifying Default AI Models
To update or change the active Gemini models (e.g. when transitioning from preview to stable versions), edit [`config.ts`](config.ts):

```ts
export const config = {
  models: {
    defaultPro:   'gemini-2.5-pro-preview', // Main framework logic
    defaultFlash: 'gemini-2.5-flash',       // Live web grounding searches
    defaultImage: 'imagen-3.0-generate-002',// Visual studio slide layout
  }
};
```

### 2. Changing the PDF layout
[`lib/pdf.ts`](lib/pdf.ts) turns Markdown into paginated text. Margins, fonts, and colors live at the top of the file; section order for the full report is in [`lib/report.ts`](lib/report.ts). Do not reintroduce `html2canvas`: Tailwind v4 emits `oklch()` colors that it cannot parse, which is what broke the previous screenshot-based export.

### 3. Adding Custom Strategy Frameworks
If you want to add a new operational framework (e.g. Six Sigma DMAIC, Volatility Bullwhip):
1. Add the enum values to [`types.ts`](types.ts).
2. Register the selector logic and prompt templates in [`components/StrategyBoard.tsx`](components/StrategyBoard.tsx) inside the `generateConsultingFramework` method.
3. If the framework output requires specialized markdown styling, update the custom markdown parser in [`lib/markdown.tsx`](lib/markdown.tsx).

---

## Troubleshooting & Debugging

### 1. Express Reverse Proxy Connection Failure
If calls to `/api/*` return timeouts or connection errors (e.g. `502 Bad Gateway`):
- Run the server standalone using `npm run server` and inspect the node console output.
- Check that the server port `3001` matches the target specified in the proxy rule in [`vite.config.ts`](vite.config.ts).
- Verify that `TRUST_PROXY` is configured if deploying behind custom load balancers.

### 2. Invalid Google Gemini API Key
If AI operations fail with `upstream_error` or `Forbidden`:
- Call `GET http://localhost:3001/health/upstream`. This invokes a cheap Google models check using your key.
- If it returns `502 upstream_error`, verify the value of `GEMINI_API_KEY` in your `.env.local` file.

### 3. AI features fail in Offline Mode
When Supabase is configured, the proxy requires a signed-in session. Offline Mode has no session, so open **Settings** (gear icon) and enter a personal Gemini API key, or sign in.

### 4. Something looks stale or stuck
Open **Settings** and use **Reset active workspace** (keeps the client library) or **Clear local cache and sign out** (removes everything in this browser). Export a backup first if you want to keep the data.
