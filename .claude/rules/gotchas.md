# Known Issues & Gotchas — Wavebound Frontend

## Active Bugs (fix when touching related code)
- Song timestamp heatmap: tooltip % calculation treats normalized 0-100 as actual percentages
- Top video links in format drilldown: use `video_url` field, don't construct from handle
- Double @@ on creator handles: API includes @ prefix, display code adds another → strip before display
- "Share Rate" labels: should say "Engagement Rate" (backend uses like_count/play_count)
- Verdict algorithm: everything shows "SCALE" — needs engagement × recency logic
- Song duration hardcoded to 120s: should come from API `song_duration_seconds` field

## Lovable Migration Leftovers
- Check for any Lovable-specific deployment configs (lovable.toml, .lovable/)
- Remove any dead B2C routes that don't apply to label dashboard
- Strip unused context providers from the provider tree
- Check for hardcoded Lovable URLs or deployment references

## Supabase Gotchas
- `artist_intelligence` requires service_role key — anon key returns empty arrays (RLS)
- PostgREST returns empty array (not error) when RLS blocks access — always check array length
- Edge Function execution limit: 60-150s — anything longer must use trigger + poll pattern
- Never bypass RLS in client code — only in Edge Functions with service_role

## React Query Patterns
- All Supabase queries should go through React Query for caching/deduplication
- staleTime: 5 minutes for dashboard data, 0 for real-time polling
- Use queryKey conventions: `['sound-analysis', jobId]`, `['sound-analyses', labelId]`
- Error boundaries around data-dependent sections

## Test Data
- Aperture: `https://www.tiktok.com/music/Aperture-7598271658722576401`
- As It Was (seeded): `https://www.tiktok.com/music/As-It-Was-7086491292068498437`
- Columbia label_id: `8cd63eb7-7837-4530-9291-482ea25ef365`
