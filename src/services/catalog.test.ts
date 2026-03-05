import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CatalogClient, CatalogError } from './catalog';
import type { Entity } from '../data/types';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeEntity(name: string): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: { name },
    spec: {},
  };
}

function mockFetch(responses: Array<{ ok: boolean; status?: number; statusText?: string; body?: unknown }>) {
  let callIndex = 0;
  return vi.fn().mockImplementation(() => {
    const res = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return Promise.resolve({
      ok: res.ok,
      status: res.status ?? 200,
      statusText: res.statusText ?? 'OK',
      text: () => Promise.resolve(typeof res.body === 'string' ? res.body : ''),
      json: () => Promise.resolve(res.body),
    });
  });
}

const BASE = 'https://backstage.example.com';
const TOKEN = 'test-token';

// ── CatalogError ───────────────────────────────────────────────────────────

describe('CatalogError', () => {
  it('sets the name to "CatalogError"', () => {
    const err = new CatalogError(401, 'Unauthorized', 'Invalid token');
    expect(err.name).toBe('CatalogError');
  });

  it('stores status, statusText, and body', () => {
    const err = new CatalogError(404, 'Not Found', 'missing resource');
    expect(err.status).toBe(404);
    expect(err.statusText).toBe('Not Found');
    expect(err.body).toBe('missing resource');
  });

  it('formats the message as "Backstage API <status> <statusText>"', () => {
    const err = new CatalogError(500, 'Internal Server Error', '');
    expect(err.message).toBe('Backstage API 500 Internal Server Error');
  });

  it('is an instance of Error', () => {
    expect(new CatalogError(200, 'OK', '')).toBeInstanceOf(Error);
  });
});

// ── CatalogClient.testConnection ───────────────────────────────────────────

describe('CatalogClient.testConnection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns { ok: true } on a successful response', async () => {
    vi.stubGlobal('fetch', mockFetch([{ ok: true, body: { items: [] } }]));
    const client = new CatalogClient({ baseUrl: BASE, token: TOKEN });
    expect(await client.testConnection()).toEqual({ ok: true });
  });

  it('returns { ok: false, reason } for a 401 response', async () => {
    vi.stubGlobal('fetch', mockFetch([{ ok: false, status: 401, statusText: 'Unauthorized' }]));
    const client = new CatalogClient({ baseUrl: BASE, token: TOKEN });
    const result = await client.testConnection();
    expect(result.ok).toBe(false);
    expect((result as { ok: false; reason: string }).reason).toMatch(/token/i);
  });

  it('returns { ok: false, reason } for a 403 response', async () => {
    vi.stubGlobal('fetch', mockFetch([{ ok: false, status: 403, statusText: 'Forbidden' }]));
    const client = new CatalogClient({ baseUrl: BASE, token: TOKEN });
    const result = await client.testConnection();
    expect(result.ok).toBe(false);
    expect((result as { ok: false; reason: string }).reason).toMatch(/token/i);
  });

  it('returns { ok: false, reason } for a 404 response', async () => {
    vi.stubGlobal('fetch', mockFetch([{ ok: false, status: 404, statusText: 'Not Found' }]));
    const client = new CatalogClient({ baseUrl: BASE, token: TOKEN });
    const result = await client.testConnection();
    expect(result.ok).toBe(false);
    expect((result as { ok: false; reason: string }).reason).toMatch(/Catalog API not found/i);
  });

  it('returns { ok: false, reason } with the status code for other HTTP errors', async () => {
    vi.stubGlobal('fetch', mockFetch([{ ok: false, status: 503, statusText: 'Service Unavailable' }]));
    const client = new CatalogClient({ baseUrl: BASE, token: TOKEN });
    const result = await client.testConnection();
    expect(result.ok).toBe(false);
    expect((result as { ok: false; reason: string }).reason).toContain('503');
  });

  it('returns { ok: false, reason } when fetch throws (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const client = new CatalogClient({ baseUrl: BASE, token: TOKEN });
    const result = await client.testConnection();
    expect(result.ok).toBe(false);
    expect((result as { ok: false; reason: string }).reason).toMatch(/could not reach/i);
  });

  it('strips trailing slashes from the base URL when building request URLs', async () => {
    const fetchSpy = mockFetch([{ ok: true, body: { items: [] } }]);
    vi.stubGlobal('fetch', fetchSpy);
    const client = new CatalogClient({ baseUrl: 'https://backstage.example.com///', token: TOKEN });
    await client.testConnection();
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('///');
  });

  it('attempts to get a guest token for localhost when no token is provided', async () => {
    const fetchSpy = vi.fn()
      // First call: guest token endpoint
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'guest-abc' }),
      })
      // Second call: actual API request
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });

    vi.stubGlobal('fetch', fetchSpy);
    const client = new CatalogClient({ baseUrl: 'http://localhost:7007', token: '' });
    const result = await client.testConnection();
    expect(result.ok).toBe(true);
    // Guest token URL should have been the first request
    expect(fetchSpy.mock.calls[0][0]).toContain('/api/auth/guest/token');
  });

  it('does not attempt to get a guest token for non-localhost URLs', async () => {
    const fetchSpy = mockFetch([{ ok: true, body: { items: [] } }]);
    vi.stubGlobal('fetch', fetchSpy);
    const client = new CatalogClient({ baseUrl: BASE, token: '' });
    await client.testConnection();
    // Only one fetch call — no guest token attempt
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).not.toContain('guest');
  });
});

// ── CatalogClient.getAllEntities ───────────────────────────────────────────

describe('CatalogClient.getAllEntities', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns entities from a plain array response', async () => {
    const entities = [makeEntity('svc-a'), makeEntity('svc-b')];
    vi.stubGlobal('fetch', mockFetch([{ ok: true, body: entities }]));
    const client = new CatalogClient({ baseUrl: BASE, token: TOKEN });
    expect(await client.getAllEntities()).toEqual(entities);
  });

  it('returns entities from a paginated { items } response', async () => {
    const entities = [makeEntity('svc-a')];
    vi.stubGlobal('fetch', mockFetch([{ ok: true, body: { items: entities } }]));
    const client = new CatalogClient({ baseUrl: BASE, token: TOKEN });
    expect(await client.getAllEntities()).toEqual(entities);
  });

  it('follows pagination cursors until exhausted', async () => {
    const page1 = [makeEntity('svc-a')];
    const page2 = [makeEntity('svc-b')];
    vi.stubGlobal(
      'fetch',
      mockFetch([
        { ok: true, body: { items: page1, pageInfo: { nextCursor: 'cursor-1' } } },
        { ok: true, body: { items: page2, pageInfo: {} } },
      ]),
    );
    const client = new CatalogClient({ baseUrl: BASE, token: TOKEN });
    const result = await client.getAllEntities();
    expect(result).toEqual([...page1, ...page2]);
  });

  it('includes the cursor in the second-page URL', async () => {
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [makeEntity('a')], pageInfo: { nextCursor: 'abc123' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });
    vi.stubGlobal('fetch', fetchSpy);
    const client = new CatalogClient({ baseUrl: BASE, token: TOKEN });
    await client.getAllEntities();
    const secondUrl = fetchSpy.mock.calls[1][0] as string;
    expect(secondUrl).toContain('cursor=');
    expect(secondUrl).toContain('abc123');
  });

  it('throws CatalogError on unexpected response shape', async () => {
    vi.stubGlobal('fetch', mockFetch([{ ok: true, body: { unexpected: true } }]));
    const client = new CatalogClient({ baseUrl: BASE, token: TOKEN });
    await expect(client.getAllEntities()).rejects.toBeInstanceOf(CatalogError);
  });

  it('sends the Authorization header with the token', async () => {
    const fetchSpy = mockFetch([{ ok: true, body: [] }]);
    vi.stubGlobal('fetch', fetchSpy);
    const client = new CatalogClient({ baseUrl: BASE, token: 'my-secret-token' });
    await client.getAllEntities();
    const headers = fetchSpy.mock.calls[0][1].headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer my-secret-token');
  });
});
