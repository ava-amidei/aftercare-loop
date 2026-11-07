# Aftercare Loop — native mobile shell (Capacitor)

Wraps the live Aftercare Loop web app in a native iOS/Android shell so the team can install it on phones.

```bash
npm install
# point the shell at the live site (defaults to https://aftercare-loop.vercel.app)
# edit server.url in capacitor.config.json to your deployment, then:
npx cap sync
npx cap open ios        # opens Xcode → select your iPhone → Run
npx cap open android    # requires Android Studio
```

Local Wi-Fi testing without a deployment: in `aftercare-loop-app` run `npm run dev -- -H 0.0.0.0`,
then set server.url to `http://<mac-lan-ip>:3000` with `"cleartext": true`, then `npx cap sync`.

The web app is also an installable PWA ("Add to Home Screen") so no native build is required to use it on a phone.
