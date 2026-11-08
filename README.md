# Aftercare Loop

AI-powered women's health literacy and patient empowerment platform (hackathon MVP).
**Understand → Ask → Verify → Act → Follow Up**, with "Ask Kat" as the conversational companion.

> Demonstration using fictional patient data. Not medical advice. Not HIPAA-compliant.

## Layout

| Path | What |
|---|---|
| `aftercare-loop-app/` | The Next.js application (see its README for setup) |
| `docs/` | Architecture contract, product spec, demo script, security roadmap, limitations, research brief |
| `aftercare-loop-mobile/` | Capacitor iOS/Android shell that wraps the live web app (see its README) |
| `aftercare-loop-media/` | Demo video pipeline (narration, TTS, recording, assembly) and pitch materials |
| `aftercare-loop-assets/` | Local-only assets and credentials (git-ignored, never committed) |

## Links

| What | Where |
|---|---|
| GitHub | https://github.com/ava-amidei/aftercare-loop |
| Pitch deck (claude.ai, source of truth) | https://claude.ai/artifact/N7aWepRV4jH6gVm9RrYCZu |
| Pitch deck, editable PowerPoint | [`aftercare-loop-media/pitch/aftercare-loop-pitch.pptx`](aftercare-loop-media/pitch/aftercare-loop-pitch.pptx) |
| Pitch deck, PDF | [`aftercare-loop-media/pitch/aftercare-loop-pitch.pdf`](aftercare-loop-media/pitch/aftercare-loop-pitch.pdf) |
| Deploy guide | [`docs/DEPLOY.md`](docs/DEPLOY.md) |
| Expo phone shell | [`aftercare-loop-expo/`](aftercare-loop-expo/) |
| Demo video | `aftercare-loop-media/video/out/aftercare-loop-demo.mp4` (git-ignored; upload to YouTube with [`aftercare-loop-media/video/youtube-description.md`](aftercare-loop-media/video/youtube-description.md)) |

## Team

Team HW1: Stephanie Kim, Ava Amidei, Kemigisha Sherifah Muzungu M, Payton Mendygral.
Mentors: Rhea John, Pavel Stepanov.

## Quick start

```bash
cd aftercare-loop-app
cp .env.example .env.local      # add ANTHROPIC_API_KEY for live Claude responses (optional)
npm install
npm run dev                     # http://localhost:3000
npm run check                   # lint + typecheck + tests + production build
npm run eval                    # reproducible synthetic evaluation → eval-results/latest.json
```

Without an API key the app runs in clearly labeled **Scripted Demo Mode**.
