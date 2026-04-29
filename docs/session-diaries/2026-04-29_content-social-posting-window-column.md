# Posting Window column — Content & Social roster

## What changed

**Frontend (Content & Social roster table)**

- `src/data/contentDashboardHelpers.ts`
  - Added `latest_release_date`, `days_since_release`, `next_release_date` to `ContentArtist`.
  - Added `"posting_window"` to `ContentSortKey`.
  - New helper `getPostingWindowStatus(artist) → { inWindow, reason, days }` and a sort scorer `scorePostingWindow`.
  - `latest_release_date` future dates now count as upcoming when they are 1-14 days out, and negative `days_since_release` values are ignored so future releases never render as "Released -Xd ago".
  - New sort case for `"posting_window"`.
- `src/hooks/useContentDashboardData.ts`
  - Lifted `latest_release_date` and `days_since_release` from `roster_dashboard_metrics` (already arriving via `select("*")`, just typed now).
  - Lifted `weekly_pulse.next_release_date` onto each row.
  - Typed the raw data maps for this hook and removed the handoff's new `any` cast around `weekly_pulse.next_release_date`.
- `src/components/label/briefing/AIFocus.tsx`
  - Extended `WeeklyPulse` with `next_release_date?: string | null`.
  - Removed a conditional `useMemo` pattern so the component no longer violates React's rules of hooks lint.
- `src/components/label/content-social/ContentRosterTable.tsx`
  - New `PostingWindowCell` component (4 states: DROP IN Xd / FRESH RELEASE / QUIET-with-data / QUIET-no-data).
  - New "Posting Window" column inserted between Artist and Consistency, visible at all breakpoints.
  - Sortable via the new `"posting_window"` sort key.
  - Expanded row colSpan updated from 5 to 6 so expanded content spans the full table after the new column.
- `docs/features/content-social-dashboard.md`
  - Updated feature documentation with Posting Window behavior, sorting, edge cases, and data sources.

**Backend (brief writer)**

- `edge-functions/generate-artist-focus.ts`
  - Extended `ArtistFocusResult` schema with `next_release_date?: string | null`.
  - Added a "NEXT RELEASE DETECTION" section to the system prompt with strict rules: only set the field when there is a specific, public, announced date (TikTok caption, web search result, or `latest_release` data). Vague language and speculation are explicitly disallowed.
  - Updated the JSON output instruction to include `next_release_date` in the schema.
- Deployed: `generate-artist-focus` v26 (2026-04-29 17:22 UTC). Verified in `supabase functions list`.

## Why

Content & Social leads need to know at a glance which artists they should be pushing _right now_. The product rule:

> An artist is in their **posting window** if either
> (a) they've released a song in the last 30 days, or
> (b) they have an upcoming release within the next 14 days.

Recent-release data was already pre-computed in `roster_dashboard_metrics` (`days_since_release`). Upcoming-release data didn't exist anywhere structured — Spotify catalog only contains already-released tracks (0 future-dated rows in the DB), and `bio_profiles.presave_release_date` is empty. Per Paul's instruction, the per-artist AI brief writer (`generate-artist-focus`) is now the source of truth for upcoming-release dates, since it already reads TikTok captions and has web search.

## What was tested

- `npx tsc --noEmit` — clean after every change.
- Targeted lint on touched implementation files — clean:
  `npx eslint src/data/contentDashboardHelpers.ts src/components/label/content-social/ContentRosterTable.tsx src/hooks/useContentDashboardData.ts src/components/label/briefing/AIFocus.tsx edge-functions/generate-artist-focus.ts`
- Full `npm run lint` was attempted and is still blocked by pre-existing repo-wide lint debt (993 errors, mostly old `any` / `var` issues outside this change).
- Edge Function deploy succeeded; version bumped to v26 in the Supabase functions list.
- Triggered one `generate-artist-focus` run for `malcolmtodddd` (Columbia, recent release on 2026-04-23). The brief returned `"next_release_date": "2026-06-05"` (his album "Do That Again" — found via web search, not pre-loaded data). Verified the value is persisted on `artist_intelligence.weekly_pulse`. End-to-end pipeline confirmed working.

## What to verify in browser

1. Switch to **Content & Social** role on `/label`.
2. New "Posting Window" column should appear between Artist and Consistency.
3. Any artist with `days_since_release <= 30` should show a green `FRESH RELEASE` pill plus "Released Xd ago".
4. Other artists show a muted `QUIET` pill with either "Last drop Xd ago" or "No release on file".
5. Click the Posting Window header — should sort in-window artists to the top (descending) or bottom (ascending), with tighter windows ranked first.
6. Once briefs regenerate over the next cycle, artists with announced upcoming drops should flip to a green `DROP IN Xd` pill — no further code changes needed.

## Edge cases handled

- `next_release_date` parses to an invalid date → falls through to recent-release rule (helper returns null on parse failure).
- `next_release_date` is in the past → ignored; falls through to recent-release rule.
- `latest_release_date` is future-dated and 1-14 days out → treated as upcoming, even before AI brief regeneration catches it.
- `days_since_release` is negative → ignored instead of showing misleading "Released -Xd ago" copy.
- `next_release_date` set AND `days_since_release <= 30` (artist released and announced another) → upcoming wins (more action-relevant for content planning).
- No `weekly_pulse` yet (new artist, no brief generated) → `next_release_date` is null, rule falls back to recent-release detection.

## Out of scope (intentional)

- Cards view (`viewMode === "cards"` branch in `ContentRosterTable.tsx`) was not modified — user asked for a column, kept the change focused on the rows view.
- No manual override UX for label reps to correct an AI-detected date. If reps start seeing wrong dates, the next iteration could add an inline editor on the artist profile page.

## While I was in here

1. The `roster_dashboard_metrics` view exposes `release_readiness_score` and `release_readiness_factors`, but they're not wired into the Content & Social dashboard. The Marketing dashboard uses them. Worth surfacing these on the artist profile sidebar in the Content & Social view too — they'd answer "given the artist is in window, are they actually ready to scale content?"
2. The brief writer's system prompt is large and dense (300+ lines). Now that `next_release_date` joins `focused_sound` and `catalogue_alert` as discrete output fields, it's worth restructuring the prompt around an explicit "fields" section rather than narrative prose. Improves model consistency and makes adding the next field cheaper.
3. Backend handoff still pending: `artist_videos_tiktok.video_url` backfill (from earlier today's session diary). Unrelated to this change but mentioning so it doesn't get lost.
