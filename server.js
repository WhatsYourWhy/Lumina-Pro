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

// Rate limiting: max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
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
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// Deep health — actually pings Google with the configured key. Uses the model
// listing endpoint (no inference cost, no quota burn) to verify the key is
// accepted upstream. Hit this when /health looks fine but real API calls fail.
app.get('/health/upstream', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      status: 'misconfigured',
      reason: 'GEMINI_API_KEY is not set'
    });
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (upstream.ok) {
      return res.json({ status: 'ok', upstreamStatus: upstream.status });
    }
    let errorBody = null;
    try { errorBody = await upstream.json(); } catch { /* non-JSON */ }
    return res.status(502).json({
      status: 'upstream_error',
      upstreamStatus: upstream.status,
      error: errorBody?.error?.message || upstream.statusText
    });
  } catch (err) {
    return res.status(502).json({
      status: 'unreachable',
      error: err.name === 'AbortError' ? 'timeout' : (err.message || String(err))
    });
  }
});

app.use(limiter);

// Fail fast with a clear message when no upstream key is configured.
app.use((req, res, next) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Proxy is not configured: missing GEMINI_API_KEY' });
  }
  next();
});

// Proxy everything to Gemini API
app.use('/', createProxyMiddleware({
  target: 'https://generativelanguage.googleapis.com',
  changeOrigin: true,
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
