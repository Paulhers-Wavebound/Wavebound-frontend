# CFv2 preset showcase audit — 2026-05-11

Weekly check that the Create-tab preset cards still pull live hero imagery from the latest cartoon / fan_brief / link_video generation.

## Results

- ✅ **1. Hook structure** — All three queries present and correctly shaped. `cartoon_image_assets` joins `cartoon_scripts!inner(label_id, artist_name)`, filters `segment_index=0`, `status=complete`, `storage_url not null`, orders `created_at desc`. `fan_briefs` filters `label_id` + `rendered_clip_url not null`. `cf_jobs` filters `label_id`, `status=done`, `final_url not null`, ordered by `updated_at desc` (reasonable for jobs). No structural issues.
- ✅ **2. CreateView wiring** — `useLatestPresetAssets` imported at line 15 and called at line 186. `presetShowcase` destructured at line 187; `hasHero` computed at line 600. Wiring is intact across the full card rendering loop.
- ❌ **3. Schema sanity (REST 200 on all 3 tables)** — All three requests returned HTTP 403 with body `Host not in allowlist`. The Supabase project has a network-level host allowlist configured that blocks requests from this machine before they reach PostgREST. No 400 was received (no evidence of a column rename), but a 200 confirmation is impossible from this host. **Inconclusive — not a regression signal, but not a green light either.** Must be re-run from an allowlisted host (e.g., a Supabase Edge Function or the dev machine) for full confidence.
- ✅ **4. tsc clean** — `npx tsc --noEmit` exited 0. No type errors.
- ✅ **5. Card markup (9/16 + video poster)** — `aspectRatio: "9 / 16"` present at line 619; `<video` element present at line 644. Portrait TikTok layout and autoloop video path both intact.
- ✅ **6. Suspect commits** — `git log --since="1 week ago"` returned no commits on either `useLatestPresetAssets.ts` or `CreateView.tsx`. No recent churn on these files.

## Notes

- **Check 3 host allowlist:** This is the second time this check has been inconclusive (same outcome as the 2026-05-04 audit). The allowlist restriction is working as intended for security, but it means this audit script can never confirm column existence from a CI/sandbox host. Consider adding a lightweight Supabase Edge Function that runs the three `limit=0` probes from inside the VPC and returns a simple pass/fail JSON — that would make future automated audits genuinely green-or-red rather than inconclusive.
- **`cf_jobs` ordered by `updated_at`:** The hook orders this query by `updated_at desc` rather than `created_at desc`. This is intentional (most-recently-completed job wins), but worth noting in case someone tries to "fix" it — the deviation from cartoon's `created_at` ordering is deliberate.
- **No regressions found** in the four checks that could be completed. The feature appears healthy.
