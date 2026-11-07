# Aftercare Loop — Five-Minute Demo Script

> **Tagline:** Aftercare Loop doesn't just answer health questions. It helps patients understand,
> verify, and follow through on documented care instructions.

Demo patient: **Maya Thompson** (`pt-a-pcos`), a fictional patient who lives in a rural area and is
learning about a new PCOS diagnosis. All data is synthetic. Unless an API key is configured, the
app runs in **Scripted Demo Mode**, and every AI-shaped response is labeled that way. Say so out
loud.

Button labels below come from the English UI dictionaries (`aftercare-loop-app/src/lib/i18n/en/`).
Rehearse once against the current build, because feature screens may still be changing.

## Before you start (not timed)

1. `cd aftercare-loop-app && npm run eval`. This writes `eval-results/latest.json` for Scene 6.
2. `npm run dev` and open <http://localhost:3000> (desktop) or the same URL at 375 px for mobile.
3. In the header, click **Reset Demo** and confirm. This clears earlier conversations and progress.
4. In the header patient switcher (**Fictional patient**), choose **Maya Thompson**.
5. Point out the banner: "Demonstration using fictional patient data."

## Scene 1 — Understand (0:00–0:50)

1. Click **Understand** in the navigation.
2. On the **My visit summary** tab, click **Load my sample summary** (or paste the summary text).
3. Click **Explain this to me**.
4. Walk through the sections: **What does this mean?**, **Words to know**, **What should I know?**,
   **What can I discuss with my provider?**, **What are my next steps?**, **Sources**.
5. Point out that next steps from the document are labeled as from the clinician, that general
   education is labeled separately, and that the mode badge is shown.

## Scene 2 — Ask Kat (0:50–1:40)

1. Click the **Ask Kat** button at the bottom right. The first time it opens, Kat shows her
   welcome message and the suggestion chips.
2. Type the sample question **"Can I drink water before my blood test?"** and click **Send**.
3. The scripted answer quotes Maya's summary: "Fasting means nothing to eat or drink except water
   for 8 hours before the test." It also says the summary doesn't mention whether to take her
   morning metformin before the test, and suggests asking the clinic.
4. Click **Add a question to my list** (the label on the suggested question) to save it. Close
   the panel.

## Scene 3 — Verify (1:40–2:40)

1. Click **Check** in the navigation (or **Check my understanding** on the Understand page).
2. On the metformin question ("How and when should you take your metformin?"), choose the wrong
   answer **"Once a day at bedtime on an empty stomach"** and click **Check my answer**.
3. Kat doesn't say "wrong". It names the misunderstanding and re-explains starting with "Let me
   explain that another way.", based on the documented passage.
4. Click **Try again**, choose **"Twice a day with breakfast and dinner"**, and click
   **Check my answer**. Show the confirmation. Mention that an unresolved answer can be saved for
   the clinician instead.

## Scene 4 — Act (2:40–3:30)

1. Click **Plan** in the navigation. If the plan is empty, click **Build my action plan**.
2. Under **My Care Plan**, each item is labeled clinician-documented. Click **View source** on the
   metformin item to highlight the exact passage in the original document.
3. Point out that anything that couldn't be matched to the document goes to **Needs
   clarification**, not into the care plan.
4. Under **Help with getting care**, show the transportation suggestion: "Would you like to ask
   your clinic whether transportation assistance or a telehealth appointment is available?" It is
   labeled AI-suggested and phrased as a question for the clinic, not an instruction.

## Scene 5 — Follow Up (3:30–4:15)

1. Click **Follow Up** in the navigation.
2. Show the summary for the care team: questions (including the one saved in Scene 2), reported
   barriers, unresolved items, and documented instructions with their sources.
3. Edit a line of the summary text, then click **Copy summary**. Nothing is transmitted.
4. Optional: click **Send to my care team (simulated)**, then **View the simulated care-team
   queue** to show the fictional clinician queue.

## Scene 6 — Evaluation (4:15–5:00)

1. Open **Evaluation** from the navigation (`/evaluation`).
2. Read the disclaimer aloud: "Automated synthetic-case tests. Not clinical validation. No real
   users. Does not establish real-world health outcomes." Point out that human-reviewed results
   and genuine user testing are listed as "None yet".
3. Show the run details (run ID, suite version, timestamp, mode, model, kind) and the four suite
   cards: instruction extraction (with the confusion matrix), citation validity, safety, and
   comprehension.
4. In **Individual results**, filter **Suite** to Safety to show the per-case outcomes.
5. Quote only the numbers on screen. They come from the latest `npm run eval` run and are never
   hardcoded.

## Close (5:00)

Repeat the tagline: *Aftercare Loop doesn't just answer health questions. It helps patients
understand, verify, and follow through on documented care instructions.*

## If something goes wrong

- Kat says the scripted demo can't answer: use the exact sample question above, or a suggestion chip.
- The Evaluation page says "Not evaluated": run `npm run eval` and reload the page.
- The state looks stale: click **Reset Demo** and re-select Maya Thompson.
