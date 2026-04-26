# 2026-04-26 — Content Factory V2 motion polish

## What changed

Phase 2 of the Higgsfield-style redesign: a focused motion polish pass across every interaction surface in `/label/content-factory-v2`. No IA changes, no new features — just adding motion where it was missing and tightening what was already there.

### Files modified

- `src/index.css` — added motion tokens (`--ease-out-expo`, duration variables, stagger step) and the previously-missing global `prefers-reduced-motion` block (a11y violation closed).
- `src/components/ui/button.tsx` — `cta` and base variants get `active:scale-[0.97]` press feedback. `cta` also gets `hover:-translate-y-[1px]` for the lift, easing tightened to `cubic-bezier(0.16,1,0.3,1)`.
- `src/pages/label/ContentFactoryV2.tsx` — wrapped page in `<MotionConfig reducedMotion="user">`. Tab underline became `motion.span layoutId="cf2-tab-underline"` so it slides between tabs. View ladder wrapped in `<AnimatePresence mode="wait">` keyed by `activeTab` for a fade+8px crossfade.
- `src/components/content-factory-v2/ExploreView.tsx` — tool grids (Live + Roadmap) wrapped in `motion.div` with `staggerChildren: 0.04`. ToolCard hover-lift easing tightened. Cards get press-scale.
- `src/components/content-factory-v2/CreateView.tsx` — preset card grid wrapped in motion.div + motion.button stagger. Step-2 fields wrapped in `<AnimatePresence>` keyed by `activePreset` (fade+12px rise on enter). Tune drawer became `motion.div` backdrop fade + `motion.aside` slide-in from the right. ChipRow buttons get press-scale.
- `src/components/content-factory-v2/ReviewView.tsx` — QueueCard list wrapped in motion.div parent with stagger (0.035s) + each card fade+8px rise. Stagger only fires on tab-mount; new items pushed by Realtime/polling get a standalone fade-in (no list-wide restage). BriefViewerModal converted to motion.div backdrop fade + scale 0.96→1. ActionButton gets press-scale.
- `src/components/content-factory-v2/KillFeedbackModal.tsx` — same scale-fade pattern as BriefViewerModal, wrapped in `<AnimatePresence>` so close also animates.
- `src/components/content-factory-v2/SmoothSelect.tsx` — popover row buttons get `active:scale-[0.99]` + tightened easing.

### Animation rules followed (per `~/.claude/skills/animate`, `frontend-design`, `polish`)

- Durations: 130ms instant feedback, 240ms state changes, 360ms layout/drawer/modal. Exits at ~75% of enter.
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo) for all entrance motion. No bounce, no elastic.
- GPU-only properties: `transform` and `opacity`. No `height`/`margin`/`padding` animation.
- Stagger cap ≈ 480ms (40ms × 12 children max).
- `prefers-reduced-motion` honored by both CSS and `MotionConfig reducedMotion="user"`.

## Why

User asked to "make the whole Content Factory v2 much smoother when pressing buttons, switching tabs and navigating the menu and page logic" — Higgsfield-quality. Phase 1 nailed the visual aesthetic (square dark cards, neon CTA, flat top-nav, Explore landing) but tabs jumped instantly, modals popped, cards rendered in one frame. The phase-2 pass closes that gap with one signature motion (sliding tab underline + view crossfade) and 6 supporting polish points.

## What was tested

- `npx tsc --noEmit` — clean.
- `npm run build` — clean. `framer-motion-CDew-XMB.js` is 41.81 kB gzipped (acceptable for the value across the route; framer-motion was already in package.json, just unused in CFv2).
- ContentFactoryV2 chunk: 120.5 kB / 31.48 kB gzipped — within budget.

## What to verify in browser (Paul)

In order:

1. Tab clicks Explore → Create → Assets in fast succession: orange underline slides between tabs (doesn't teleport); previous view fades down/out as next fades up; no white flash.
2. On Create, click any preset card: subtle press (~130ms scale-down), then form section below appears with a 12px rise. Switching presets fades old fields out, new fields in.
3. Open the Tune drawer (Tune button in CreateView footer): backdrop fades to ~50% black over ~240ms while panel slides from the right edge. Click backdrop — panel slides back out.
4. Open BriefViewerModal (Eye icon on a complete cartoon's QueueCard) and KillFeedbackModal (Kill action): scale-in feels intentional; close is crisp.
5. Tap Approve / Tune / Kill / ChipRow buttons in the Tune drawer: each press has a tactile scale-dip, no color flicker.
6. Leave Assets tab open with an active job ~60s: new cards appear with a soft fade-in; previously-rendered cards stay perfectly still (the polling-driven Realtime updates should NOT cause the entire list to re-stagger).
7. macOS System Settings → Accessibility → Display → Reduce Motion ON, refresh: tab switches snap, modals fade with no scale, drawer no slide. Then OFF — motion returns.
8. Submit a real cartoon end-to-end: `CartoonStageTimeline` stages tick through normally (untouched), thumbnail lands on the queue card, play affordance works.

## While I was in here, I also noticed/recommend

1. **The motion tokens belong in the design-system rules.** I added `--ease-out-expo`, durations, stagger to `src/index.css`. They're now first-class but undocumented in `.claude/rules/design-system.md`. Want me to add a "Motion" section to the design rules so future components use the tokens by default?
2. **`framer-motion` is now a billed dependency in CFv2's chunk.** Other routes (LabelExpansionRadar, ThePulse, Outlook, etc) might benefit from the same view-crossfade treatment if they have multi-tab layouts — and adding framer-motion there is now free since the chunk is already loaded if a user has visited CFv2 in this session.
3. **The tab-underline `layoutId` pattern is reusable.** The Pending/Scheduled SubTabs in ReviewView (line 283-303) still jump instantly; same `layoutId` trick would smooth them. ~10 lines.
4. **Reduced-motion CSS block is global** (`*, *::before, *::after`) — applies to every page, not just CFv2. This means animations site-wide will collapse for vestibular-sensitive users. That's the right behavior, but worth knowing because previously the app had zero reduced-motion handling.
5. **Bundle-splitting opportunity.** `index-FxHtnFeZ.js` is 2.07 MB / 565 kB gzipped — way over the 500 kB warning threshold. Not a CFv2 issue, but a chronic one. Worth one focused PR to set `manualChunks` per the Vite docs.
