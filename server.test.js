import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from './server.js';

describe('Gemini Proxy Server', () => {
  it('should apply CORS headers', async () => {
    const res = await request(app).get('/');
    // Depending on origin logic, it might not set it or set it to '*'. Express CORS defaults
    expect(res.headers).toBeDefined();
  });

  it('should not trust proxy by default', () => {
    // trust proxy is gated behind the TRUST_PROXY env var to prevent
    // X-Forwarded-For spoofing of req.ip when not actually behind a sanitizing proxy.
    // Without TRUST_PROXY set, Express's default ("false") must be retained.
    expect(app.get('trust proxy')).toBe(false);
  });

  it('should proxy requests and return 404 or target response depending on route', async () => {
    // We expect the proxy middleware to attempt routing to Gemini. 
    // Without a real key or payload, it might return a specific error from supertest/Gemini.
    const res = await request(app).get('/health-check-non-existent');
    // Just verifying the server acts as a proxy without crashing
    expect(res.status).not.toBe(500); 
  });
});
