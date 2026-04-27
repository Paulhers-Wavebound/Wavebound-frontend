# CFv2 preset showcase audit — 2026-04-27

Weekly check that the Create-tab preset cards still pull live hero imagery from the latest cartoon / fan_brief / link_video generation.

## Results

- ❌ **1. Hook structure** — `src/hooks/useLatestPresetAssets.ts` does not exist. The hook was never created.
- ❌ **2. CreateView wiring** — `useLatestPresetAssets`, `presetShowcase`, and `hasHero` are all absent from `src/components/content-factory-v2/CreateView.tsx`. No live asset queries are wired into the Create tab at all.
- ❌ **3. Schema sanity (REST 200 on all 3 tables)** — All three tables returned HTTP 403 ("Host not in allowlist") from the CLI environment. This is a Supabase API gateway IP/host allowlist restriction blocking non-browser requests — not a column-rename regression. Column existence cannot be confirmed or denied via this method from the dev machine. Inconclusive on schema; flagged as ❌ because the check could not be completed.
- ✅ **4. tsc clean** — Exit 0, no type errors.
- ❌ **5. Card markup (9/16 + video poster)** — Neither `aspectRatio: "9 / 16"` nor `<video` appears in CreateView.tsx. Preset cards use `aspectRatio: "1 / 1"` (square icon grid). No video poster path exists anywhere in the file.
- ❌ **6. Suspect commits** — Checks 1, 2, and 5 all failed. Nine commits touched these files in the past week. Most likely regression commit: `8c1e0b9 feat(content-factory-v2): Higgsfield-style redesign + reliability bundle` — this is the commit most likely to have replaced a portrait hero-card layout with the current 1:1 grid. Second suspect: `3c30ec9 feat(content-factory-v2): wizard CTA becomes one-click Create → Review` (around the time the fan-brief wizard replaced the card body). Full list:

  ```
  12d039a fix(content-factory): show Tune button for cartoon + link_video presets
  5d71c3f feat(content-factory): per-format AI script model picker
  a52ccfb feat(content-factory-v2): motion polish, smooth dropdown, retry on failed assets
  8c1e0b9 feat(content-factory-v2): Higgsfield-style redesign + reliability bundle
  1641865 feat(content-factory-v2): wizard CTA becomes one-click Create → Review
  3c30ec9 feat(content-factory-v2): wizard polish — url persistence, auto-expand, hook extract
  45a6431 feat(content-factory-v2): wizard for fan-brief preset (artist + source + count)
  1008933 feat(content-factory-v2): inline BriefCard + write path for fan briefs
  49f1c65 feat(content-factory-v2): 3-tab prototype at /label/content-factory-v2
  ```

## Notes

**The preset showcase / hero imagery feature was never built, or was removed.** The current CreateView renders a 1:1 square icon grid ("Pick a preset") with no connection to live generation output. The `useLatestPresetAssets` hook referenced in this audit spec does not exist anywhere in the codebase — not in `src/hooks/`, not inline in the component, not under any other name.

The Higgsfield-style redesign (`8c1e0b9`) replaced whatever portrait-card layout may have existed. The current preset cards are purely static UI: icon tile top-left, label/description bottom-left, "New"/"Soon" badge top-right, no asset query, no video, no fallback.

**REST 403 note:** "Host not in allowlist" is a Supabase API gateway restriction on the machine's IP/host, not a PostgREST column error. A 400 from PostgREST would indicate a missing column; a 403 at the gateway level means the request never reached the schema. The columns may still exist — this check needs to be run from a browser session or a whitelisted server to be conclusive. Recommend running from the app's deployed origin or via the Supabase dashboard SQL editor to verify `rendered_clip_url` and `final_url` still exist.

**To implement the feature from scratch:** create `src/hooks/useLatestPresetAssets.ts` with three React Query calls (one per table), wire it into CreateView, and replace the `aspectRatio: "1 / 1"` preset cards with `aspectRatio: "9 / 16"` portrait cards that use the asset URL as a full-bleed background. If no asset exists for a preset, fall back to the current icon-only layout.
