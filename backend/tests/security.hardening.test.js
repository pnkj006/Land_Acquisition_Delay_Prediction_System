/**
 * @fileoverview Security hardening tests.
 *
 * Tests:
 *  CORS – disallowed origin receives no Access-Control-Allow-Origin header
 *  CORS – allowed origin (positive control) does receive the header
 *  X-Forwarded-For spoofing (TRUST_PROXY unset) – rate limit still trips even when
 *    every request carries a different spoofed IP, because req.ip resolves to the
 *    real socket address instead of the XFF header
 *  X-Forwarded-For spoofing (TRUST_PROXY=1) – each forwarded IP gets its own bucket,
 *    so cycling through unique IPs avoids the limit (shows the flag is only safe behind
 *    exactly one real proxy)
 *
 * Loader: jest.isolateModules gives each test a fresh copy of app.js, which matters
 * because TRUST_PROXY is read once at module-evaluation time, and the rate-limit
 * counters are reset on each fresh require.
 */

'use strict';

const request = require('supertest');

// ─── Loader helper ──────────────────────────────────────────────────────────

/**
 * Load a fresh instance of the Express app with a custom env overlay.
 * Restores process.env afterward so tests don't bleed into one another.
 *
 * @param {Record<string, string>} env  Extra env vars to apply before require.
 * @returns {import('express').Application}
 */
function loadApp(env = {}) {
  const saved = { ...process.env };

  // Make TRUST_PROXY absent by default so we can assert on the "no proxy" case.
  delete process.env.TRUST_PROXY;
  Object.assign(process.env, env);

  let app;
  jest.isolateModules(() => {
    // app.js exports the Express application directly (not server.listen).
    app = require('../src/app');
  });

  process.env = saved;
  return app;
}

// ─── CORS allowlist ─────────────────────────────────────────────────────────

describe('CORS', () => {
  /**
   * Negative case: a request from an origin that is NOT in the allowlist must
   * not receive an Access-Control-Allow-Origin header.
   *
   * The cors() callback is configured to pass `false` for unknown origins
   * (not to throw), so the response status is 200 (the route itself succeeds),
   * but the CORS header is simply absent.
   */
  it('does not grant access to a disallowed origin', async () => {
    const app = loadApp();
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://evil.example');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  /**
   * Positive control: the configured origin must receive the header.
   * Without this, the previous test could pass merely because CORS is disabled
   * entirely.
   *
   * The default allowlist is "http://localhost:5173".
   */
  it('still allows the configured origin (positive control)', async () => {
    const app = loadApp();
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5173');

    expect(res.headers['access-control-allow-origin']).toBeDefined();
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  /**
   * Extra: when CORS_ORIGINS is overridden via env, only that origin is allowed.
   */
  it('respects a custom CORS_ORIGINS env var', async () => {
    const app = loadApp({ CORS_ORIGINS: 'https://myapp.example.com' });

    const blocked = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5173');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();

    const allowed = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://myapp.example.com');
    expect(allowed.headers['access-control-allow-origin']).toBe('https://myapp.example.com');
  });
});

// ─── X-Forwarded-For spoofing ────────────────────────────────────────────────

/**
 * Send `n` login requests to `app`, rotating the X-Forwarded-For header on
 * each request using the provided factory so that every request claims a
 * different IP address.
 *
 * @param {import('express').Application} app
 * @param {(i: number) => string} xff  Factory that returns an IP string for iteration i.
 * @param {number} n  Number of requests to send.
 * @returns {Promise<import('supertest').Response>} The last response.
 */
async function hammer(app, xff, n) {
  let last;
  for (let i = 0; i < n; i++) {
    last = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', xff(i))
      // Deliberately wrong credentials — we only care about the HTTP status,
      // not a successful login.
      .send({ email: `test${i}@example.com`, password: 'wrongpassword' });
  }
  return last;
}

describe('X-Forwarded-For spoofing', () => {
  /**
   * The configured rate limit (see rateLimit.middleware.js) is max: 20 requests
   * per 15-minute window. We exceed it by 1 to guarantee a 429.
   */
  const LIMIT = 20;

  /**
   * When TRUST_PROXY is unset (default), Express resolves req.ip from the
   * real TCP socket address, ignoring X-Forwarded-For entirely.
   *
   * An attacker who rotates the spoofed XFF header on every request therefore
   * cannot escape the rate limiter — all requests still come from the same
   * socket IP, hitting the same bucket.
   */
  it('TRUST_PROXY unset: spoofed X-Forwarded-For does NOT bypass the rate limit', async () => {
    const app = loadApp(); // TRUST_PROXY intentionally absent
    const res = await hammer(app, (i) => `10.0.0.${i % 254 + 1}`, LIMIT + 1);
    expect(res.status).toBe(429);
  });

  /**
   * When TRUST_PROXY=1, Express trusts one proxy hop and uses the rightmost
   * entry of X-Forwarded-For as req.ip. This is correct and safe when there
   * is exactly one real reverse proxy (e.g. Nginx, Render, a single ALB)
   * that sets the header.
   *
   * In this case each unique forwarded IP gets its own rate-limit bucket,
   * so cycling through different IPs avoids the limit. This test documents
   * that behaviour — it is expected and safe only behind exactly one real
   * proxy; it would be exploitable if clients could directly reach the backend.
   */
  it('TRUST_PROXY=1: each unique forwarded IP gets its own bucket (expected behind one proxy)', async () => {
    const app = loadApp({ TRUST_PROXY: '1' });
    // Each iteration sends a different IP → each hits a fresh bucket.
    const res = await hammer(app, (i) => `10.0.0.${i % 254 + 1}`, LIMIT + 1);
    expect(res.status).not.toBe(429);
  });
});
