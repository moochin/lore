/**
 * Backstage Catalog REST API client.
 *
 * All requests are made directly from the user's browser to the Backstage
 * instance they configure — no proxy, no middleware, no third-party servers.
 * You can verify this yourself by opening your browser's Network Tab.
 */

import type { Entity } from '../data/types';

export interface BackstageConfig {
  baseUrl: string; // e.g. "https://backstage.example.com"
  token: string;   // Backstage API token (kept in memory, never logged)
}

interface CatalogResponse {
  items: Entity[];
  totalItems?: number;
  pageInfo?: { nextCursor?: string };
}

export class CatalogClient {
  private readonly base: string;
  private readonly token: string;

  constructor(config: BackstageConfig) {
    this.base  = config.baseUrl.replace(/\/+$/, ''); // strip trailing slash
    this.token = config.token;
  }

  // ── Internal fetch ────────────────────────────────────────────────────────

  private async get<T>(path: string): Promise<T> {
    const url = `${this.base}/api/catalog/${path.replace(/^\//, '')}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new CatalogError(res.status, res.statusText, body);
    }

    return res.json() as Promise<T>;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Fetch all entities, paging through cursor-based results automatically.
   * Backstage returns at most 500 items per page by default.
   */
  async getAllEntities(): Promise<Entity[]> {
    const all: Entity[] = [];
    let cursor: string | undefined;

    do {
      const qs    = cursor ? `entities?cursor=${encodeURIComponent(cursor)}` : 'entities';
      const page  = await this.get<CatalogResponse>(qs);
      all.push(...page.items);
      cursor = page.pageInfo?.nextCursor;
    } while (cursor);

    return all;
  }

  /** Fetch entities filtered by kind (e.g. "Group", "Component", "API"). */
  async getEntitiesByKind(kind: string): Promise<Entity[]> {
    const page = await this.get<CatalogResponse>(
      `entities?filter=kind=${encodeURIComponent(kind)}`,
    );
    return page.items;
  }

  /**
   * For localhost connections with empty/invalid tokens, attempt to obtain
   * a guest token automatically. This supports local development with guest auth.
   */
  private async tryGetGuestToken(): Promise<string | null> {
    try {
      // Only attempt guest token retrieval for localhost connections
      if (!this.base.includes('localhost') && !this.base.includes('127.0.0.1')) {
        return null;
      }

      const guestTokenUrl = `${this.base}/api/auth/guest/token`;
      const res = await fetch(guestTokenUrl, { method: 'GET' });

      if (!res.ok) return null;

      const data = await res.json() as { token?: string };
      return data.token ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Lightweight connectivity check — fetches a single entity.
   * Returns true if the request succeeds (token is valid and URL is correct).
   * For localhost guest auth, automatically obtains a guest token if needed.
   */
  async testConnection(): Promise<{ ok: true } | { ok: false; reason: string }> {
    try {
      // If no token provided or appears invalid, try to get a guest token for localhost
      if (!this.token || this.token.length === 0) {
        const guestToken = await this.tryGetGuestToken();
        if (guestToken) {
          this.token = guestToken;
        }
      }

      await this.get<CatalogResponse>('entities?limit=1');
      return { ok: true };
    } catch (err) {
      if (err instanceof CatalogError) {
        if (err.status === 401 || err.status === 403) {
          return { ok: false, reason: 'Invalid or expired API token.' };
        }
        if (err.status === 404) {
          return { ok: false, reason: 'Catalog API not found — check the Backstage URL.' };
        }
        return { ok: false, reason: `HTTP ${err.status}: ${err.statusText}` };
      }
      // Network error (CORS, DNS, offline, etc.)
      return {
        ok: false,
        reason: 'Could not reach your Backstage instance. Check the URL and that CORS is configured to allow this origin.',
      };
    }
  }
}

// ── Error type ────────────────────────────────────────────────────────────

export class CatalogError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: string,
  ) {
    super(`Backstage API ${status} ${statusText}`);
    this.name = 'CatalogError';
  }
}
