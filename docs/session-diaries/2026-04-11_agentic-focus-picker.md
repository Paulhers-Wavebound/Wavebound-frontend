# Session Diary — 2026-04-11: Agentic Focus Picker

## What changed

### 1. Edge function rewritten as agentic loop (`edge-functions/generate-artist-focus.ts`)
- **Model**: `claude-opus-4-6` with extended thinking (10K budget)
- **Tools added**:
  - `web_search` (Anthropic server tool) — verifies chart positions, new releases, public facts
  - `query_database` (client tool) — Supabase queries against 5 allowlisted tables
- **Agentic loop**: Max 3 tool rounds per artist. Opus thinks → uses tools → thinks again → final judgment.
- **System prompt**: Major upgrade with mandatory tool-use scenarios, banned phrases, anti-hallucination rules referencing tools
- **JSON parsing**: Robust extraction handles mixed text/JSON responses across multi-turn tool usage

### 2. Bb Trickz data fixes
- Wrong TikTok handle: `belize.kazi` (fan account) → `imsorrymissjacksonuhh`
- Updated 5 tables, deleted 90 fan-account videos, reset metrics
- Added missing `user_artist_links` row for RLS
- Updated `latest_release`: "supersexi" (Oct 2025) → "lechita" EP (Jan 23, 2026)

### 3. Anti-hallucination prompt + template string fixes
- AI prompt bans unverifiable claims ("despite no label push")
- Client-side template strings rewritten to surface data, not prescribe actions
- All 6 decision point templates updated

### 4. Model upgrade path
- Started session on `claude-sonnet-4-20250514` (wrong)
- → `claude-opus-4-20250514` (better)
- → `claude-opus-4-6` with extended thinking (correct per CLAUDE.md policy)
- → `claude-opus-4-6` with extended thinking + agentic tools (final)

## Why
Paul identified two critical problems:
1. AI hallucinating claims ("despite no label push" when it has zero visibility into label campaigns)
2. AI prescribing specific actions ("release sped-up version") without evidence

The agentic upgrade solves both — the AI can now VERIFY before claiming (web search for charts, DB queries for data) and surfaces decisions to execs rather than prescribing solutions.

## What was tested
- `npx tsc --noEmit` — clean
- **Malcolm Todd**: Opus used web_search, found Earrings at Billboard #65 and UK Singles #44. Cited specific numbers.
- **Bb Trickz**: Opus used query_database, found 287K UGC on "Soy la Más Mala de España". Used web_search, found upcoming Bilbao BBK festival.
- **The Chainsmokers**: Opus correctly identified Echo (Day 1 release), cited pre-release save rates vs baseline.
- **Full batch**: All 13 artists processed and stored. Batch HTTP timed out after ~7 artists; remaining 6 processed individually. All results persisted via per-artist DB storage.

## What to verify in browser
- Refresh Content & Social dashboard — Signal Report should show dramatically improved briefs
- Malcolm Todd's Earrings should reference Billboard/UK chart positions
- Bb Trickz should show actual sound recommendation instead of "no data"
- All decision points should cite specific numbers from data or web search

## Files modified
- `edge-functions/generate-artist-focus.ts` — full rewrite: agentic loop, tools, upgraded prompt
- `src/data/contentDashboardHelpers.ts` — 6 template string rewrites
- `docs/features/ai-focus-picker.md` — updated architecture docs
- `docs/handoffs/backend-todo.md` — added Bb Trickz handle fix + scraper audit
- `CLAUDE.md` — added AI Model Policy section
