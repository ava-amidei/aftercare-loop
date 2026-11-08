# YouTube upload — Aftercare Loop demo

**File:** `video/out/aftercare-loop-demo.mp4` (1920×1080, 30 fps, H.264 + AAC, 2:00 (119.7 s))
**Captions file:** `video/out/aftercare-loop-demo.srt` (English; captions are also burned into the video)

## Title (pick one, all under 100 characters)

1. Aftercare Loop: AI that helps women understand, verify and follow through on their care (2-min demo)
2. Aftercare Loop | Understand → Ask → Verify → Act → Follow Up | Women's health literacy demo
3. Most patients forget what the doctor said. Aftercare Loop closes the loop. (2-minute demo)

Recommended: option 1.

## Description

Most of what patients hear at a doctor's visit is forgotten or remembered wrong. Aftercare Loop is an AI-powered health literacy companion that helps women understand their after-visit summary, check their understanding, act on their care plan, and hand unresolved questions back to their care team.

In this 2-minute demo, Maya, a fictional patient with a new PCOS diagnosis, pastes her after-visit summary. Aftercare Loop:
• Understand: explains it in plain language and defines the medical terms
• Ask: Kat, her health companion, answers from her own documented plan and saves questions for the clinic
• Verify: a gentle teach-back check catches a misunderstanding and explains it another way, no judgment
• Act: every instruction becomes an action traced to the exact sentence her clinician wrote ("View source"); anything that doesn't match word for word is held under "Needs clarification"
• Follow Up: an editable summary of questions, barriers and unresolved items goes back to the care team

What makes it trustworthy
• Deterministic safety rules run before any AI response (chest pain, bleeding, breathing, self-harm, postpartum warning signs)
• Source-to-action traceability: an instruction enters the plan only if its quote matches the document exactly
• Honest demo mode: every AI-shaped response is labeled, and the demo runs in Scripted Demo Mode
• Barrier-aware planning: transportation, cost, caregiving and language are planned around, not ignored
• Evaluation dashboard: automated, reproducible tests on synthetic patients, shown in the app

Try it: https://aftercare-loop.vercel.app
Code and docs: https://github.com/ava-amidei/aftercare-loop

Built by Team HW1: Stephanie Kim, Ava Amidei, Kemigisha Sherifah Muzungu M and Payton Mendygral.
Mentors: Rhea John and Pavel Stepanov.

Sources for the statistics shown: Kessels, J R Soc Med 2003; Laws et al., PLoS ONE 2018; Kutner et al., NCES 2006 (NAAL 2003); Rodin et al., J Womens Health 2019. Narration voice generated with text-to-speech (Gemini TTS).

⚠️ Fictional data. Not medical advice. All patients, documents and results shown are synthetic. The evaluation results are automated tests, not clinical validation; there were no real users. Aftercare Loop does not diagnose, change medications or replace your care team. In an emergency, call your local emergency number (911 in the US). For suicide and crisis support in the US, call or text 988.

#HealthLiteracy #WomensHealth #PatientEducation #TeachBack #AIforGood #Hackathon

## Chapters

(Paste into the description. The first chapter is at 0:00 and every chapter is at least 10 s long. The title and problem segments are merged because the title alone is 9.4 s.)

```
0:00 Aftercare Loop and the problem
0:16 Maya's dashboard
0:31 Understand: plain-language explanation
0:45 View source and Needs clarification
1:02 Ask Kat
1:14 Check my understanding (teach-back)
1:27 Action plan, follow-up summary and evaluation
1:44 Team and mentors
```

Chapter times are the segment start times in `video/out/segments.json` (16.72, 31.04, 45.28, 62.56, 74.56, 87.64 and 104.80 s), rounded down to the second. The action-plan (8.2 s) and evaluation (9.0 s) segments are merged into one chapter because YouTube needs at least 10 s per chapter.

## Suggested tags

health literacy, after-visit summary, teach-back, patient education, women's health, PCOS, care follow-up, hackathon, AI safety, source traceability
