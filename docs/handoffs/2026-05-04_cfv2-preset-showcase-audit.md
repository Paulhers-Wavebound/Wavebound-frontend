# CFv2 preset showcase audit — 2026-05-04

Weekly check that the Create-tab preset cards still pull live hero imagery from the latest cartoon / fan_brief / link_video generation.

## Results

- ✅ **1. Hook structure** — All three queries present and correctly shaped. `cartoon_image_assets` joins `cartoon_scripts!inner(label_id, artist_name)`, filters `segment_index=0`, `status=complete`, `storage_url not null`, orders by `created_at desc`. `fan_briefs` selects `rendered_clip_url, artist_handle`, filters by `label_id` + `rendered_clip_url not null`. `cf_jobs` selects `final_url, artist_handle`, filters by `label_id`, `status=done`, `final_url not null`. Minor note: `cf_jobs` orders by `updated_at` (not `created_at`) — intentional for jobs. Both `cartoon_image_assets` and `cf_jobs` use `as never` casts, confirming they are not yet in the generated Supabase types.
- ✅ **2. CreateView wiring** — `useLatestPresetAssets` imported at line 15, called at line 186. `presetShowcase` referenced at line 599, `hasHero` computed at line 600 and used throughout the card render path.
- ❌ **3. Schema sanity (REST 200 on all 3 tables)** — All three endpoints returned HTTP 403 with body `Host not in allowlist`. This is a Supabase project-level security setting blocking curl requests from this machine's IP, not a schema regression. Column existence cannot be confirmed via REST from this environment. No 400 (bad column) response was observed.
- ✅ **4. tsc clean** — `npx tsc --noEmit` exited 0 with no errors.
- ✅ **5. Card markup (9/16 + video poster)** — `aspectRatio: "9 / 16"` found at line 619; `<video` element found at line 644. Both present.
- ❌ **6. Suspect commits** — Check 3 failed (infrastructure limitation, not a code regression). Recent commits on audited files within the past week:
  - `8014c54 chore: add sound merge health checks`
  - `2ba60ff feat(content-factory-v2): Higgsfield aesthetic redesign + Lead Hunter persistence`
  - `5e1e451 feat(content-factory-v2): realfootage label + failure-status propagation`
    Commit `2ba60ff` (Higgsfield redesign) is the most recent to touch CreateView directly and is the prime suspect if the schema check later reveals a regression.

## Notes

- **Host allowlist is a recurring audit blocker.** The Supabase project restricts which hosts can call the REST API with the anon key. This check will always fail from a non-allowlisted CI/dev machine. To make this check automatable, either add the CI machine's IP to the project allowlist, or switch to querying `information_schema.columns` via a service-role edge function that can be called from any host. Until then, schema sanity must be verified manually from an allowlisted machine (the app's own origin or a listed dev IP).
- **`cartoon_image_assets` and `cf_jobs` are not in the generated Supabase types** (evidenced by `as never` casts). If either table is renamed or dropped, TypeScript will not catch it — the `as never` suppresses the type error. These tables should be added to the type generation pipeline or the casts removed once types are regenerated.
- Everything else is green. The hook structure matches the spec, the view wiring is solid, tsc is clean, and card markup is correct.
