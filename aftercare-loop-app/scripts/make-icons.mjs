#!/usr/bin/env node
/**
 * One-off PWA icon generator (personalization-and-pwa).
 *
 * Renders public/brand/logo.svg centred on a #FFF8F2 background with headless
 * Chromium (Playwright) and screenshots it to PNG:
 *   public/icons/icon-192.png, icon-512.png     purpose "any"  (rounded, transparent corners)
 *   public/icons/maskable-192.png, maskable-512.png  purpose "maskable" (full bleed, logo in the 80% safe zone)
 *   public/apple-touch-icon.png                 180px, full bleed (iOS applies its own rounding)
 *
 * Usage (from aftercare-loop-app/): node scripts/make-icons.mjs
 * Requires the Playwright Chromium browser (npx playwright install chromium).
 */
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");
const publicDir = path.join(appRoot, "public");
const BACKGROUND = "#FFF8F2";

/** size px, logo fraction of the canvas, corner radius fraction (0 = square). */
const TARGETS = [
  { file: "icons/icon-192.png", size: 192, logo: 0.66, radius: 0.22 },
  { file: "icons/icon-512.png", size: 512, logo: 0.66, radius: 0.22 },
  { file: "icons/maskable-192.png", size: 192, logo: 0.52, radius: 0 },
  { file: "icons/maskable-512.png", size: 512, logo: 0.52, radius: 0 },
  { file: "apple-touch-icon.png", size: 180, logo: 0.64, radius: 0 },
];

function html(svg, { size, logo, radius }) {
  const logoPx = Math.round(size * logo);
  return `<!doctype html><html><head><style>
    html,body{margin:0;padding:0;background:transparent;}
    .tile{width:${size}px;height:${size}px;background:${BACKGROUND};
      border-radius:${Math.round(size * radius)}px;display:flex;align-items:center;justify-content:center;}
    .tile svg{width:${logoPx}px;height:${logoPx}px;display:block;}
  </style></head><body><div class="tile">${svg}</div></body></html>`;
}

const svg = (await readFile(path.join(publicDir, "brand/logo.svg"), "utf8")).replace(/<\?xml[^>]*>/, "");
await mkdir(path.join(publicDir, "icons"), { recursive: true });

const browser = await chromium.launch();
try {
  for (const t of TARGETS) {
    const page = await browser.newPage({ viewport: { width: t.size, height: t.size }, deviceScaleFactor: 1 });
    await page.setContent(html(svg, t));
    const out = path.join(publicDir, t.file);
    await page.locator(".tile").screenshot({ path: out, omitBackground: true });
    await page.close();
    console.log(`wrote ${path.relative(appRoot, out)} (${t.size}x${t.size})`);
  }
} finally {
  await browser.close();
}
