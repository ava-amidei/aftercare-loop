import type { MetadataRoute } from "next";

/** Web app manifest → served at /manifest.webmanifest (docs/DESIGN.md brand). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aftercare Loop",
    short_name: "Aftercare",
    description:
      "Understand, verify and follow through on documented care instructions. Demonstration using fictional patient data.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#FBA17E",
    background_color: "#FFF8F2",
    categories: ["health", "medical"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
