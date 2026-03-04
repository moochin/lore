/**
 * Local-only encrypted token storage using the Web Crypto API.
 *
 * Security model:
 *  - The token is encrypted with AES-256-GCM before touching disk.
 *  - The encryption key is generated fresh each session and kept in
 *    sessionStorage only — it never reaches localStorage or the network.
 *  - The encrypted payload (ciphertext + IV) is persisted in localStorage.
 *  - When the tab is closed, the key is gone. The next session will prompt
 *    the user to re-enter their token, which is then re-encrypted with a
 *    new key.
 *
 * This means an attacker who can read your localStorage cannot decrypt
 * the token without also having the session key from the same browser tab.
 */

const SESSION_KEY_NAME = 'lore-session-key'; // sessionStorage — ephemeral
const TOKEN_STORE_NAME = 'lore-token-enc';   // localStorage  — encrypted payload
const URL_STORE_NAME   = 'lore-backstage-url'; // localStorage — plaintext (not sensitive)

interface EncryptedPayload {
  iv: string;   // base64-encoded 12-byte IV
  data: string; // base64-encoded ciphertext
}

// ── Helpers ────────────────────────────────────────────────────────────────

function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

/** Returns a plain ArrayBuffer so Web Crypto APIs accept it without casting. */
function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const buf    = new ArrayBuffer(binary.length);
  const view   = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return buf;
}

// ── Key management ─────────────────────────────────────────────────────────

/**
 * Returns the current session key, creating and saving one if it doesn't
 * exist yet. The key is exportable only within this module — it is never
 * exposed to application code.
 */
async function getOrCreateSessionKey(): Promise<CryptoKey> {
  const stored = sessionStorage.getItem(SESSION_KEY_NAME);

  if (stored) {
    const raw = base64ToBuffer(stored);
    return crypto.subtle.importKey(
      'raw', raw, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
    );
  }

  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'],
  );

  const exported = await crypto.subtle.exportKey('raw', key);
  sessionStorage.setItem(SESSION_KEY_NAME, bufferToBase64(exported));

  return key;
}

// ── Public API ─────────────────────────────────────────────────────────────

/** Encrypt and persist a token. Also persists the Backstage URL (plaintext). */
export async function saveCredentials(baseUrl: string, token: string): Promise<void> {
  const key = await getOrCreateSessionKey();
  const ivBuf     = crypto.getRandomValues(new Uint8Array(12));
  const encoded   = new TextEncoder().encode(token);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: ivBuf }, key, encoded);

  const payload: EncryptedPayload = {
    iv:   bufferToBase64(ivBuf.buffer as ArrayBuffer),
    data: bufferToBase64(encrypted),
  };

  localStorage.setItem(TOKEN_STORE_NAME, JSON.stringify(payload));
  localStorage.setItem(URL_STORE_NAME, baseUrl);
}

/**
 * Decrypt and return the stored token.
 * Returns null if nothing is stored or the session key has expired
 * (i.e. the tab was closed and reopened).
 */
export async function loadToken(): Promise<string | null> {
  const raw        = localStorage.getItem(TOKEN_STORE_NAME);
  const sessionKey = sessionStorage.getItem(SESSION_KEY_NAME);

  if (!raw || !sessionKey) return null;

  try {
    const payload = JSON.parse(raw) as EncryptedPayload;
    const key       = await getOrCreateSessionKey();
    const iv        = new Uint8Array(base64ToBuffer(payload.iv));
    const data      = base64ToBuffer(payload.data);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, key, data,
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    // Key mismatch or corrupted data — treat as missing
    return null;
  }
}

/** Returns the saved Backstage base URL (if any). */
export function loadBaseUrl(): string | null {
  return localStorage.getItem(URL_STORE_NAME);
}

/**
 * True when both an encrypted token payload AND the matching session key
 * are present (i.e. the current tab has a live, usable token).
 */
export function hasLiveToken(): boolean {
  return (
    localStorage.getItem(TOKEN_STORE_NAME) !== null &&
    sessionStorage.getItem(SESSION_KEY_NAME) !== null
  );
}

/**
 * True when a URL is saved but the session key has gone (tab was closed).
 * The user needs to re-enter their token.
 */
export function needsTokenReEntry(): boolean {
  return (
    localStorage.getItem(URL_STORE_NAME) !== null &&
    localStorage.getItem(TOKEN_STORE_NAME) !== null &&
    sessionStorage.getItem(SESSION_KEY_NAME) === null
  );
}

/** Wipe all stored credentials. */
export function clearCredentials(): void {
  localStorage.removeItem(TOKEN_STORE_NAME);
  localStorage.removeItem(URL_STORE_NAME);
  sessionStorage.removeItem(SESSION_KEY_NAME);
}
