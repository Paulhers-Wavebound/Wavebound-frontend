# Sound Performance on TikTok — missing songs fix

## Problem

The "Sound Performance on TikTok" table on the label dashboard overview
only showed 6 rows, even for labels where many more catalog songs exist.
Some of the rows that did appear had only 2–3 videos, which read as
thin/misleading.

## Root cause

Two stacked bugs in `src/hooks/useContentDashboardData.ts`:

1. **Wrong join key.** Catalog was filtered by `artist_entity_id` taken
   from `artist_content_dna`. That table is incomplete — on the label in
   the screenshot (id `1e84e01a-eaea-46cb-97fc-ad5653ca667f`), only 7 of
   13 roster artists have DNA entries, so catalog rows for Bella Kay
   ("iloveitiloveitiloveit", 22 videos, 15M plays) and Ravyn Lenae
   ("Love Me Not") were being silently dropped.
2. **Arbitrary caps.** The catalog query had `.limit(20)` and the
   component sliced `songs.slice(0, 10)`. Fine for small labels,
   crippling for majors — Columbia has 322 catalog rows that would have
   all been clipped.

## What changed

- `src/hooks/useContentDashboardData.ts` — catalog query moved into the
  Phase 2 parallel group and now joins on `artist_name` using the roster
  names (independent of content DNA). Removed `.limit(20)`, order is
  `total_tiktok_plays desc` so the merged `songUGC` list is already in
  the right order before the component re-sorts.
- `src/components/label/content-social/SoundPerformanceSection.tsx` —
  removed `songs.slice(0, 10)`, wrapped the card in
  `max-h-[720px] overflow-y-auto` with a sticky `<thead>` so long lists
  stay navigable, and added a count beside the section header.

## Verification

- `npx tsc --noEmit` clean.
- Queried `catalog_tiktok_performance` with the new filter:
  - Label `1e84e01a…`: 4 → 6 catalog rows (Bella Kay and Ravyn Lenae
    restored). Combined with 2 SI sounds → 8 rows in the UI vs. 6 before.
  - Columbia (`8cd63eb7…`): 20 (capped) → 322 catalog rows. Sticky
    header + scroll container handles the volume.

## What to verify in the browser

- Dashboard for the Alex Warren / Benson Boone label now shows Bella
  Kay's "iloveitiloveitiloveit" and Ravyn Lenae's "Love Me Not" in the
  Sound Performance table.
- Columbia dashboard shows >20 songs, scrolls smoothly, header stays
  pinned while scrolling.
- Section header shows a row count next to the title.

## Recommendations — while I was in here

1. **`artist_content_dna` coverage gap.** 6 of 13 roster artists on this
   label have no DNA rows. That silently breaks Content DNA badges,
   Evolution signals, Video Summary stats, and Sentiment scores for
   those artists in the roster table. Worth investigating whether the
   DNA pipeline is failing for those handles or just hasn't run.
2. **Duplicate song rows.** `catalog_tiktok_performance` has rows like
   "High Fashion by Addison Rae" and "High Fashion" — same song, two
   different TikTok sound IDs. The table now surfaces both. Consider
   deduping by normalized title in the `songUGC` useMemo, keeping the
   higher-volume variant.
3. **`tiktok_status` classification is off.** "ATM" by Don Toliver has
   3 videos and 9.9M plays but is tagged `emerging`. A 9M-plays track
   isn't emerging. The status calc needs a plays-weighted tier, not
   just video count.
4. **322-row table performance.** For the biggest labels we're now
   rendering 300+ `<tr>` at once. Fine today but worth virtualizing
   (react-window) if we see the overview page lag.
5. **Filter/search.** With 300+ songs a per-artist or per-status filter
   chip row above the table would make this a real tool instead of just
   a long list.
