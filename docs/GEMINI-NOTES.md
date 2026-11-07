# Gemini API notes (verified 2026-11-07 with the team key)

- Key lives in `aftercare-loop-app/.env.local` as `GEMINI_API_KEY` (never commit; never log). Models endpoint returned HTTP 200.
- Available models (from `GET /v1beta/models`): `gemini-3.8-flash`, `gemini-4-argon`, `gemini-3.8-flash-tts`, `gemini-3.8-flash-lite-tts`, `gemini-2.5-flash-preview-tts`, …
- **Text / JSON generation:** use `@google/genai` v3 `client.interactions.create({ model, system_instruction, input, response_format: { type: "text", mime_type: "application/json", schema: <JSON Schema> } })` → `interaction.output_text`; validate with zod (`z.fromJSONSchema` or a hand-written zod schema). `generation_config: { max_output_tokens, thinking_level }`. Gemini 3.6+/4 ignore temperature/top_p/top_k. Constraints like minLength are stripped from schemas — validate client-side. Fall back to REST `POST https://generativelanguage.googleapis.com/v1beta/interactions` with headers `x-goog-api-key` and `Api-Revision: 2026-05-20` if the SDK path misbehaves.
- **TTS (verified):** the SDK's `interactions.create` returned 404 for `gemini-3.8-flash-tts`, and legacy `generateContent` + `speechConfig` returned 400. What works: REST
  ```
  POST https://generativelanguage.googleapis.com/v1beta/interactions
  x-goog-api-key: $GEMINI_API_KEY   Api-Revision: 2026-05-20   Content-Type: application/json
  {"model":"gemini-3.8-flash-tts",
   "input":[{"type":"user_input","content":[{"type":"text","text":"…","annotations":[{"type":"speech_metadata","style":"warm, clear, unhurried"}]}]}],
   "response_format":{"type":"audio"},
   "generation_config":{"speech_config":[{"voice":"Sulafat"}]}}
  ```
  Response: `steps[0].content[0]` = `{type:"audio", mime_type:"audio/wav", data:<base64 RIFF WAV 24 kHz mono 16-bit>}`. Write the decoded bytes straight to `.wav`. Warm voices: Sulafat, Achird, Vindemiatrix, Achernar.
- Media pipeline lives in `aftercare-loop-media/` (own package.json, `type: module`, `@google/genai`, `@playwright/test`; ffmpeg 9 at /opt/homebrew/bin/ffmpeg).
