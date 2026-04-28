# 2026-04-28 — Cartoon Lead Hunter Story Gate

## Context

The backend Lead Hunter agent is live: async jobs, gpt-5.5, Tavily web search
with a real 10-call cap, and Cohere rerank on the dossier tools. The frontend
Story preset still generated directly from artist selection, which meant the
writer chose the story angle right before an expensive render.

## What changed

- Added typed Lead Hunter frontend contracts in
  `src/types/cartoonLeadHunter.ts`.
- Added `src/services/cartoonLeadHunterService.ts` for authenticated create/poll
  calls to the two Lead Hunter edge functions.
- Added a Lead Hunter panel inside `CartoonPanel.tsx`:
  - artist must be selected first
  - run/poll Lead Hunter
  - display progress counters
  - render selectable story leads
  - lock Generate until a lead is selected
- Threaded the selected lead through `ContentFactoryV2.tsx` so the
  `cartoon_writer` prompt uses the chosen story and explicitly does not pick a
  different angle.
- Persisted `cartoonSelectedLead` and `cartoonLeadHunterJobId` in cartoon
  localStorage snapshots so writer retries preserve the selected story.
- Updated feature docs for the Story preset and added a dedicated Lead Hunter
  story-gate doc.

## Product decision

Story rendering is no longer "choose artist → spend render." It is now "choose
artist → choose a researched lead → spend render." That matches the economics:
Lead Hunter is cheap enough to explore, while generated video is expensive
enough to require human narrative control.

## Follow-ups

- Inspect the panel visually in-browser once the app is running, especially with
  a 10-12 lead result inside the modal height.
- Consider a future "lead board drawer" if the inline board feels too dense for
  smaller screens.
