# Higgsfield Aesthetic — Second Playwright Pass + CFV2 Application

Continuation of `2026-04-28_higgsfield-aesthetic-cfv2-redesign.md`. Filled the 5 gap areas identified in that diary by capturing more of higgsfield.ai with Playwright, then translated the highest-impact findings into Wavebound CFV2.

## What changed

### Skill (`~/.claude/skills/higgsfield-aesthetic/`)

| File                      | Addition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reference/typography.md` | New "When to use Space Grotesk vs system sans" section. Higgsfield's nav links + form labels use `ui-sans-serif`, NOT Space Grotesk — Space Grotesk is reserved for displays. Without this clarification the skill would push everything into all-caps Grotesk and read as shouty.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `reference/components.md` | 6 new component recipes appended: **Sticky top nav**, **Mega-menu dropdown** (multi-column popover with section headers + 48px icon containers + badge-above-icon), **Prompt dock** (fixed-bottom command bar — `position: fixed; bottom: 16px`, 26px outer / 24px inner radius, 5%-accent border, contenteditable prompt), **Toolbar pill / select trigger** (40px h-10 with 5%-accent hairline that ramps to full accent on focus), **Generate / oversized primary CTA** (84px tall — double-height in a row of 40px pills), **Carousel scroll-arrow buttons** (40px frosted-glass circles with `backdrop-filter: blur(40px)`, fade in on rail hover), **Mobile bottom tab bar** (5 tabs + lifted accent center button instead of a hamburger), **Promo banner** above the nav. |
| `reference/layout.md`     | Extended responsive section with concrete breakpoint behavior table (xl / lg / md / sm / mobile), the "peek" pattern (next card hangs 10–15% into view to advertise scrollability), type-scale fluidity table, mobile nav → bottom tab bar pattern, mobile prompt-dock stacking with safe-area inset.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

The skill is now genuinely complete for any future creative-tool / AI-app build — including the 5 gaps that were unspecified after the first pass.

### CFV2 application (translating findings into the page)

| Path                                                 | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/label/ContentFactoryV2.tsx`               | Extracted "Currently generating" rail into a typed `ActiveJobsRail` helper component + new `RailArrow` helper. Arrows are 40px frosted-glass circles (`backdrop-filter: blur(40px)`, 5%-white tint background), hidden below `lg`, fade in on rail hover via `group-hover:opacity-100`, scroll the rail by 240px each click. Inner card hover state preserved via `group/card` so arrow hover doesn't fire card glow. Imported `ChevronLeft` / `ChevronRight` from `lucide-react`. |
| `src/components/content-factory-v2/SmoothSelect.tsx` | Trigger now uses the toolbar-pill recipe: `var(--surface-2)` background + `1px solid var(--accent-soft)` (5% accent) hairline that ramps to full `var(--accent)` on hover. Replaces the previous `var(--bg-subtle)` + `var(--border)` treatment that read as "form input" instead of "creative tool selector." Radius normalized to `rounded-xl` (12px) to match the rest of the prompt-dock recipe.                                                                               |

## Why

Paul asked for the second Playwright pass to fill the 5 gaps so the skill is "genuinely complete," then to translate the new patterns into CFV2. We chose two specific applications:

1. **Carousel scroll arrows on the active-jobs rail** — exact 1:1 mapping of the Higgsfield carousel pattern onto a surface that already exists in CFV2. Visible affordance for users on mouse devices, hidden on touch. Touchable users still pan the rail directly.
2. **Toolbar-pill recipe in `SmoothSelect`** — the artist / voice picker now reads as part of the same accent-glow zone as the rest of the form. The 5%-accent hairline on every selector + form perimeter is the visual signature of a Higgsfield prompt dock.

The other patterns (mega-menu dropdown, prompt dock, mobile bottom tab bar, promo banner) are documented in the skill but not applied to CFV2 — they'd be larger structural moves and the prior pass already covered the visible CFV2 surfaces.

## What was tested

- `npx tsc --noEmit` — clean (no output = no errors).
- `npm run build` — clean (10.75s). CFV2 chunk now 150.98KB / 40.69KB gzipped (essentially unchanged from 150KB / 40.7KB).
- Logic untouched — the rail still shows the same `activeJobs` aggregation and clicking still jumps to the Assets tab.

## What to verify in browser

`npm run dev` → `/label/<labelId>/content-factory-v2`:

1. **Active jobs rail with arrows**:
   - Kick off a fan-brief job (or have multiple in flight) so the rail populates.
   - Hover the rail area on a desktop ≥1024px viewport — frosted-glass left/right chevron buttons fade in on the side edges.
   - Click a chevron — rail scrolls 240px in that direction smoothly.
   - Hover an individual card — the per-card accent glow still appears (group/card was needed to prevent arrow-hover from triggering all card glows).
   - On a viewport <1024px or on touch, the arrows are hidden — the rail still pans by drag/swipe.
2. **SmoothSelect toolbar pill**:
   - Open `Create → Story` preset, find the artist / voice / narrator picker.
   - Trigger now has a deep `surface-2` background and a near-invisible 5%-accent hairline border.
   - Hover the trigger — border ramps to full accent orange.
   - Open the popover — selected option still has its 2px accent left-border + accent-soft fill (unchanged).
3. **Reduced motion**: rail arrows still appear; smooth scroll falls back to instant in browsers that respect `prefers-reduced-motion`.

## Out of scope (mention to user, don't implement)

- Applying the **prompt dock** to CartoonPanel. The bottom 1/3 of the Create tab could become a fixed-bottom command bar (prompt area + toolbar pills + oversized Generate button) but that's a structural restructure of `CartoonPanel.tsx` (~960 lines) — a fresh task, not a polish.
- **Mobile bottom tab bar** for CFV2's Explore / Create / Assets tabs. Currently the dashboard shell handles mobile nav globally; introducing a CFV2-only bottom bar creates a navigation discontinuity between routes. A coherent mobile nav strategy is its own project.
- **Mega-menu dropdown** in the dashboard top nav. Higgsfield uses this for "Image" / "Video" each opening a multi-column model picker. Wavebound's nav doesn't have that depth yet — the dropdown isn't useful until there are 3+ feature surfaces inside a top-level item.

## "While I was in here" recommendations (ranked by user impact)

1. **Apply the prompt-dock pattern to CartoonPanel.** This is the single biggest "feels like Higgsfield" upgrade still on the table for CFV2. The bottom toolbar (artist + voice + Find leads + Generate Story) already has the right shape — wrapping it in a fixed-bottom 26px-radius dock with a 5%-accent perimeter would lock CFV2 into "creative tool" territory permanently. ~150 lines of refactor.
2. **Extract `RailArrow` to a shared component.** `src/components/content-factory-v2/_carousel/RailArrow.tsx`. Then ReviewView's filter rail and any future rails can reuse it. Trivial to do now while the implementation is fresh.
3. **Run the prompt-dock pattern on the chat composer in `LabelChat.tsx`** (or wherever the Wavebound assistant chat lives). That surface is the closest Wavebound has to a "send a prompt" experience and it's where users will _expect_ a Higgsfield-style dock based on their other tools.
4. **Add `<header>` sticky behavior** to the dashboard's top nav so it matches the Higgsfield convention of nav-stays-as-you-scroll. CFV2 currently scrolls past its tab nav once the header drops out of view; a sticky `nav` with `top: 0` + `var(--bg)` background is the move.
5. **Document the 5%-accent hairline as a CFV2 design token.** It's now in 4 places (form perimeter, SmoothSelect trigger, prompt-dock buttons, mega-menu icon container) — promote it to a named token like `--accent-hairline: rgba(242,93,36,0.05)` so future surfaces don't reinvent it with a magic number.
