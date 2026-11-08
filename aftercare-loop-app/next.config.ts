import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./src/lib/security/headers";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Demo app: most state is client-side; keep Next 16 caching features off to
  // avoid dynamic-data/Suspense constraints during the hackathon build.
  cacheComponents: false,
  // Don't advertise the framework (X-Powered-By).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: buildSecurityHeaders(isDev) }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
