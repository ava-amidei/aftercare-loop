# Deploying Aftercare Loop

The web app (`aftercare-loop-app/`) is a Next.js 16 server app. It deploys to **Firebase App Hosting**
from local source; the native shell in `aftercare-loop-mobile/` and the PWA both point at the live URL.

> Automated agents in this repo cannot run deploy commands. A team member runs the steps below once.

## Prerequisites

- Firebase project `aftercare-loop-hw1` (owned by the team Gmail account) on the **Blaze** (pay-as-you-go) plan. App Hosting is not available on Spark.
- Node 22+ locally (`node --version`).
- Firebase CLI 15+: `npm i -g firebase-tools` or use `npx firebase-tools@latest`.
- App Hosting lists Next.js 13.5+ and Node 22+ as supported. Next.js 16 may show as "preview";
  if the build fails on the framework version, see "Fallbacks" below.

## One-time setup

```bash
cd /path/to/aftercare-loop
npx firebase-tools@latest login
npx firebase-tools@latest use aftercare-loop-hw1
# Create the backend (pick a region close to the event, e.g. us-central1).
# Choose "deploy from local source" when asked; do not connect a GitHub repo yet.
npx firebase-tools@latest apphosting:backends:create --project aftercare-loop-hw1
```

`firebase.json` at the repo root already names the backend `aftercare-loop` and points `rootDir` at
`aftercare-loop-app`. If you chose a different backend id, update `firebase.json`.

## Deploy

```bash
npx firebase-tools@latest deploy --only apphosting
```

The CLI prints the live URL (`https://aftercare-loop--<project>.<region>.hosted.app`). Then:

1. Put the URL in `aftercare-loop-mobile/capacitor.config.json` (`server.url`) and run `npx cap sync`
   inside `aftercare-loop-mobile/` to rebuild the phone shells.
2. Open the URL on a phone and use "Add to Home Screen" to install the PWA.
3. Confirm the yellow **Scripted Demo Mode** badge on the Understand result and in Ask Kat.

## Live Gemini responses on the deployed site (optional)

`aftercare-loop-app/apphosting.yaml` pins the public site to Scripted Demo Mode. To turn on live
responses:

```bash
npx firebase-tools@latest apphosting:secrets:set GEMINI_API_KEY   # paste the key when prompted
npx firebase-tools@latest apphosting:secrets:grantaccess GEMINI_API_KEY --backend aftercare-loop
```

Then in `apphosting.yaml` uncomment the `GEMINI_API_KEY` block, set `AFTERCARE_FORCE_SCRIPTED` to
`"false"`, and redeploy. Live calls measured 35–98 s on the free tier (see
`docs/VALIDATION-REPORT.md` §1), so keep the stage demo in Scripted Demo Mode.

Never put the key in `apphosting.yaml` as a plain `value`, in `.env.example`, or in any committed file.

## Fallbacks

- **Vercel (temporary URL, no account needed):** from `aftercare-loop-app/` run
  `npx vercel deploy --temporary --yes`. The deployment can be claimed into a Vercel account later.
  No key is set, so the site runs in Scripted Demo Mode.
- **Local network testing:** `npm run dev -- -H 0.0.0.0` in `aftercare-loop-app/`, then open
  `http://<mac-lan-ip>:3000` on a phone on the same Wi-Fi.

## Security notes for any deployment

- Security headers (CSP, HSTS in production, frame denial, no-sniff) and per-IP rate limiting are
  built into the app; nothing extra is needed at the host.
- Secrets are read server-side only. `grep -r NEXT_PUBLIC aftercare-loop-app/src` must stay empty.
- The app stores demo state in the browser only. It is not HIPAA-compliant and must not be used
  with real patient information.
