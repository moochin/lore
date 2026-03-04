import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { saveCredentials, loadBaseUrl, needsTokenReEntry } from '../services/tokenStore';
import { CatalogClient } from '../services/catalog';

const REPO_URL = import.meta.env.VITE_REPO_URL ?? 'https://github.com/your-org/lore';

// ── Styles ─────────────────────────────────────────────────────────────────

const S = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'radial-gradient(ellipse at 50% 30%, #1a2a4a 0%, #0d1117 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    fontFamily: '"Courier New", Courier, monospace',
    color: '#c9d1d9',
    overflow: 'auto',
    padding: '24px 12px',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    background: '#161b22',
    border: '1px solid #30363d',
    borderRadius: 8,
    padding: '32px 32px 24px',
    boxShadow: '0 16px 64px rgba(0,0,0,0.7)',
  },
  logo: {
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  logoIcon: {
    fontSize: 40,
    display: 'block',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: '#ffd700',
    textShadow: '0 0 24px rgba(255,215,0,0.4)',
    margin: 0,
  },
  subtitle: {
    fontSize: 11,
    color: '#8b949e',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    marginTop: 4,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #21262d',
    margin: '20px 0',
  },
  tagline: {
    fontSize: 13,
    color: '#8b949e',
    lineHeight: 1.6,
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  reEntryBanner: {
    background: '#1c2a1c',
    border: '1px solid #3fb950',
    borderRadius: 6,
    padding: '10px 14px',
    fontSize: 12,
    color: '#3fb950',
    marginBottom: 20,
    lineHeight: 1.5,
  },
  label: {
    display: 'block',
    fontSize: 12,
    color: '#8b949e',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrap: {
    position: 'relative' as const,
    marginBottom: 16,
  },
  input: {
    width: '100%',
    background: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: 6,
    padding: '9px 12px',
    color: '#c9d1d9',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  },
  inputFocused: {
    borderColor: '#58a6ff',
  },
  eyeBtn: {
    position: 'absolute' as const,
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#8b949e',
    fontSize: 15,
    padding: 2,
  },
  securityBox: {
    background: '#0d1117',
    border: '1px solid #21262d',
    borderRadius: 6,
    padding: '12px 14px',
    marginBottom: 12,
    fontSize: 12,
    lineHeight: 1.6,
    color: '#8b949e',
  },
  securityRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  securityIcon: {
    fontSize: 15,
    flexShrink: 0,
    marginTop: 1,
  },
  securityTitle: {
    color: '#c9d1d9',
    fontWeight: 600,
    display: 'block',
    marginBottom: 2,
  },
  networkHighlight: {
    color: '#79c0ff',
    fontWeight: 600,
  },
  error: {
    background: '#3d1212',
    border: '1px solid #f85149',
    borderRadius: 6,
    padding: '9px 14px',
    fontSize: 12,
    color: '#f85149',
    marginBottom: 16,
  },
  connectBtn: {
    width: '100%',
    padding: '11px 0',
    background: 'linear-gradient(135deg, #b8860b 0%, #ffd700 50%, #b8860b 100%)',
    backgroundSize: '200% 100%',
    border: 'none',
    borderRadius: 6,
    color: '#0d1117',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'inherit',
    cursor: 'pointer',
    letterSpacing: 1,
    transition: 'opacity 0.2s, transform 0.1s',
    marginTop: 20,
    marginBottom: 8,
  },
  connectBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTop: '1px solid #21262d',
    textAlign: 'center' as const,
    fontSize: 11,
    color: '#484f58',
  },
  footerLink: {
    color: '#8b949e',
    textDecoration: 'none',
  },
  footerSep: {
    margin: '0 8px',
    color: '#21262d',
  },
  aboutBox: {
    marginTop: 14,
    background: '#0d1117',
    border: '1px solid #21262d',
    borderRadius: 6,
    padding: '14px 16px',
    fontSize: 11,
    color: '#8b949e',
    lineHeight: 1.7,
    textAlign: 'left' as const,
  },
  cspCode: {
    display: 'block',
    background: '#161b22',
    border: '1px solid #30363d',
    borderRadius: 4,
    padding: '6px 10px',
    fontSize: 10,
    color: '#79c0ff',
    marginTop: 6,
    whiteSpace: 'pre' as const,
    overflowX: 'auto' as const,
  },
};

// ── Component ──────────────────────────────────────────────────────────────

type Phase = 'idle' | 'testing' | 'success' | 'error';

export function ConnectionScreen() {
  const setBackstageConnected = useGameStore((s) => s.setBackstageConnected);

  const [url,           setUrl]           = useState(loadBaseUrl() ?? '');
  const [token,         setToken]         = useState('');
  const [showToken,     setShowToken]     = useState(false);
  const [phase,         setPhase]         = useState<Phase>('idle');
  const [errorMsg,      setErrorMsg]      = useState('');
  const [showAbout,     setShowAbout]     = useState(false);
  const [urlFocused,    setUrlFocused]    = useState(false);
  const [tokenFocused,  setTokenFocused]  = useState(false);

  const isReEntry = needsTokenReEntry();

  // Auto-focus the token field when re-entering (URL already saved)
  useEffect(() => {
    if (isReEntry) setTokenFocused(true);
  }, [isReEntry]);

  const canSubmit = url.trim().length > 0 && token.trim().length > 0 && phase !== 'testing';

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setPhase('testing');
    setErrorMsg('');

    const client = new CatalogClient({ baseUrl: url.trim(), token: token.trim() });
    const result = await client.testConnection();

    if (!result.ok) {
      setPhase('error');
      setErrorMsg(result.reason);
      return;
    }

    await saveCredentials(url.trim(), token.trim());
    setPhase('success');

    // Brief pause so the user sees success, then hand off to the game
    setTimeout(() => {
      setBackstageConnected(url.trim());
    }, 600);
  }

  return (
    <div style={S.overlay}>
      <div style={S.card}>

        {/* ── Logo ── */}
        <div style={S.logo}>
          <span style={S.logoIcon}>⚔️</span>
          <h1 style={S.title}>LORE</h1>
          <p style={S.subtitle}>Logically Orchestrated RPG Environment</p>
        </div>

        <hr style={S.divider} />

        <p style={S.tagline}>
          Connect to your Backstage catalog and explore your organisation<br />
          as a living, breathing 16-bit RPG world.
        </p>

        {/* ── Re-entry notice ── */}
        {isReEntry && (
          <div style={S.reEntryBanner}>
            ✅ <strong>Welcome back, adventurer.</strong> Your Backstage URL is saved.
            Re-enter your API token to resume your journey — session keys clear when
            the tab closes, keeping your credentials safe.
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleConnect}>

          {/* URL field */}
          {!isReEntry && (
            <div style={S.inputWrap}>
              <label style={S.label} htmlFor="lore-url">Backstage URL</label>
              <input
                id="lore-url"
                type="url"
                placeholder="https://backstage.example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={() => setUrlFocused(true)}
                onBlur={() => setUrlFocused(false)}
                style={{ ...S.input, ...(urlFocused ? S.inputFocused : {}) }}
                autoComplete="url"
                required
              />
            </div>
          )}

          {/* Token field */}
          <div style={S.inputWrap}>
            <label style={S.label} htmlFor="lore-token">
              API Token
              {isReEntry && (
                <span style={{ color: '#58a6ff', marginLeft: 8 }}>
                  (for <strong>{url}</strong>)
                </span>
              )}
            </label>
            <input
              id="lore-token"
              type={showToken ? 'text' : 'password'}
              placeholder="••••••••••••••••••••••••"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onFocus={() => setTokenFocused(true)}
              onBlur={() => setTokenFocused(false)}
              style={{ ...S.input, paddingRight: 36, ...(tokenFocused ? S.inputFocused : {}) }}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              style={S.eyeBtn}
              onClick={() => setShowToken((v) => !v)}
              title={showToken ? 'Hide token' : 'Show token'}
            >
              {showToken ? '🙈' : '👁'}
            </button>
          </div>

          {/* ── Security notes ── */}
          <div style={S.securityBox}>
            <div style={{ ...S.securityRow, marginBottom: 10 }}>
              <span style={S.securityIcon}>🔐</span>
              <div>
                <span style={S.securityTitle}>Local-only encryption</span>
                Your token is encrypted with <strong>AES-256-GCM</strong> before
                being written to localStorage. The encryption key lives in session
                memory only — it is never written to disk or sent anywhere.
                When you close this tab, the key is gone.
              </div>
            </div>
            <div style={S.securityRow}>
              <span style={S.securityIcon}>🔍</span>
              <div>
                <span style={S.securityTitle}>Verify it yourself</span>
                Open your browser's <span style={S.networkHighlight}>Network Tab</span> — you'll
                see requests go directly to your Backstage instance and{' '}
                <span style={S.networkHighlight}>nowhere else</span>.
                No proxy. No analytics. No third-party calls.
              </div>
            </div>
          </div>

          {/* ── Error ── */}
          {phase === 'error' && (
            <div style={S.error}>⚠️ {errorMsg}</div>
          )}

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              ...S.connectBtn,
              ...(!canSubmit ? S.connectBtnDisabled : {}),
            }}
          >
            {phase === 'testing' ? '⏳  Connecting…' :
             phase === 'success' ? '✅  Connected! Entering the realm…' :
             '▶  Enter the Realm'}
          </button>
        </form>

        {/* ── Footer ── */}
        <div style={S.footer}>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" style={S.footerLink}>
            📖 View Source
          </a>
          <span style={S.footerSep}>·</span>
          <button
            onClick={() => setShowAbout((v) => !v)}
            style={{ ...S.footerLink, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}
          >
            {showAbout ? '▲ Hide' : '▾ About & Security'}
          </button>

          {showAbout && (
            <div style={S.aboutBox}>
              <strong style={{ color: '#c9d1d9' }}>About LORE</strong>
              <p style={{ marginTop: 6 }}>
                LORE is an open-source tool that transforms your Backstage software
                catalog into an explorable 16-bit RPG world. Teams become villages,
                services become buildings, and your colleagues become NPCs who share
                the real lore of your organisation.
              </p>
              <p style={{ marginTop: 8 }}>
                All source code is publicly auditable at{' '}
                <a href={REPO_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#79c0ff' }}>
                  {REPO_URL}
                </a>.
              </p>

              <hr style={{ border: 'none', borderTop: '1px solid #21262d', margin: '12px 0' }} />

              <strong style={{ color: '#c9d1d9' }}>🛡️ For self-hosters — Content Security Policy</strong>
              <p style={{ marginTop: 6 }}>
                If you host LORE yourself, add a strict{' '}
                <code style={{ color: '#79c0ff' }}>Content-Security-Policy</code> header
                on your server to restrict the browser to only your Backstage instance:
              </p>
              <code style={S.cspCode}>
{`Content-Security-Policy:
  default-src 'self';
  script-src  'self' 'unsafe-inline';
  style-src   'self' 'unsafe-inline';
  img-src     'self' data: blob:;
  connect-src 'self' https://backstage.your-company.com;`}
              </code>
              <p style={{ marginTop: 8 }}>
                Replace <code style={{ color: '#79c0ff' }}>https://backstage.your-company.com</code>{' '}
                with your actual Backstage URL. This header instructs the browser to
                block any outbound connection that is not to your instance — even
                if malicious code were somehow injected.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
