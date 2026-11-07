import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Demo app: most state is client-side; keep Next 16 caching features off to
  // avoid dynamic-data/Suspense constraints during the hackathon build.
  cacheComponents: false,
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
