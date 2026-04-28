# Cartoon Lead Hunter Story Gate

## What it does

Adds a human-controlled story-selection step to Content Factory v2's Story
preset before any expensive cartoon or real-edit render starts.

## Who uses it and why

Label content and social teams use it when they want the AI to research story
angles, but still want a human to choose the narrative before the pipeline spends
money on script generation, voice, images or footage, and video composition.

## Correct behavior

- The Story preset asks for an artist first.
- Once an artist is selected, "Find leads" starts an async Lead Hunter job via
  `cartoon-lead-hunter-create`.
- The panel polls `cartoon-lead-hunter-get` until the job is complete or failed.
- While running, the panel shows phase, elapsed time, leads found, dossier calls,
  and web-search calls against the 10-call cap.
- On completion, the panel renders a lead board with working title, top-pick
  badge, tension source, overall-promise score, source/check counts, and risk
  note when relevant.
- One lead is selected before Generate is enabled. The top recommended lead is
  preselected when the result arrives, but the user can pick another.
- Generate sends the selected lead to the existing `cartoon_writer` role
  inside an `<operator_selected_lead>` JSON block. The lead is treated as
  **creative direction, not locked legal copy**: the writer must verify
  specifics before quoting them, soften shaky details (numbers in conflict,
  unverifiable quotes, fan-signal-only facts) rather than pivoting to a new
  angle, and only abandon the lead if the core claim is clearly unsupported.
  The contract is mirrored in the backend `cartoon_writer` prompt's
  OPERATOR-SELECTED LEAD MODE section.
- Queue placeholders persist `cartoonSelectedLead` and `cartoonLeadHunterJobId`
  so localStorage rehydrate and writer-phase retry keep the same chosen story.
- Render-only retries still reuse the existing `chat_job_id`; writer retries use
  the stored selected lead.

## Edge cases

- **No label session** — the panel shows the existing logged-in-session notice.
- **No artist selected** — Lead Hunter and Generate are disabled.
- **Lead Hunter pending/running** — Generate stays disabled until results land.
- **Lead Hunter failure** — an inline error appears; the user can run the hunt
  again without changing artist.
- **Thin research result** — the board can show fewer than twelve leads; Generate
  still works as long as one lead exists and is selected.
- **Page refresh during render** — selected lead metadata survives in the cartoon
  localStorage snapshot for in-flight queue cards created from the lead board.
