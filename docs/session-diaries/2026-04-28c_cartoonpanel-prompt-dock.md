# CartoonPanel Prompt Dock + Shared RailArrow Extraction

Continuation of `2026-04-28b_higgsfield-skill-pass-2.md`. Acted on diary recommendations #1 (apply prompt-dock pattern to CartoonPanel) and #2 (extract `RailArrow` to a shared component).

## What changed

| Path                                                              | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/content-factory-v2/CartoonPanel.tsx`              | The bottom Generate row is now a sticky-bottom prompt dock. `position: sticky; bottom: 16px` so it stays reachable while the user scrolls through artist / preset / voice / lead-hunter content above. Outer 2px frame with 26px radius and `rgba(15,17,19,0.96)` background (page-bg with subtle haze). Inner 24px-radius surface with 5%-accent-soft border (mirrors higgsfield.ai's `image-form` perimeter). Generate button promoted to oversized variant: 64px tall, caps Space Grotesk 700 with `0.04em` tracking, accent-glow shadow on hover. Panel root gets `pb-[140px]` so the last form item isn't hidden behind the dock. |
| `src/components/content-factory-v2/_carousel/RailArrow.tsx` (NEW) | Standalone Higgsfield-style scroll arrow. 40px frosted-glass circle (`backdrop-filter: blur(40px)`, 5%-white tint), hidden below `lg`, fades in on `group-hover` of the parent rail. Optional `yOffset` prop for rails where the visual center is offset from the geometric center (e.g. cards with eyebrow rows above). Full JSDoc + accessibility label.                                                                                                                                                                                                                                                                             |
| `src/pages/label/ContentFactoryV2.tsx`                            | Removed the local `RailArrow` helper (was 25 lines), imports the shared component, passes `yOffset={14}` to keep the existing visual-center alignment unchanged. Dropped `ChevronLeft` / `ChevronRight` from the local lucide import set since they're now only used inside `RailArrow.tsx`.                                                                                                                                                                                                                                                                                                                                           |

## Why

Diary #1: the Generate CTA was below the fold once the user scrolled through the Lead Hunter board. Higgsfield's prompt-dock pattern keeps the primary action permanently reachable — that's the single biggest "feels like a creative tool" upgrade. The 5%-accent perimeter ties the dock visually into the rest of the prompt-dock recipe (matched in `SmoothSelect`'s trigger from the prior pass).

Diary #2: `RailArrow` will be reused — the next obvious surface is ReviewView's filter rail, and any future content rails. Extracting now while the implementation is fresh prevents copy-paste duplication later.

We chose `position: sticky` over `position: fixed` deliberately: `fixed` would have to deal with framer-motion's `motion.div` wrapper (transform creates a containing block, breaking fixed positioning during tab transitions). `sticky` works inside the panel's normal flow without portal complexity.

## What was tested

- `npx tsc --noEmit` — clean.
- `npm run build` — clean (10.63s). CFV2 chunk: 151.9 KB / ~41 KB gzipped (was 151.0 KB; ~0.9 KB increase from the dock JSX + the shared `RailArrow` import).
- Logic untouched: `handleGenerate`, `generateDisabled`, `inFlightCount` banner, lead-hunter flow — all intact, only the visual container changed.

## What to verify in browser

`npm run dev` → `/label/<labelId>/content-factory-v2`:

1. **Sticky prompt dock — Create → Story preset**:
   - Open Create tab, pick the Story (cartoon) preset. Pick an artist; the explainer text appears in the dock.
   - Scroll the panel up and down — the dock stays anchored to the bottom 16px of the viewport, content scrolls beneath.
   - The last form field (Voice / Narrator) should NOT be hidden behind the dock — there's a 140px tail of breathing room.
   - Run Lead Hunter, pick a lead — explainer text in the dock updates, Generate button enables.
   - Hover Generate — accent-glow shadow ramps in (`0 0 32px var(--accent-glow)`).
   - Click Generate — submits, "Submitting…" state with spinner, then dock returns to default copy.
2. **Tab switch behavior**:
   - Switch to Explore → dock disappears (CartoonPanel unmounts).
   - Switch back to Create → dock returns at sticky-bottom.
3. **Active jobs rail** (regression check after `RailArrow` extraction):
   - Kick off a job; rail appears above the tab nav.
   - Hover rail on desktop ≥1024px — chevron arrows fade in on the side edges (same behavior as before).
   - Click a chevron — rail scrolls 240px smoothly.
4. **Mobile**:
   - At <640px, dock takes full width minus the panel's outer padding.
   - The 64px-tall Generate button stays visible; on very narrow screens, the explainer copy can wrap or compress — verify no overflow into the button.

## Out of scope

- Apply prompt-dock pattern to CreateView's other preset panels (link_video, fan_brief, etc.). Those panels have their own Generate flows; same recipe applies, but each is its own change. Worth doing once we confirm Story/Cartoon dock behaves well in production.
- Use `RailArrow` on ReviewView's filter rail. The rail there is currently a sidebar (`FilterGroup` stacked vertically), not a horizontal rail — no arrows needed yet.
- Animated dock entrance (slide up from bottom on first mount). The dock simply appears; a 200ms `translateY(8px) → 0` Framer entrance would be nicer but is polish, not core.

## "While I was in here" recommendations (ranked by user impact)

1. **Promote `--accent-hairline` to a named token** — it's now used in 5+ places (CartoonPanel dock perimeter, SmoothSelect trigger, ContentFactoryV2 form-perimeter aesthetic). Add `--accent-hairline: rgba(242, 93, 36, 0.05)` to the `[data-cfv2="true"]` block in `src/index.css` so future surfaces don't reinvent the magic number.
2. **Apply the prompt-dock pattern to the other Create-tab preset panels** (link_video, fan_brief, etc.). Each preset's Generate row is currently in-flow; same sticky-bottom dock recipe would unify the Create tab into a single creative-tool feel.
3. **Animate the dock entrance** with a 240ms `y: 12 → 0, opacity: 0 → 1` Framer transition on mount. Tiny touch, but the dock currently appears instantly which can feel slightly abrupt during tab transitions.
4. **Pull the dock's status copy into a `<DockStatus>` helper** that takes `artist`, `lead`, `subFormat`, `count` props. Right now it's a triple-conditional ternary inside JSX — readable now, but if other presets adopt this dock the helper makes the copy logic shareable.
5. **Set `box-shadow: 0 -8px 32px rgba(0,0,0,0.4)` on the dock outer frame** for additional depth separation from scrolling content underneath. Currently the 96%-opacity-page-bg outer ring does most of the work, but a soft ambient shadow would make the "floats above" intent clearer on lighter content backgrounds (e.g. the Lead Hunter board's accent-tinted surfaces).
