# Aftercare Loop: native mobile shell (Capacitor)

This wraps the live Aftercare Loop web app in a native iOS/Android shell so the team can install it on phones.

**Live URL note:** the shell does not bundle the web app. It loads `server.url` from `capacitor.config.json`, which is
**https://aftercare-loop.vercel.app**, so every web deploy shows up in the app with no rebuild. If the phone or Mac
network blocks `*.vercel.app`, the app shows a blank peach (#FBA17E) screen. That is a network problem, not a build problem.

- Bundle ID: `com.aftercareloop.app` · Display name: **Aftercare Loop**
- iOS uses Swift Package Manager (no CocoaPods, no `.xcworkspace`). Open `ios/App/App.xcodeproj`.
- Branding: 1024×1024 AppIcon (white flower on #FBA17E), #FBA17E launch screen, and #FBA17E WebView background
  behind the status bar (matches the site's `themeColor`).

## Setup

```bash
cd aftercare-loop-mobile
npm install
npx cap sync ios          # run again after any change to capacitor.config.json
```

## Run in the iOS Simulator

```bash
# 1. Build
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' -derivedDataPath build/sim CODE_SIGNING_ALLOWED=NO build
# 2. Boot an iPhone (list them with: xcrun simctl list devices available)
xcrun simctl boot "iPhone 18 Pro"
# 3. Install
xcrun simctl install booted build/sim/Build/Products/Debug-iphonesimulator/App.app
# 4. Launch
xcrun simctl launch booted com.aftercareloop.app
# 5. Show the window (Xcode 27 ships the Simulator UI inside DeviceHub)
open /Applications/Xcode.app/Contents/Applications/DeviceHub.app
```

You can also run `npx cap open ios`, pick an iPhone simulator in the toolbar and press Run (⌘R).

## Install on your iPhone from Xcode (free personal Apple team)

1. Xcode → Settings → Accounts → **+** → Apple ID → sign in. A "(Personal Team)" appears.
2. `npx cap open ios` (opens `ios/App/App.xcodeproj`).
3. Select the **App** project → **App** target → **Signing & Capabilities** → check **Automatically manage signing**
   → Team: *Your Name (Personal Team)*. If the bundle ID is taken, change it to something unique such as
   `com.<yourname>.aftercareloop`.
4. Plug the iPhone in with a cable, unlock it and tap **Trust This Computer**. On iOS 16+, also turn on
   Settings → Privacy & Security → **Developer Mode** and restart.
5. Pick the iPhone in the Xcode toolbar and press **Run** (⌘R).
6. The first time, on the phone: Settings → General → VPN & Device Management → your Apple ID → **Trust**.

Free personal-team builds expire after 7 days. Press Run again to refresh them.

## Build an IPA and sideload it

You need the Apple ID from step 1 above, and the iPhone must be plugged in so it gets registered. A personal team can
only do **development** export. Ad Hoc and App Store export need a paid account.

```bash
TEAM_ID=XXXXXXXXXX   # Xcode → Settings → Accounts → your team, or: security find-identity -v -p codesigning
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' \
  -archivePath build/App.xcarchive DEVELOPMENT_TEAM=$TEAM_ID CODE_SIGN_STYLE=Automatic \
  -allowProvisioningUpdates -allowProvisioningDeviceRegistration archive
cat > build/ExportOptions.plist <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>development</string>
  <key>signingStyle</key><string>automatic</string>
  <key>teamID</key><string>$TEAM_ID</string>
  <key>compileBitcode</key><false/>
</dict></plist>
PLIST
xcodebuild -exportArchive -archivePath build/App.xcarchive -exportOptionsPlist build/ExportOptions.plist \
  -exportPath build/ipa -allowProvisioningUpdates
mv build/ipa/App.ipa build/ipa/AftercareLoop.ipa
```

To install the IPA, use either of these. Both work only on iPhones registered to the signing team.
- **Xcode Devices window:** Window → Devices and Simulators → select the iPhone → **+** under Installed Apps → choose
  `build/ipa/AftercareLoop.ipa`.
- **Apple Configurator** (Mac App Store): connect the iPhone → double-click it → Add → Apps → Choose from my Mac →
  pick the IPA. You can also drag the IPA onto the device.

## Local testing without the live site

In `aftercare-loop-app` run `npm run dev -- -H 0.0.0.0`. Then set `server.url` to `http://127.0.0.1:3000` (Simulator)
or `http://<mac-lan-ip>:3000` (phone), with `"cleartext": true`, and run `npx cap sync ios`. Do not commit that change.

## Android

`npx cap sync android && npx cap open android` (requires Android Studio).

The web app is also an installable PWA ("Add to Home Screen"), so no native build is required to use it on a phone.

`build/` holds local build output and is git-ignored.
