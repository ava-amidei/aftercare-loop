/**
 * HTTP security headers applied to every response via next.config.ts headers().
 * Imported by next.config.ts with a relative path — keep this file free of
 * "@/..." aliases and runtime dependencies.
 *
 * CSP without nonces (Next.js guide "Content Security Policy → Without Nonces"):
 * - script-src needs 'unsafe-inline' for the Next.js inline runtime/bootstrap,
 *   plus 'unsafe-eval' in development only (React Refresh / dev overlay).
 * - style-src 'unsafe-inline' for Next/Tailwind inline styles.
 * - next/font self-hosts Montserrat under /_next, so 'self' covers fonts; the
 *   Google Fonts origins are allowed only as a fallback.
 * - connect-src 'self' — the browser only calls this app's /api/* routes
 *   (dev adds ws: for HMR). Curated reference links open as navigations and
 *   need no connect-src entry.
 * - frame-ancestors 'none' + X-Frame-Options DENY block clickjacking.
 */

export interface SecurityHeader {
  key: string;
  value: string;
}

export function buildContentSecurityPolicy(isDev: boolean): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
    "connect-src": ["'self'", ...(isDev ? ["ws:", "wss:"] : [])],
    "media-src": ["'self'", "blob:"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}

export function buildSecurityHeaders(isDev: boolean): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(isDev) },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
  // HSTS only matters over HTTPS; omit in dev so localhost is never pinned.
  if (!isDev) headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" });
  return headers;
}
