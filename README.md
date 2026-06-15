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
   - **Content Studio** — Generates tone-customized LinkedIn copywriting drafts (Thought Leadership, Technical/Operational, Risk/Mitigation, Visionary).
   - **Visual Concept Studio** — Generates high-quality branded slide graphics, presentation backgrounds, and logistics mockups using `imagen-3.0-generate-002` with commercial style presets.

---

## Technical Architecture

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · Vite · Tailwind CSS v4 · Lucide Icons |
| **Backend Proxy** | Express 5 — rate-limited reverse proxy injecting the Gemini API key at the edge |
| **Database** | Supabase (PostgreSQL) with Row Level Security and debounced state sync (1.5 s) |
| **PDF Export** | Client-side via `html2canvas` + `jsPDF` |
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
├── config.ts               # Centralized AI model configuration
├── types.ts                # Shared TypeScript interfaces
├── server.js               # Express reverse-proxy server
├── supabase_schema.sql     # Database DDL for Supabase
├── run-shank-strategy.bat  # One-click Windows launcher
│
├── components/
│   ├── Auth.tsx             # Authentication gate (Supabase or offline mode)
│   ├── Overview.tsx         # Dashboard overview panel
│   ├── StrategyBoard.tsx    # SWOT / SCOR / PESTEL / DMAIC / BULLWHIP
│   ├── MarketInsights.tsx   # Market intelligence console
│   ├── SupplyChainConsole.tsx # Logistics risk & disruption monitor
│   ├── ContentStudio.tsx    # LinkedIn copywriting generator
│   ├── VisualStudio.tsx     # Image / slide concept generator
│   ├── ExportPDF.tsx        # PDF report exporter
│   └── ErrorBoundary.tsx    # React error boundary wrapper
│
├── lib/
│   ├── api.ts               # Gemini SDK wrapper & proxy routing logic
│   ├── supabase.ts          # Supabase client with offline fallback
│   ├── markdown.tsx         # Shared markdown-to-JSX renderer
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

### 2. Adding Custom Strategy Frameworks
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

