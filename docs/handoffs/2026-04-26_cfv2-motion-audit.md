# CFv2 motion polish audit — 2026-04-26 (same-day)

Same-day audit of the motion polish that landed earlier today. Six checks against the motion infrastructure + a tsc pass. Found and fixed one real regression in the same session.

## Results

- ✅ **1. Motion tokens in `src/index.css`** — all 5 tokens present (`--ease-out-expo`, `--dur-instant`, `--dur-state`, `--dur-layout`, `--dur-entrance`); `prefers-reduced-motion` block present.
- ✅ **2. Button CTA press feedback** — both `active:scale-[0.97]` (base + cta) and `hover:-translate-y-[1px]` (cta) present in `src/components/ui/button.tsx`.
- ✅ **3. Tab underline + view crossfade** — `MotionConfig`, `motion.span layoutId="cf2-tab-underline"`, and `AnimatePresence mode="wait"` all present in `ContentFactoryV2.tsx`.
- ✅ **4. Card grid stagger** — `staggerChildren` present in `ExploreView.tsx` and `CreateView.tsx`; both import from `framer-motion`.
- ✅ **5. QueueCard list stagger** — `staggerChildren` present in `ReviewView.tsx`.
- ✅ **6. No raw `duration-200` regression** — _was_ ❌ on first pass: QueueCard root in `ReviewView.tsx:444` still used `transition-all duration-200` instead of the new tokens. Fixed in the same session by swapping to `transition-[transform,border-color,box-shadow,opacity] duration-[var(--dur-state)] ease-[cubic-bezier(0.16,1,0.3,1)]`. Re-grep confirms zero matches.

`npx tsc --noEmit` — clean.

## Notes

This was supposed to be a 2-weeks-out audit (originally scheduled as remote routine `trig_01SkZqj54LMinDUvdPbnSxka`, now disabled). Running it on the same day surfaced a real miss from the polish pass — the QueueCard hover transition was the last legacy `duration-200` in the CFv2 component tree, and the polish PR didn't catch it. Worth keeping the audit pattern for future motion changes — same-day runs find the seams fresh in your head.
