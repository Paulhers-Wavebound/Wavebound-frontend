# Sound Merge URL Parser Fix

## What changed

- Updated `extractSoundId` in `src/utils/soundIntelligenceApi.ts` to parse stored TikTok music URLs shaped like `/music/-1234567890`.
- Updated `soundCandidateToUrls` in `src/utils/soundGroupApi.ts` to build merge URLs from distinct `sound_id`s and fall back to canonical `/music/<sound_id>` URLs when stored URLs are missing or malformed.
- Filtered duplicate suggestions client-side so cards with fewer than two distinct sound IDs do not appear as mergeable suggestions.
- Updated `docs/features/sound-id-merge.md` with the parser and distinct-ID behavior.

## Why

Suggested Merges were passing stored URLs like `https://www.tiktok.com/music/-734...` into the merge flow. The parser did not recognize the leading dash format, so users saw "Could not extract sound ID" even though the card had valid sound IDs.

## What was tested

- Queried live `sound_intelligence_jobs` rows and confirmed the failing candidates use `/music/-<sound_id>` URLs.
- Ran `npx eslint src/utils/soundIntelligenceApi.ts src/utils/soundGroupApi.ts` successfully.
- Ran `npx tsc --noEmit` successfully.

## What to verify in browser

- Suggested Merges no longer show cards where the displayed IDs are all the same ID.
- Clicking Merge suggestion on a card with two or more distinct IDs creates the merged sound instead of showing the sound-ID extraction toast.

## While I was in here recommendations

- Backfill stored `sound_url` values to a canonical `/music/<sound_id>` shape during the next maintenance pass.
- Add a tiny unit test around `extractSoundId` for the three URL shapes we now support.
- Move distinct-ID filtering into the duplicate-candidate RPC so every caller gets the same cleaned candidate set.
