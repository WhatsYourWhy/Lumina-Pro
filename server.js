import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import helmet from 'helmet';

dotenv.config({ path: '.env.local' });

const app = express();
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

app.use(limiter);

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
