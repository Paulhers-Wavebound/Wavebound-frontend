# Fan Account Briefs — Sprint 1 Schema

**Date:** 2026-03-30

## What changed
- Created migration file: `migrations/fan-briefs-schema.sql`
- Executed against production Supabase DB (kxvgbowrkmowuyezoeke)

### New tables
1. **content_catalog** — long-form source material (YouTube interviews, podcasts). No vectors. Dedup via `source_url` UNIQUE + composite `(source_platform, video_id)` partial unique index.
2. **content_segments** — key moments with 768-dim vectors + tsvector FTS. HNSW index for cosine similarity. Core RAG table for brief generation.
3. **fan_briefs** — AI-generated brief output with status workflow (pending → approved → posted). Dedup index on `(artist_handle, source_url, timestamp_start, created_at)`.

### RLS policies (15 total)
- Each table: 4 granular policies for authenticated (select/insert/update/delete scoped to `label_id` via `user_profiles`) + 1 service_role full access.
- Anon role gets zero access (verified).

### RPC function
- `segment_hybrid_search()` — RRF fusion of BM25 full-text + cosine vector similarity. Uses `search_path = 'public'` (not empty string) because the `<=>` vector operator lives in the public schema.

### Storage bucket
- `fan-briefs` bucket created (private, 50MB limit, video/audio/image MIME types).
- Storage RLS: authenticated can read, service_role can write/update/delete.

### Indexes (18 total)
- content_catalog: 5 (artist, label, platform, unprocessed partial, video composite partial)
- content_segments: 7 (artist, label, catalog, score DESC, type, GIN fts, HNSW embedding)
- fan_briefs: 6 (artist, label, status, created DESC, score DESC, dedup composite)

## Why
Sprint 1 of Fan Account Briefs feature per `docs/Fan_Account_Briefs_Spec.md` section 4.

## What was tested
- All 3 tables exist: verified via `information_schema.tables`
- RLS enabled on all 3: verified via `pg_tables.rowsecurity`
- 15 RLS policies created: verified via `pg_policies`
- Anon blocked: `SET role anon; SELECT count(*)` returns 0 on all tables
- `segment_hybrid_search()` exists and returns empty result set with zero-vector input
- `fan-briefs` storage bucket exists (private)
- All 18 indexes confirmed via `pg_indexes`

## What to verify in browser
- Nothing — this is backend-only schema work.

## While I was in here
1. **`SUPABASE_DB_URL` env var is not set** — only `SUPABASE_DB_PASSWORD` exists. Consider adding `export SUPABASE_DB_URL="postgresql://postgres:<pw>@db.kxvgbowrkmowuyezoeke.supabase.co:5432/postgres"` to `~/.zshrc` to simplify future DB work.
2. **Vector extension is v0.8.0** — latest is 0.8.x+. Check if Supabase has auto-updated or if a manual bump is needed for newer HNSW features.
3. **Sprint 2 next**: content_catalog ingestion pipeline (ScrapeCreators YouTube discovery → transcript fetch → insert). The tables are ready.
4. **Supabase types regeneration needed**: Run `supabase gen types typescript` to pick up the 3 new tables in `src/integrations/supabase/types.ts` before building the frontend page.
5. **The existing `artist_hybrid_search` function** likely also uses `search_path = ''` which may cause issues with vector ops — worth auditing for the same `<=>` operator bug.
