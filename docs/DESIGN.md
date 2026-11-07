# Aftercare Loop — Design Brief (team-provided, binding)

Source: team design direction shared 2026-11-07. This supersedes the provisional teal/coral palette in ARCHITECTURE.md §7.

## Brand
- **Logo:** `aftercare-loop-app/public/brand/logo.svg` (orange pinwheel/flower mark, fill #FFA617). Use it in the app bar, PWA icons, favicon, video title card and deck.
- **Font:** Montserrat (Google Fonts via `next/font/google`), weights 400/500/600/700. Headings 600–700, body 400–500.
- **Icons:** Heroicons (https://heroicons.com/) via `@heroicons/react` — outline set for navigation/actions at 24px, solid set for filled states and badges, mini (20px) inside buttons. Replace lucide-react everywhere.

## Color
Primary: **#FBA17E** (peach-orange). Palette:
| Token | Hex | Use |
|---|---|---|
| `--color-primary` | #FBA17E | primary buttons, active nav, FAB, highlights |
| `--color-primary-strong` | #EE6200 | pressed/hover primary, emphasis text on light surfaces |
| `--color-secondary` | #F7D794 | soft fills, selected chips, info surfaces |
| `--color-accent` | #FF9A00 | Ask Kat accent, progress, callouts |
| `--color-logo` | #FFA617 | logo mark only |
| `--color-gray-0 … --color-gray-100` | neutral scale in 10 steps (0 = white #FFFFFF, 100 = near-black #141414) | text, surfaces, dividers |
Derive tints/shades of the primary for hover/focus/disabled states; keep text contrast ≥ 4.5:1 (use gray-90+ text on peach surfaces; white text only on #EE6200 / #FF9A00 at large sizes — check ratios).

## Shape & surfaces
- "Fuller rounded bottom": generous radii — cards `rounded-3xl` (1.5rem), buttons/pills `rounded-full`, inputs `rounded-2xl`, sheets with rounded top corners on mobile.
- **No outlines:** no bordered/outlined buttons or cards; use filled surfaces (gray-5/gray-10 or secondary tint) and soft elevation instead of borders. Inputs use a filled gray-5 background with a focus ring in primary.
- **No shadow clutter** ("no shuttle"): at most one soft shadow level for floating elements (FAB, sheet); flat elsewhere.
- Native feel: large tap targets (≥44px), bottom tab bar with Heroicons + labels, sheet-style modals, haptic-like micro-interactions (subtle scale on press), system-like typography scale.

## Personalization & accessibility
- Users choose their own accent color: a palette picker in Profile (presets: #FBA17E default, #F7D794, #FF9A00, #EE6200, plus a few calm alternatives like sage, sky, lavender) stored per patient; applied by setting CSS variables on `<html>`.
- Adjustable font size: Small / Default / Large / Extra large control in Profile and in the app bar; scales the root font size.
- Readable for all generations and genders: plain language, high contrast, generous spacing, no gendered color coding, Montserrat at 17px+ body on mobile.

## Apply to
App UI (tokens, components, nav, Ask Kat FAB/panel), PWA icons/manifest, demo video title/end cards, pitch deck theme.
