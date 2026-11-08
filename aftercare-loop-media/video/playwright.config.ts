import { defineConfig } from "@playwright/test";

// Demo-video recorder config. Run from aftercare-loop-media/:
//   npx playwright test -c video/playwright.config.ts
// Expects the app already running in Scripted Demo Mode (see README.md).
export default defineConfig({
  testDir: ".",
  testMatch: ["record.spec.ts"],
  timeout: 120_000,
  retries: 0,
  workers: 1,
  fullyParallel: false,
  reporter: [["list"]],
  outputDir: "out/.pw-results",
  use: { browserName: "chromium" },
});
