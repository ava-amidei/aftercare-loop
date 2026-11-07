# Aftercare Loop

AI-powered women's health literacy and patient empowerment platform (hackathon MVP).
**Understand → Ask → Verify → Act → Follow Up**, with "Ask Kat" as the conversational companion.

> Demonstration using fictional patient data. Not medical advice. Not HIPAA-compliant.

## Layout

| Path | What |
|---|---|
| `aftercare-loop-app/` | The Next.js application (see its README for setup) |
| `docs/` | Architecture contract, product spec, demo script, security roadmap, limitations |
| `aftercare-loop-assets/` | Local-only assets and credentials (git-ignored, never committed) |

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
