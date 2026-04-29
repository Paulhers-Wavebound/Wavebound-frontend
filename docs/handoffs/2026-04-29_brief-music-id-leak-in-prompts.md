# AI brief prompts — stop leaking raw `(music_id: <19-digit>)` into user-facing copy

## Problem

The AI brief generator(s) currently inline raw TikTok music IDs into editorial paragraphs aimed at label execs. Example pulled live today from `artist_intelligence.weekly_pulse` for `alinatries2sing`:

```
focused_sound.reason:
  "Two songs confirmed released April 25, 2026 — Day 1 of push window —
   with 'how2get2me' as the anchor: the pre-release teaser clip
   (music_id: 7596025455266859831) already built 29 UGC videos on the
   tracked clip across 22 unique creators and 155,464 plays before the
   official release, and a concurrent pre-release teaser sound
   (music_id: 7630641991486868238) is already showing 5 new UGC videos
   in the last 7 days with fan_to_artist_ratio 4.0 (status: trending),
   signaling audience readiness at release gate."
```

The 19-digit IDs break reading flow and aren't actionable as plain text. Paul flagged it on the Content & Social roster. The IDs are an implementation detail leaking into editorial copy that gets read by label presidents.

## Frontend workaround already shipped

Frontend now post-processes brief strings client-side (`src/utils/briefText.tsx` → `renderBriefText()`): any `(music_id: <19-digit>)` mention is replaced with a small accent-colored ↗ icon linking to `https://www.tiktok.com/music/sound-<id>`. Applied at:

- `ContentRosterTable.tsx` (focused_sound.reason / catalogue_alert.reason / focused_sound.action via priority banner)
- `AIFocus.tsx` (focus.reason, focus.action, catalogue_alert.reason, catalogue_alert.action, content_opportunities[].reason)
- `ContentBriefingCard.tsx` (briefing.paragraphs from intelligence_briefs)
- `PresidentBriefCard.tsx` (situation/action from president_briefs.brief_text)

This makes the existing copy tolerable but it's a workaround. The real fix is upstream.

## Real fix needed (backend)

In whatever generates `artist_intelligence.weekly_pulse` (probably an Edge Function calling Claude with an analysis prompt — likely names: `weekly-pulse`, `artist-intelligence`, or a daily-cron worker), update the system/user prompt so the model is **explicitly told not to inline raw `music_id` values in `reason` / `action` / paragraph fields**.

Pick one of these two approaches:

### Option A — reference by quoted title only (simpler)

Add to the prompt:

> When discussing a specific sound, reference it by its quoted title (e.g. `'how2get2me'`, `'original sound'`). **Never emit raw `music_id` numeric values in `reason`, `action`, or any user-facing paragraph field.** If you need to disambiguate two clips with the same title, add a short clarifier like "(2nd verse)" or "(pre-release teaser)" — never the raw ID.

Then the example above becomes:

> "…with 'how2get2me' as the anchor: the **pre-release teaser clip** already built 29 UGC videos…and a concurrent **pre-release teaser sound** is already showing 5 new UGC videos…"

Cleaner, and the frontend's TikTok-link workaround can be removed once you confirm this is enforced.

### Option B — structured annotations (more useful long-term)

Add a sibling field to each brief object that maps any sound mentioned in the prose to its identifiers:

```jsonc
"focused_sound": {
  "title": "how2get2me",
  "reason": "…the pre-release teaser clip [@sound:teaser_clip] already built 29 UGC videos…",
  "action": "…",
  "sound_refs": {
    "teaser_clip": { "music_id": "7596025455266859831", "label": "pre-release teaser clip" },
    "teaser_sound": { "music_id": "7630641991486868238", "label": "pre-release teaser sound" }
  }
}
```

Frontend can then render `[@sound:teaser_clip]` as a proper inline pill ("pre-release teaser clip ↗") with a real label, not just an icon. Same pattern would generalize to `[@artist:…]`, `[@video:…]`, `[@chart:…]` etc.

Recommend **Option A for the next deploy** (5-line prompt change, immediately fixes Paul's complaint), and **Option B as a follow-up** if/when we want richer in-text linking.

## Fields that need cleaning (canonical list)

Same rule should apply everywhere AI text lands in user-facing copy. At minimum:

- `artist_intelligence.weekly_pulse.focused_sound.reason`
- `artist_intelligence.weekly_pulse.focused_sound.action`
- `artist_intelligence.weekly_pulse.catalogue_alert.reason`
- `artist_intelligence.weekly_pulse.catalogue_alert.action`
- `artist_intelligence.weekly_pulse.content_opportunities[].reason`
- `intelligence_briefs.brief_json.paragraphs[]` (Content & Social briefing)
- `president_briefs.brief_text`

A simple regex check in the generator's post-processing could enforce this defensively: if the model output matches `\bmusic[_ ]?id\s*[:=]\s*\d{15,}\b`, log a warning and either retry the call or strip the parenthetical before persisting.

## Backfill / cleanup of existing rows

Existing `weekly_pulse` rows still contain the raw IDs. Once the prompt is fixed, either:

1. Wait for the next regeneration cycle (whatever cadence the cron runs at) — they'll naturally be replaced.
2. One-shot regenerate all current rows once the prompt change is verified.

No DB migration needed; it's all in JSONB free text.

## Verification

After deploy, query for any remaining leaks:

```sql
SELECT artist_handle, weekly_pulse_generated_at
FROM artist_intelligence
WHERE weekly_pulse::text ~* '\(music[_ ]?id:\s*\d{15,}\)'
ORDER BY weekly_pulse_generated_at DESC
LIMIT 20;
```

Should return zero rows after the next regeneration cycle.

## Cleanup once verified

Once we confirm no new briefs contain raw IDs:

- Frontend `src/utils/briefText.tsx` and the `renderBriefText(...)` call sites can be removed (or kept as defense-in-depth — it's cheap).
- If you go with Option B, frontend gets a small refactor to render `[@sound:key]` tokens against the `sound_refs` map instead.

## Why this matters beyond cosmetics

These briefs are sent to label presidents (Sony, Columbia, Warner). "(music_id: 7596025455266859831)" inside a sentence about strategic release-window allocation makes us look like a half-built data tool, not an intelligence product. Worth fixing at the source.
