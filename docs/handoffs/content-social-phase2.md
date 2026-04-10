# Content & Social Dashboard — Phase 2

> Phase 1 (complete): Dashboard shell with real data from 6 Supabase tables, client-side briefing, priority cards, roster table, sound performance section.
>
> Phase 2 (this doc): Replace client-side heuristics with backend-backed intelligence, add AI-generated briefings, wire up missing data, and build the role-aware artist intelligence tab.
>
> **Note:** The Digital Marketing dashboard intentionally stays mock data. Only Content & Social gets the real data treatment.

---

## Phase 2A — AI-Generated Executive Briefing

**Current state:** `generateContentBriefing()` in `contentDashboardHelpers.ts` builds a narrative from structured data using template strings. It works, but reads like a report — not intelligence.

**Target state:** Pull from `intelligence_briefs` table (Opus-synthesized weekly briefs) with client-side fallback.

### Tasks

- [ ] **Query `intelligence_briefs`** for the current label's latest `brief_type = 'tier2'` or `'tier1'` brief
  - Table: `intelligence_briefs` — columns: `label_id`, `brief_type`, `brief_html`, `brief_json`, `generated_at`
  - Already has real data (weekly Opus synthesis)
  - Fall back to current client-side `generateContentBriefing()` if no brief exists yet
- [ ] **Update `ContentBriefingCard.tsx`** to render `brief_html` when available
  - Show "AI Briefing" badge + `generated_at` timestamp when using backend brief
  - Show "Auto-generated" badge when falling back to client-side
  - Keep "Chat about this" button — prefill with `brief_json` content
- [ ] **Add `useIntelligenceBrief` hook** — fetches latest brief for label, caches via React Query
  - queryKey: `['intelligence-brief', labelId, 'content']`
  - staleTime: 5 minutes
- [ ] **Role-filter the brief** — when role is "content", prefer content-focused modules from `modules_included` field in the brief JSON

### Backend dependency

- None — `intelligence_briefs` table is already being populated weekly by the synthesis pipeline. Verify with: `select brief_type, generated_at from intelligence_briefs where label_id = '8cd63eb7-7837-4530-9291-482ea25ef365' order by generated_at desc limit 5;`

---

## Phase 2B — Replace Client-Side Heuristics with dbt-Backed Data

Several metrics in the Content & Social dashboard are derived client-side from raw fields. The dbt layer already computes these more accurately. Wire them up.

### Tasks

| Metric                       | Current source                                              | Should come from | Table/column                                |
| ---------------------------- | ----------------------------------------------------------- | ---------------- | ------------------------------------------- |
| Content health cadence label | Client heuristic from `days_since_last_post`                | dbt model        | `tiktok_video_summary.posting_cadence`      |
| Consistency score            | Not shown                                                   | dbt model        | `tiktok_video_summary.consistency_score`    |
| Performance trend            | `artist_content_evolution.performance_trend` (already used) | Already correct  | --                                          |
| Format shift detection       | Boolean flag `format_shift`                                 | Already correct  | `artist_content_evolution.format_shift`     |
| Engagement trend             | Client delta calc                                           | dbt model        | `tiktok_video_summary.engagement_trend_pct` |
| Plays trend                  | Client delta calc                                           | dbt model        | `tiktok_video_summary.plays_trend_pct`      |

- [ ] **Update `useContentDashboardData.ts`** Phase 3 query to include `posting_cadence`, `consistency_score`, `plays_trend_pct`, `engagement_trend_pct` from `tiktok_video_summary`
- [ ] **Update `ContentRosterTable.tsx` Content Health Pill** to use `posting_cadence` from dbt instead of client-side derivation from `days_since_last_post`
  - Map dbt values: daily/regular/sporadic/inactive/dormant to existing pill colors
  - Keep client fallback if `posting_cadence` is null
- [ ] **Show consistency score** as a secondary indicator in the Content Health pill (e.g., small "87%" badge)
- [ ] **Use `plays_trend_pct` and `engagement_trend_pct`** from dbt instead of client-computed deltas in the Performance column

### Backend dependency

- Verify columns exist: `select posting_cadence, consistency_score, plays_trend_pct, engagement_trend_pct from tiktok_video_summary limit 5;`
- These are dbt nightly rebuild outputs — should already be populated for 9.5K+ artists.

---

## Phase 2C — Wire Up Missing Data Sources

### Tasks

- [ ] **Implement UGC_SURGE priority type** in `buildPriorityItems()`
  - Currently: defined in `ContentPriorityCards.tsx` TYPE_STYLE but never generated
  - Trigger: `catalog_tiktok_performance` rows where `videos_last_7d > 0` and `fan_to_artist_ratio > 3` and `tiktok_status IN ('viral', 'trending')`
  - Stats: Fan videos count, unique creators, total plays
  - Priority order: stays last (drought > drop > spike > shift > ugc)

- [ ] **Add comment sentiment to roster table**
  - Table: `wb_comment_sentiment` — columns: `entity_id`, `sentiment_score` (0-100), `fan_energy` (0-100), `themes`
  - Show as small sentiment dot (green/yellow/red) or tooltip in the Artist column
  - Only if data exists for that entity — graceful null handling

- [ ] **Add `artist_intel_chunks` integration** for priority cards
  - Table: `artist_intel_chunks` — columns: `entity_id`, `chunk_type`, `title`, `body`, `actionable`, `action_type`, `action_suggestion`
  - Filter for `actionable = true` and `chunk_type IN ('release', 'show', 'competitive', 'trend')`
  - Surface as a new priority type: "INTEL" — e.g., "Tyla — upcoming show in Mumbai, content hook opportunity"
  - Only show if `is_active = true` and `expires_at > now()`

- [ ] **Fix refresh mechanism** — `useContentDashboardData.ts` calls `supabase.rpc("refresh_roster_metrics")` which doesn't exist
  - Option A: Remove the RPC call, just re-fetch queries (the data is updated nightly by dbt anyway)
  - Option B: Create the RPC in backend as a thin wrapper that triggers the dbt rebuild
  - **Recommend Option A** for now — nightly refresh is sufficient, remove false promise of real-time refresh

---

## Phase 2D — Role-Aware Artist Intelligence Tab

**Current state:** `IntelligenceTab.tsx` and the briefing view (`ArtistIntelligence.tsx`) show the same content regardless of role. The role context now exists app-wide (Phase 1 of this session).

### Tasks

- [ ] **Read `useDashboardRole()` in `ArtistIntelligence.tsx`** and conditionally render:
  - **Marketing role:** Current briefing view (BriefingHero, SignalMap, OpportunityEngine, CompetitiveLens, Outlook) — focused on market opportunities, spend, geographic expansion
  - **Content role:** New content-focused view — focused on posting health, format analysis, content DNA, fan sentiment, engagement trends

- [ ] **Build `ContentIntelligenceView` component** for the content role
  - Section 1: **Content Health Card** — posting cadence, consistency score, days since last post, engagement trend (from `tiktok_video_summary` + `roster_dashboard_metrics`)
  - Section 2: **Format DNA** — best/worst format, signature style, hook score, viral score, format distribution chart (from `artist_content_dna`)
  - Section 3: **Content Evolution** — strategy label, format shift, mood shift, new/dropped formats, performance trend, views change % (from `artist_content_evolution`)
  - Section 4: **Recent Anomalies** — latest content anomalies for this artist (from `content_anomalies` filtered by `artist_handle`)
  - Section 5: **Sound Performance** — songs being used on TikTok, fan vs artist videos, cross-platform gap (from `catalog_tiktok_performance` filtered by entity)
  - Section 6: **Fan Sentiment** — sentiment score, fan energy, themes (from `wb_comment_sentiment`)

- [ ] **Add view toggle** on the intelligence page: "Marketing Intelligence" / "Content Intelligence" (bound to dashboard role, but also manually overridable per-page)

- [ ] **Wire data hook** — `useContentIntelligence(entityId)` that fetches the 6 data sources above in parallel

---

## Phase 2E — Data Integrity Audit

Before shipping Phase 2, verify every data path is backed by real production data.

### Checklist

- [ ] `roster_dashboard_metrics` — populated for all label artists? Check: `select count(*) from roster_dashboard_metrics where label_id = '8cd63eb7-7837-4530-9291-482ea25ef365';`
- [ ] `content_anomalies` — recent anomalies flowing? Check: `select scan_date, count(*) from content_anomalies where label_id = '8cd63eb7-7837-4530-9291-482ea25ef365' group by scan_date order by scan_date desc limit 7;`
- [ ] `artist_content_dna` — all roster artists have DNA? Check: `select count(*) from artist_content_dna where artist_handle in (select artist_handle from roster_dashboard_metrics where label_id = '8cd63eb7-7837-4530-9291-482ea25ef365');`
- [ ] `artist_content_evolution` — matches DNA coverage? Same check pattern.
- [ ] `tiktok_video_summary` — entity_ids linked? Check: `select count(*) from tiktok_video_summary where entity_id in (select entity_id from artist_content_dna where artist_handle in (...));`
- [ ] `catalog_tiktok_performance` — songs linked to roster artists? Check count.
- [ ] `intelligence_briefs` — briefs exist for label? Check count + latest `generated_at`.
- [ ] `wb_comment_sentiment` — sentiment data exists for roster artists? Check count.
- [ ] `artist_intel_chunks` — actionable chunks exist? Check: `select count(*) from artist_intel_chunks where is_active = true and actionable = true;`

For any table returning 0 rows: **don't build UI that depends on it** — add graceful empty state and flag for backend pipeline work.

---

## Execution Order

1. **2E first** — run the data audit before building anything. No point building UI for empty tables.
2. **2B** — swap client heuristics for dbt data (smallest scope, biggest data quality win)
3. **2A** — AI briefing (high-impact, low-risk with fallback)
4. **2C** — missing data sources (UGC surge, sentiment, intel chunks)
5. **2D** — role-aware intelligence tab (largest scope, depends on 2B and 2C data being available)

---

## Files That Will Change

| File                                                            | Change                                           |
| --------------------------------------------------------------- | ------------------------------------------------ |
| `src/hooks/useContentDashboardData.ts`                          | Add tiktok_video_summary fields, fix refresh RPC |
| `src/data/contentDashboardHelpers.ts`                           | Add UGC_SURGE builder, update cadence derivation |
| `src/components/label/content-social/ContentBriefingCard.tsx`   | Render AI brief HTML, add badge                  |
| `src/components/label/content-social/ContentRosterTable.tsx`    | Use dbt cadence, add sentiment dot               |
| `src/components/label/content-social/ContentPriorityCards.tsx`  | New INTEL priority type                          |
| `src/hooks/useIntelligenceBrief.ts`                             | NEW — fetch latest brief                         |
| `src/hooks/useContentIntelligence.ts`                           | NEW — artist-level content data                  |
| `src/components/label/intelligence/ContentIntelligenceView.tsx` | NEW — content role artist view                   |
| `src/pages/label/ArtistIntelligence.tsx`                        | Role-conditional rendering                       |

## Backend TODO (for backend session)

- [ ] Verify `intelligence_briefs` has content-specific module flags
- [ ] Consider adding `brief_role` column to `intelligence_briefs` to generate role-specific briefs
- [ ] Ensure `wb_comment_sentiment` pipeline runs for all roster artists (not just sampled)
- [ ] Verify `artist_intel_chunks` are being parsed from weekly research for all labels
