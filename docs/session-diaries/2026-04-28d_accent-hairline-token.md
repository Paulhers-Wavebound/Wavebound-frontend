# `--accent-hairline` Design Token

Acted on diary recommendation #1 from `2026-04-28c_cartoonpanel-prompt-dock.md`. Promoted the prompt-dock perimeter color to a named, semantic token so future surfaces can opt in without reinventing the value.

## What changed

| Path                                                            | Change                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.css`                                                 | Added `--accent-hairline: rgba(242, 93, 36, 0.12)` to the `[data-cfv2="true"]` token block, with a comment defining its intended use: outer border for prompt-dock surfaces, ramps to `var(--accent)` on hover/focus. Tinted backgrounds keep `--accent-soft`. |
| `src/components/content-factory-v2/CartoonPanel.tsx`            | Sticky prompt dock perimeter migrated from `var(--accent-soft)` → `var(--accent-hairline)`.                                                                                                                                                                    |
| `src/components/content-factory-v2/SmoothSelect.tsx`            | Trigger border + onMouseLeave restore migrated to `var(--accent-hairline)`.                                                                                                                                                                                    |
| `src/components/content-factory-v2/ReviewView.tsx`              | Generating-card box-shadow ring (`0 0 0 1px ...`) migrated to `var(--accent-hairline)` — that shadow layer is functionally a 1px hairline border.                                                                                                              |
| `~/.claude/skills/higgsfield-aesthetic/reference/components.md` | Updated prompt-dock and toolbar-pill recipes to reference `var(--accent-hairline)` instead of `var(--accent-soft)`. Added a note explaining that centralizing as a single token keeps every dock surface in sync if the brand accent changes.                  |

## Why

Diary #1 from the previous round flagged this magic number was scattered across 4+ surfaces: the CartoonPanel dock perimeter, SmoothSelect trigger, ReviewView generating-card glow ring, and any future dock that opts into the recipe. With separate `var(--accent-soft)` references for both border-intent and background-intent uses, swapping one to a different value would silently break the other.

`--accent-hairline` separates intent: it's _the standard prompt-dock perimeter color_ — a semantic name, not a tint level. `--accent-soft` stays available for tinted backgrounds.

We kept the value at 12% (the current implementation) instead of dropping to Higgsfield's literal 5%, because on Wavebound's deeper bg `#0f1113` with burn orange, 12% reads as a deliberate hairline; 5% disappears. Different accent colors carry different visual weight at the same alpha.

## What was tested

- `npx tsc --noEmit` — clean.
- `grep -c "accent-hairline"` shows the token defined once in `src/index.css` and used in 4 places (1 in CartoonPanel, 2 in SmoothSelect, 1 in ReviewView). All migrations land.

## What to verify in browser

`npm run dev` → `/label/<labelId>/content-factory-v2`:

1. **CartoonPanel dock** (Create → Story preset): perimeter still has the same accent-tinted hairline as before — visually unchanged.
2. **SmoothSelect trigger** (artist / voice / narrator pickers): same accent-tinted border at rest, ramps to full accent on hover.
3. **Generating QueueCard** (Assets tab, while a job is running): same accent ring + glow shadow.

This change is purely a token rename — no visual diff expected. If anything looks different, the token value drift was not 12% in the original; verify against `git diff`.

## "While I was in here" recommendations

1. **Migrate the original `--accent-faint: rgba(242, 93, 36, 0.05)` to a use case or remove it.** It's defined but unused. Either the 5%-accent intent has a real surface (a "deeper hairline" on focus rings, perhaps) or it's dead code.
2. **Use `--accent-hairline` on the active-jobs tile resting state** in `ContentFactoryV2.tsx`'s `ActiveJobsRail`. The tiles currently have no perimeter at rest — adding a `box-shadow: 0 0 0 1px var(--accent-hairline)` would tie them visually into the rest of the dock-recipe surfaces.
3. **Apply `--accent-hairline` to the ExploreView preset cards' rest state.** Same rationale: the cards currently have no perimeter; a shared hairline would make the whole CFV2 feel like one connected accent-glow zone.
