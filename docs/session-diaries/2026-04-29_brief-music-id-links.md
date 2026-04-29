# Brief music_id mentions → clickable TikTok-sound links

## What changed

- New util `src/utils/briefText.tsx` exporting `renderBriefText(text)` that scans for the AI-embedded pattern `(music_id: <19-digit id>)` and replaces each occurrence with a compact, accent-colored `ExternalLink` icon linking to `https://www.tiktok.com/music/sound-<id>` (opens in new tab, `stopPropagation` so it does not trigger row expand).
- Applied at every brief-text render site:
  - `src/components/label/content-social/ContentRosterTable.tsx` — focused_sound.reason (expanded row), catalogue_alert.reason (expanded row), focused.reason (card view), `derivePriorityAction(artist)` priority banner (since it returns `focused_sound.action` when present).
  - `src/components/label/briefing/AIFocus.tsx` — focus.reason, focus.action, catalogue_alert.reason, catalogue_alert.action, content_opportunities[].reason.
  - `src/components/label/content-social/ContentBriefingCard.tsx` — briefing.paragraphs.
  - `src/components/label/PresidentBriefCard.tsx` — situation/action paragraphs from `splitBrief()`.

## Why

Paul flagged it on the Content & Social roster (Alina row): the AI-generated focused_sound.reason inlines mentions like `… the pre-release teaser clip (music_id: 7596025455266859831) already built 29 UGC videos …`. The 19-digit IDs broke the reading flow and were not actionable. We already store enough data to deep-link to TikTok and TikTok routes only on the trailing ID — verified that both `/music/sound-<id>` and `/music/-<id>` return 200, so no DB lookup or slug resolution is needed.

## What was tested

- `npx tsc --noEmit` — clean.
- Verified TikTok URL pattern with the two real IDs from Alina's brief (`7596025455266859831`, `7630641991486868238`) — both return HTTP 200 with placeholder slug.
- Confirmed the canonical pattern `(music_id: <id>)` against live `weekly_pulse.focused_sound.reason` for `alinatries2sing`.

## What to verify in the browser

- Roster expanded row for Alina: the two `(music_id: …)` mentions should now render as small accent ↗ icons inline. Hover should show the ID via `title`. Click should open TikTok in a new tab AND not trigger row collapse (stopPropagation is in place).
- Morning Brief / AIFocus surface: same treatment when the AI inlines IDs in `focus.reason`/`focus.action`.
- Plain-text fallback: rows with no music_id mentions render exactly as before — `renderBriefText` short-circuits to the original string when no match.

## While I was in here, I also noticed

1. **The AI prompt itself should be told to never inline raw `music_id: <id>` values.** Even with the icon link, the long ID is still a code smell — the brief generator should be instructed to either (a) reference sounds by quoted title (`'how2get2me'`), or (b) emit a structured `{ref: "music_id", id: "…", label: "teaser clip"}` annotation that we render properly. The current text is leaking implementation detail into editorial copy. Backend handoff item.
2. **`tracked_sounds` slug enrichment.** When we DO know the sound title (we usually do, via `artist_sounds.sound_title`), we could pass it as the URL slug for slightly nicer share URLs and fewer TikTok redirects. Cheap follow-up: pass an optional `idToSlug` map from the page hook.
3. **Other "raw ID leak" patterns.** A quick grep for `\bjob_id\b` / `\bvideo_id\b` / `\baweme_id\b` in roster/briefing components would surface other places where opaque IDs may have crept into user-facing copy. Worth a sweep.
4. **`renderBriefText` returns `React.ReactNode` not `string`.** That means anything that previously did string ops on these fields downstream would break. I checked — all current call sites consume the value as a child of a JSX node, so we're safe. Worth a note for future refactors.
5. **`derivePriorityAction` now flows through the music_id linker** even though its non-AI fallback branches return purely deterministic strings (`"Get X posting again — N days silent"`, etc.). Those will never match the regex so cost is zero, but if we add structured branches that include IDs later, this is now plumbed.
