# Session Diary — 2026-04-11: Anti-Hallucination + Evidence Grounding

## What changed

### 1. AI Edge Function Prompt (`edge-functions/generate-artist-focus.ts`)
- Added **ANTI-HALLUCINATION RULES** section to the system prompt with 5 rules:
  1. NEVER claim what you can't see (banned phrases: "despite no label push", "without promotion", "organically trending" unless fan_to_artist_ratio >= 3x)
  2. NEVER prescribe specific creative actions without data support (no "release sped-up version", "seed with nano-creators", "double ad spend")
  3. EVERY claim must cite a specific number from the data
  4. When data is thin, say so — "Limited sound data" > fabricated certainty
  5. Action field should frame the DECISION, not prescribe the solution
- Framed rules as "violating these gets you fired" — brief goes to senior execs who will spot bullshit
- Removed hardcoded "release a Sped Up or remix" from catalog nostalgia loop framework item
- Removed "NOT being pushed by the label" language (we have no visibility into label push activity)
- Deployed and batch re-run completed for all 13 Columbia artists

### 2. Client-Side Template Strings (`src/data/contentDashboardHelpers.ts`)
Six template-based decision point strings rewritten to be evidence-grounded:

| Decision Type | Before | After |
|---|---|---|
| MOMENTUM_CAPTURE | "Double ad spend on X. Batch 5+ new assets by end of day." | "X content outperforming at Nx median — evaluate scaling this format." |
| BUDGET_REALLOCATION | "Study the hook and replicate. Reallocate boost budget." | "Breakout video detected — review the hook and format. Algorithm currently favoring." |
| FORMAT_PIVOT | "Pivot to X. Stop producing Y content." | "X at Nx median while Y underperforming — review format mix." |
| CATALOG_ACTIVATION | "Consider nostalgia activation: seed with nano-creators, explore Sped Up or remix." | "Catalog track showing UGC momentum — evaluate whether to allocate content resources." |
| CONTENT_PIPELINE | "Generate a 7-day content plan and schedule check-in today." | "No content plan on file and N days inactive — needs attention." |
| CONVERSION_ALERT | "Shift from reach-optimized to conversion-optimized hooks. Stop boosting high-view/low-save." | "N avg views but X% save rate — content reaching audience but not converting. Review hook strategy." |

### 3. Bb Trickz Data Fixes (from earlier in session)
- Fixed wrong TikTok handle: `belize.kazi` (fan account) → `imsorrymissjacksonuhh`
- Updated across all 5 tables, deleted 90 fan-account videos
- Added missing `user_artist_links` row for RLS access
- Updated `latest_release`: "supersexi" (Oct 2025) → "lechita" EP (Jan 23, 2026)

## Why
Paul spotted the AI generating "despite no current label push" about Earrings — a track that's #3 on TikTok Top 50 charts. The AI had zero evidence about label push status. Same issue with prescribing specific creative actions ("release sped-up version") without data backing. Senior execs at Columbia would immediately flag this as noise.

## What was tested
- `npx tsc --noEmit` — clean
- Edge function deployed and batch re-run completed for all 13 artists
- Spot-checked new AI output: Malcolm Todd's Earrings now says "17K new UGC videos this week with 'new' velocity classification" (grounded) instead of "despite no label push" (hallucination)
- Verified no AI output contains banned phrases

## What to verify in browser
- Refresh Content & Social dashboard — Signal Report decision points should show evidence-grounded language
- Check Bb Trickz row — should show corrected handle, "lechita" as latest release, and 0 videos (pending scraper re-run)
- Compare before/after tone of recommendations — should feel like "here's what the data shows" not "do this now"

## Files modified
- `edge-functions/generate-artist-focus.ts` — anti-hallucination prompt rules
- `src/data/contentDashboardHelpers.ts` — 6 template string rewrites
- `docs/handoffs/backend-todo.md` — added Bb Trickz handle fix item
- `docs/session-diaries/2026-04-11_anti-hallucination.md` — this file
