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

## Design tokens
Implemented in `aftercare-loop-app/src/app/globals.css` (`@theme`). Use them as Tailwind utilities (`bg-primary`, `text-gray-90`, `rounded-3xl`, `shadow-float`, …).

| Group | Tokens |
|---|---|
| Primary (personalised) | `--color-primary` #FBA17E, `--color-primary-50 … -900` (500 = base; 50 #FFF4F0, 100 #FEE6DC, 700 #B73706, 800 #8B2A04, 900 #631E03), `--color-primary-soft`, `--color-primary-hover`, `--color-primary-strong` #EE6200, `--color-primary-ring`, `--color-primary-ink`, `--color-primary-contrast` (text on primary), `--color-primary-strong-contrast`. `<ThemeApplier/>` rewrites these on `<html>` from the chosen accent. Defaults match `deriveAccentVars("#FBA17E")`. |
| Secondary | `--color-secondary` #F7D794, `--color-secondary-50/-100/-200`, `--color-secondary-strong` #7A5300 |
| Accent (Ask Kat, progress) | `--color-accent` #FF9A00, `--color-accent-50 … -950` (600 #E68A00 hover, 800 #804D00 text) |
| Logo | `--color-logo` #FFA617 (mark only) |
| Neutrals | `--color-gray-0` #FFFFFF, `-5` #F6F4F2, `-10` #ECE8E4, `-20` #DCD7D2, `-30` #C3BDB7, `-40` #A69F98, `-50` #8C867F, `-60` #696460, `-70` #504B46, `-80` #3A3632, `-90` #25221F, `-100` #141414. Tailwind's default gray palette is reset, so only these exist. |
| Semantic | `--color-success/-soft/-strong`, `--color-warning/-soft/-strong`, `--color-danger/-soft/-strong`, `--color-info/-soft/-strong`, `--color-origin-{clinician,patient,ai}[-soft]`, `--color-highlight` (= secondary) / `--color-highlight-ink` |
| Shape | `--radius-card` 1.5rem (= `rounded-3xl`), `--radius-control` 1rem (= `rounded-2xl`, inputs), `--radius-sheet` 1.75rem (mobile sheet top corners). Buttons and pills use `rounded-full`. |
| Elevation | `--shadow-float` is the only shadow. It is used on the FAB, sheet, dialog and toast. Everything else is flat. |
| Type | `--font-sans` = Montserrat (`next/font/google`, 400/500/600/700, variable `--font-montserrat`). Root is 17px on mobile and 16px on desktop. |
| Legacy aliases | `canvas`, `surface`, `surface-muted`, `border`, `border-strong`, `ink`, `ink-muted`, `ink-subtle`, `brand-*` map onto the tokens above. They are for older code only; don't use them in new code. |

Surfaces: the page canvas is gray-5, cards are gray-0 (muted cards are gray-10), list rows and insets inside cards are gray-5, and inputs are filled gray-5 with a primary-700 focus ring. Selected chips and answers use the secondary fill. Active nav uses a primary pill with a solid Heroicon. Icons: 24/outline for nav and actions, 24/solid for filled or active states, 20/solid inside buttons. The shared icon type is `HeroIcon` in `src/components/ui/icon.ts`. There is one deliberate outline: AI-suggested items keep a dashed edge, a non-colour cue for "suggestion, not an instruction" (ARCHITECTURE §2.4).

Contrast (WCAG 2.x, computed):
- gray-90 on primary #FBA17E is 7.91:1, and gray-100 on primary is 9.21:1. gray-100 on primary-strong #EE6200 is 5.60:1. gray-100 on accent #FF9A00 is 8.66:1, and on accent-600 it is 7.02:1.
- White text fails on most of these fills: 3.29:1 on #EE6200 (passes only as large text, ≥18px bold), 2.13:1 on #FF9A00 (fails even as large text), and 2.00:1 on #FBA17E. So the UI never puts white text on primary or accent fills. White is used only on danger (6.57:1), success (5.36:1) and warning (6.22:1).
- Body text gray-90 on white is 15.82:1. Secondary text gray-70 is 7.86:1 on gray-5 and 7.07:1 on gray-10. Captions and placeholders in gray-60 are 5.33:1 on gray-5.
- Links and emphasis use `text-primary-800`, which is at least 4.9:1 on white and gray-5 for every accent preset (peach 8.64:1). The focus ring `primary-700` is at least 3.37:1 on white and gray-5 for every preset.
- Selected chips: gray-100 on secondary #F7D794 is 12+:1. Kat chips: accent-900 on accent-100 is 8.94:1.
