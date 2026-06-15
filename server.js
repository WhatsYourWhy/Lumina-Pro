import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import helmet from 'helmet';

dotenv.config({ path: '.env.local' });

const app = express();
// Only trust proxy headers when running behind a known/sanitizing reverse proxy.
// Set TRUST_PROXY to an Express trust-proxy value (e.g. "1", "loopback", an IP, or "true").
// Leaving it unset is the safe default: req.ip uses the socket address and cannot be
// spoofed via X-Forwarded-For to bypass the rate limiter.
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy) {
  const numeric = Number(trustProxy);
  app.set('trust proxy', Number.isFinite(numeric) ? numeric : trustProxy);
}
const port = process.env.PORT || 3001;

const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:3000'] : ['http://localhost:3000'];
app.use(cors({ origin: allowedOrigins }));
app.use(helmet());

// Rate limiting config from env with safe defaults (250 requests per 15 minutes)
const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX) || 250;

const limiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  message: { error: 'Too many requests from this IP, please try again later.' }
});

// Health endpoints — registered BEFORE the rate limiter and key-gate so that
// monitoring works even when the upstream key is missing and never burns the
// per-IP request budget. Both endpoints are intentionally cheap.
const startedAt = Date.now();

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
    trustProxy: app.get('trust proxy') ?? false,
    allowedOrigins,
    nodeEnv: process.env.NODE_ENV || 'development',
    rateLimitSettings: {
      windowMs: rateLimitWindowMs,
      max: rateLimitMax
    }
  });
});

// Deep health — actually pings Google with the configured key. Uses the model
// listing endpoint (no inference cost, no quota burn) to verify the key is
// accepted upstream. Hit this when /health looks fine but real API calls fail.
//
// Defense-in-depth against abuse on publicly reachable deployments:
//   1. Per-endpoint rate limit (10/min/IP) — stricter than the global limiter
//      and applied only here, so an attacker can't fan out upstream calls.
//   2. 30s in-process result cache — even legitimate frequent polling resolves
//      to a single upstream call per window. Both success AND failure are
//      cached so a bad key doesn't generate one Google rejection per probe.
const UPSTREAM_HEALTH_CACHE_TTL_MS = 30_000;
let upstreamHealthCache = null; // { expiresAt, status, body }

// Exported for tests to reset between cases.
export const __resetUpstreamHealthCache = () => { upstreamHealthCache = null; };

const upstreamHealthLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: { status: 'rate_limited', error: 'Too many upstream health checks; try again shortly' }
});

app.get('/health/upstream', upstreamHealthLimiter, async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      status: 'misconfigured',
      reason: 'GEMINI_API_KEY is not set'
    });
  }

  const now = Date.now();
  if (upstreamHealthCache && upstreamHealthCache.expiresAt > now) {
    return res.status(upstreamHealthCache.status).json({
      ...upstreamHealthCache.body,
      cached: true,
      cachedForMs: upstreamHealthCache.expiresAt - now
    });
  }

  let status;
  let body;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (upstream.ok) {
      status = 200;
      body = { status: 'ok', upstreamStatus: upstream.status };
    } else {
      let errorBody = null;
      try { errorBody = await upstream.json(); } catch { /* non-JSON */ }
      status = 502;
      body = {
        status: 'upstream_error',
        upstreamStatus: upstream.status,
        error: errorBody?.error?.message || upstream.statusText
      };
    }
  } catch (err) {
    status = 502;
    body = {
      status: 'unreachable',
      error: err.name === 'AbortError' ? 'timeout' : (err.message || String(err))
    };
  }

  upstreamHealthCache = {
    expiresAt: now + UPSTREAM_HEALTH_CACHE_TTL_MS,
    status,
    body
  };
  return res.status(status).json(body);
});

app.use(limiter);

// Fail fast with a clear message when no upstream key is configured.
app.use((req, res, next) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Proxy is not configured: missing GEMINI_API_KEY' });
  }
  next();
});

// Proxy only Gemini API model endpoints
app.use('/', createProxyMiddleware({
  target: 'https://generativelanguage.googleapis.com',
  changeOrigin: true,
  pathFilter: (pathname) => {
    return pathname.startsWith('/v1beta/models') || pathname.startsWith('/v1/models');
  },
  ws: true,
  router: function(req) {
     if (req.url.startsWith('/ws')) {
        return 'wss://generativelanguage.googleapis.com';
     }
     return 'https://generativelanguage.googleapis.com';
  },
  onProxyReq: (proxyReq, req, res) => {
    // Inject the real API key
    if (process.env.GEMINI_API_KEY) {
      proxyReq.setHeader('x-goog-api-key', process.env.GEMINI_API_KEY);
    }
  },
  onProxyReqWs: (proxyReq, req, socket, options, head) => {
    if (process.env.GEMINI_API_KEY) {
      proxyReq.setHeader('x-goog-api-key', process.env.GEMINI_API_KEY);
    }
  }
}));

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Gemini Proxy running on http://localhost:${port}`);
  });
}

export default app;
