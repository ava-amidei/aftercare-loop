# Aftercare Loop — Expo shell (Expo Go on your phone)

A thin Expo app that opens the Aftercare Loop web app in a WebView, so the team can try it on a
phone through **Expo Go** without a native build.

```bash
npm install
# 1. serve the web app from the Mac (in aftercare-loop-app): npm run build && npx next start -H 0.0.0.0 -p 3000
# 2. start Expo on the same Wi-Fi:
npx expo start --lan
# 3. open Expo Go on the phone and scan the QR code (or type the exp:// URL it prints)
```

The WebView opens the live site https://aftercare-loop.vercel.app by default. To point it at a Mac on the same Wi-Fi instead:

```bash
EXPO_PUBLIC_APP_URL=http://<mac-lan-ip>:3000 npx expo start --lan
```

The web app is also an installable PWA; opening the same URL in Safari/Chrome and choosing
"Add to Home Screen" works without Expo. The Capacitor shell in `../aftercare-loop-mobile` is the
path to real App Store / Play builds.
