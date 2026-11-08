# Aftercare Loop — 2-minute demo narration (v2)

Target: at most 120 s (v2 renders at 119.7 s with a 0.6 s gap after each segment), about 245 words. Voice: Gemini TTS, warm/friendly (Sulafat or Achird), style "warm, clear, unhurried".
Each block = one shot. Timecodes are targets; the assembly script fits video clips to the generated audio durations.

| # | t (s) | Shot | Narration |
|---|---|---|---|
| 1 | 0–9 | Title card: Aftercare Loop logo, tagline "Understand → Ask → Verify → Act → Follow Up" | Meet Aftercare Loop. It helps women understand their health information, check their understanding, and follow through on their care. |
| 2 | 9–17 | Problem card (stat tiles from the evidence brief) | Patients forget most of what they hear at a visit. For many women, that means missed follow-ups. |
| 3 | 17–31 | Dashboard, pick Patient A (PCOS) | Here's a fictional patient, Maya, who just received a PCOS after-visit summary. Her dashboard is simple and reassuring, and it adapts to any condition, not just one. |
| 4 | 31–45 | Understand page: paste summary, "Explain this to me", five sections appear | She pastes her visit summary. Aftercare Loop explains it in plain language, defines the medical terms, separates what her clinician documented from general education, and links every source. |
| 5 | 45–63 | Click "View source" highlight on a next step, then switch to Patient C (Priya) for ~15 s: Understand → "Explain this to me" → "Needs clarification" card with the "Not verified" step | Every next step is traced to the exact sentence in her summary. For another fictional patient, Priya, one step didn't match her summary word for word, so it's held for clarification. This is how a fabricated instruction is refused. |
| 6 | 63–75 | Open Ask Kat, click "What should I ask my doctor?" | Meet Kat, her health companion. Kat knows her summary, her plan, and the barriers she reported, and helps her prepare real questions for her care team. |
| 7 | 75–88 | Check My Understanding: wrong answer → "Let me explain that another way." → retry | Then comes the part most tools skip: a gentle teach-back check. When Maya misunderstands, Kat explains it another way and lets her try again, with no judgment. |
| 8 | 88–96 | Action plan with clinician items, barrier-aware suggestion, then Follow Up copy summary | Her action plan suggests telehealth for her transportation barrier, plus a summary for her next visit. |
| 9 | 96–105 | Evaluation dashboard + safety banner example | Safety rules run first, and every metric comes from tests on fictional patients, not clinical validation. |
| 10 | 105–120 | Closing card: team + mentors, "Fictional data. Not medical advice." | Aftercare Loop. Built by Team HW1: Stephanie Kim, Ava Amidei, Kemigisha Sherifah Muzungu, and Payton Mendygral, with mentors Rhea John and Pavel Stepanov. |

Notes
- Patient name "Maya" matches the pt-a-pcos fixture displayName (Maya Thompson). "Priya" matches pt-c-endometriosis (Priya Shah). Her scripted interpretation carries one deliberately paraphrased instruction, so the "Needs clarification" state really renders.
- v2 (validation fix 11): shot 5 adds the Priya "Needs clarification" beat; shots 2 and 8 were shortened and shot 9 now says the metrics come from tests on fictional patients, not clinical validation. Timecodes above are the rendered segment slots from `out/segments.json`.
- Keep all on-screen stats sourced from docs/research/EVIDENCE-BRIEF.md with citation footers.
- Captions: burn in subtitles from this script for accessibility (YouTube also gets an .srt).
