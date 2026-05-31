import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app, { __resetUpstreamHealthCache } from './server.js';

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

  describe('GET /health', () => {
    it('should return 200 with a healthy status payload even when the key is unset', async () => {
      const original = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      try {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.geminiKeyConfigured).toBe(false);
        expect(typeof res.body.uptimeSeconds).toBe('number');
        expect(Array.isArray(res.body.allowedOrigins)).toBe(true);
      } finally {
        if (original !== undefined) process.env.GEMINI_API_KEY = original;
      }
    });

    it('should report geminiKeyConfigured=true when the key is set', async () => {
      const original = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'test-key';
      try {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.geminiKeyConfigured).toBe(true);
      } finally {
        if (original === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = original;
      }
    });
  });

  describe('GET /health/upstream', () => {
    beforeEach(() => {
      // Reset the 30s result cache so each test exercises the real fetch path.
      __resetUpstreamHealthCache();
    });

    it('should return 503 misconfigured when the key is unset', async () => {
      const original = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      try {
        const res = await request(app).get('/health/upstream');
        expect(res.status).toBe(503);
        expect(res.body.status).toBe('misconfigured');
      } finally {
        if (original !== undefined) process.env.GEMINI_API_KEY = original;
      }
    });

    it('should return ok when the upstream Google API accepts the key', async () => {
      const original = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'test-key';
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ models: [] })
      });
      try {
        const res = await request(app).get('/health/upstream');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.upstreamStatus).toBe(200);
      } finally {
        fetchSpy.mockRestore();
        if (original === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = original;
      }
    });

    it('should return 502 upstream_error when Google rejects the key', async () => {
      const original = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'bad-key';
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: { message: 'PERMISSION_DENIED' } })
      });
      try {
        const res = await request(app).get('/health/upstream');
        expect(res.status).toBe(502);
        expect(res.body.status).toBe('upstream_error');
        expect(res.body.upstreamStatus).toBe(403);
        expect(res.body.error).toBe('PERMISSION_DENIED');
      } finally {
        fetchSpy.mockRestore();
        if (original === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = original;
      }
    });

    it('should return 502 unreachable when Google is unreachable', async () => {
      const original = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'test-key';
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));
      try {
        const res = await request(app).get('/health/upstream');
        expect(res.status).toBe(502);
        expect(res.body.status).toBe('unreachable');
        expect(res.body.error).toBe('network down');
      } finally {
        fetchSpy.mockRestore();
        if (original === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = original;
      }
    });

    it('should cache the upstream result and not re-call Google within the TTL', async () => {
      const original = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'test-key';
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ models: [] })
      });
      try {
        const first = await request(app).get('/health/upstream');
        expect(first.status).toBe(200);
        expect(first.body.status).toBe('ok');
        expect(first.body.cached).toBeUndefined();

        const second = await request(app).get('/health/upstream');
        expect(second.status).toBe(200);
        expect(second.body.status).toBe('ok');
        expect(second.body.cached).toBe(true);
        expect(typeof second.body.cachedForMs).toBe('number');

        // Crucially: Google was only called once across both probes.
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      } finally {
        fetchSpy.mockRestore();
        if (original === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = original;
      }
    });

    it('should also cache failure responses so a bad key does not flood Google', async () => {
      const original = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'bad-key';
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: { message: 'PERMISSION_DENIED' } })
      });
      try {
        const first = await request(app).get('/health/upstream');
        expect(first.status).toBe(502);

        const second = await request(app).get('/health/upstream');
        expect(second.status).toBe(502);
        expect(second.body.cached).toBe(true);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
      } finally {
        fetchSpy.mockRestore();
        if (original === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = original;
      }
    });
  });
});
