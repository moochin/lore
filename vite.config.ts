import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Content Security Policy for the dev and preview servers.
 *
 * connect-src behaviour:
 *  - If VITE_BACKSTAGE_BASE_URL is set at build/serve time, only that origin
 *    is permitted for outbound connections (plus 'self').
 *  - If the env var is absent (typical local dev), any HTTPS connection is
 *    allowed so the runtime URL picker isn't blocked.
 *
 * Production deployments should set this env var and also serve the app with
 * an equivalent Content-Security-Policy HTTP header from their web server or
 * CDN — see the "About & Security" section in the connection screen.
 */
function buildCsp(): string {
  const backstageOrigin = process.env.VITE_BACKSTAGE_BASE_URL
    ? new URL(process.env.VITE_BACKSTAGE_BASE_URL).origin
    : null;

  const connectSrc = backstageOrigin
    ? `'self' ${backstageOrigin}`
    : `'self' https: http://localhost:*`;   // open during local dev; lock down in production

  return [
    `default-src 'self'`,
    `script-src  'self' 'unsafe-inline'`,   // Vite HMR requires unsafe-inline in dev
    `style-src   'self' 'unsafe-inline'`,
    `img-src     'self' data: blob:`,
    `font-src    'self'`,
    `connect-src ${connectSrc}`,
    `frame-src   'none'`,
    `object-src  'none'`,
    `base-uri    'self'`,
  ].join('; ');
}

const csp = buildCsp();

export default defineConfig({
  plugins: [react()],

  server: {
    headers: { 'Content-Security-Policy': csp },
  },

  preview: {
    headers: { 'Content-Security-Policy': csp },
  },
});
