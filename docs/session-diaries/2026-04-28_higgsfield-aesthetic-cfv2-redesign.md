# Higgsfield-Aesthetic Skill + Content Factory V2 Redesign

## What changed

Two parallel deliverables.

### A. New `higgsfield-aesthetic` skill (lives outside the repo)

`~/.claude/skills/higgsfield-aesthetic/`:

- `SKILL.md` — frontmatter (auto-trigger language) + body covering the aesthetic in 30 seconds, context-gathering protocol, surface system, typography, layout, motion, components, anti-patterns, brand integration with a Wavebound worked example, and a JSX worked example. ~400 lines.
- `reference/color.md` — three-tier neutral-cool darks, accent ratio table (5/10/24/45/100%), accent selection rubric, paper-variant recipe, contrast targets, brand-substitution table.
- `reference/typography.md` — Space Grotesk loading, full type scale, weight + casing rules, letter-spacing intuition, pairing rules, common headline recipes, anti-patterns.
- `reference/layout.md` — bento patterns, content-tile recipe, gap rhythm, container widths, hero block patterns, responsive notes, anti-patterns.
- `reference/motion.md` — easing constants, entrance choreography, tab/content transitions, hover lifts, AI-state pulses, status gradient bar, reduced-motion fallbacks, anti-patterns.
- `reference/components.md` — concrete code recipes: hero showcase block, content tile, oversized CTA section, pill counter, NEW/SOON tag, status orb, lead/asset card, status panel, scroll marquee, active-jobs strip, buttons, empty states.

The skill auto-triggers in future sessions when prompts mention "make this feel premium," "futuristic content app," "AI studio," or any creative-tool / AI-generation surface (Higgsfield, Runway, Krea, Suno, ElevenLabs, etc.). It complements `frontend-design` — that skill says what NOT to do; this one is a committed aesthetic stance.

### B. Content Factory V2 redesign

| Path                                                            | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `index.html`                                                    | Added Space Grotesk to the existing Google Fonts URL (weights 500/600/700).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `src/index.css`                                                 | New `[data-cfv2="true"]` token block: deeper neutral-cool surface tiers (`#0f1113` bg, `#1c1e20` surface), accent tints (5/12/24/45%), `--display-font: "Space Grotesk", "DM Sans"...`, `--tag-new: #ff005b`. Plus `.higgs-thinking-bar`, `.higgs-orb-running`, `.higgs-skeleton` keyframe utilities + reduced-motion fallbacks.                                                                                                                                                                                                                                                           |
| `src/pages/label/ContentFactoryV2.tsx`                          | Page root sets `data-cfv2="true"` and forces `data-label-theme="dark"` (CFV2 is always a dark canvas, like every premium creative tool). Container max-width 1320 → 1440 with fluid 4vw padding. Header upgraded from 28px DM Sans to clamp(40px, 6vw, 64px) Space Grotesk caps with accent eyebrow. Tabs got 13px caps Space Grotesk treatment, monospace pill counters, 3px underline with accent glow. Active-jobs strip rebuilt as a horizontal "Currently generating" rail of 220px square tiles with breathing accent orbs, diagonal-stripe backdrop, scrim, hover glow.             |
| `src/components/content-factory-v2/ExploreView.tsx`             | Full rewrite. Hero is left-aligned oversized type ("ARTIST CONTENT, AT FACTORY SCALE.") with accent on the second line, two-column layout with 4-tile bento mosaic on the right. Each preset gets a per-format color signature (`PRESET_TINTS` map: cartoon=orange, link_video=hot pink, fan_brief=purple, etc.). Preset tiles are full-bleed 4:5 cards with radial-gradient backdrop, diagonal stripe overlay, large faint icon silhouette, bottom scrim, caps-Grotesk label, top-right LIVE/SOON pill, hover scale + accent border glow. Stagger 50ms / 16px translateY / ease-out-expo. |
| `src/components/content-factory-v2/ReviewView.tsx`              | QueueCard outer: 14px radius, hover translate-y-1 instead of 0.5, accent-soft border + glow when generating. Title: caps Space Grotesk 17px instead of soft DM Sans 15px. Generating chip uses status-orb pulse + monospace label. FilterGroup titles + SubTab buttons converted to caps Space Grotesk with monospace pill counters.                                                                                                                                                                                                                                                       |
| `src/components/content-factory-v2/CartoonPanel.tsx`            | Field labels → 10px caps Space Grotesk eyebrows. "Find leads"/"Run again" button → solid accent fill, 13px caps Space Grotesk, hover glow shadow. LeadHunterProgressPanel rebuilt: monospace "lead-hunter · running" header + ETA pill + `.higgs-thinking-bar` shimmer + grid of `ProgressStat` (caps eyebrow + JetBrains Mono value) + monospace "→ current focus" footer. LeadCard: 14px radius, caps Space Grotesk title, accent glow when selected.                                                                                                                                    |
| `src/components/content-factory-v2/CreateView.tsx`              | `SectionHeader` now uses caps Space Grotesk + bottom border line. `Field` and `TuneGroup` use 10px caps Space Grotesk eyebrow labels.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `src/components/content-factory-v2/LeadHunterRecentPopover.tsx` | "Recent" trigger → 40px height, 13px caps Space Grotesk. Popover surface uses `--surface-2`, 14px radius, `--border-strong`, deeper shadow. Section header is an accent-colored eyebrow. Row titles → caps Space Grotesk 13px.                                                                                                                                                                                                                                                                                                                                                             |
| `src/components/content-factory-v2/SmoothSelect.tsx`            | Popover surface now uses `--surface-2` + `--border-strong` + 14px radius (was hardcoded `#1a1a18`). Selected option gets a 2px accent left-border + accent-soft fill. Hover row uses 5% white tint.                                                                                                                                                                                                                                                                                                                                                                                        |

## Why

Paul wanted Content Factory V2 to _feel_ like https://higgsfield.ai — premium, futuristic, the kind of surface an artist or label exec actually wants to spend time inside. The page worked but read as "internal dashboard," not "AI creative studio."

We answered with two artifacts:

1. **The skill** is the long-term win. Future sessions can apply this design language anywhere — A&R Pipeline, Sound Intelligence, future creative tools — without re-deriving the moves. It also sits alongside `frontend-design` so both load when working on creative-tool surfaces.
2. **The CFV2 redesign** is the immediate proof. Same information architecture (Explore / Create / Assets), same React Query persistence + Lead Hunter logic, but reskinned with Higgsfield's language: dense bento, oversized uppercase Space Grotesk, deep neutral-cool darks, full-bleed content tiles, choreographed motion, breathing AI-state pulses.

We deliberately kept Wavebound burn orange (`#f25d24`) instead of switching to chartreuse — the brand stays, the energy upgrades. We also scoped the redesign to CFV2 only via `[data-cfv2="true"]` so the rest of the dashboard is untouched, and forced dark theme on this route only (creative tools live in dark canvases).

## What was tested

- `npx tsc --noEmit` — clean.
- `npm run build` — clean (11.02s). CFV2 chunk is 150KB / 40.7KB gzipped — same order as before.
- Skill format: confirmed by Claude Code's skill loader that `higgsfield-aesthetic` registered and is now in the available-skills list with its trigger description.
- Logic untouched: React Query polling, localStorage active-job persistence, Lead Hunter recent popover, asset filters, tab-switch persistence — all intact (purely visual changes).

## What to verify in browser

Run `npm run dev` and walk into `/label/<labelId>/content-factory-v2`. Check:

1. **Page shell**:
   - Forces dark theme on entry; restores on exit (toggle theme elsewhere, return — should be dark again here).
   - Header is oversized uppercase Space Grotesk with accent eyebrow.
   - Tab nav has caps labels, 3px accent underline that morphs across tabs (Framer `layoutId`), monospace counter pills.

2. **Explore tab**:
   - Hero: oversized headline ("ARTIST CONTENT, AT FACTORY SCALE.") with the second line in accent orange. Two CTAs ("Start a story" / "Browse formats") below.
   - Right-side 4-tile bento mosaic — tiles fade up + scale in on mount with stagger.
   - Live preset cards (Story / Lyric Overlay / Fan brief): 4:5 aspect, full-bleed gradient + faint icon silhouette + caps label, "Live" pill top-right. Hover scales 1.02 + accent border glow.
   - Coming-soon cards: dimmer, "Soon" pill in white-on-dark glass.

3. **Active-jobs rail** (kick off a fan-brief job to populate):
   - Rail of 220px square tiles, status orb pulses on the accent, hover lifts with accent border glow.
   - "Currently generating · N" eyebrow in accent caps.

4. **CartoonPanel** (Create → Story preset):
   - Field labels are tight caps eyebrows.
   - "Find leads" button: solid orange, caps Space Grotesk, 40px tall. Hovering shows accent glow.
   - Click "Find leads" → progress panel: monospace "lead-hunter · …", ETA pill, gradient shimmer bar, three `ProgressStat` blocks, monospace "→ current focus" line. Status orb breathes.
   - Lead cards: caps headline, accent border + glow when selected.

5. **Recent popover**:
   - Trigger button is the same caps Space Grotesk treatment as "Find leads," ghost variant.
   - Popover has rounded surface-2 background, accent eyebrow header, caps row titles.

6. **Assets tab**:
   - QueueCards have 14px radius, hover lift, caps title; running cards have an accent glow ring.
   - Generating chip: monospace "Generating" with breathing orb (replaces the old spinning loader chip).
   - Filter sidebar: section headers in tight-tracked caps Space Grotesk; SubTab Pending/Scheduled buttons with caps + monospace counters.

7. **Reduced motion**: toggle macOS "Reduce motion" — pulses + shimmer fall back to opacity-only/static states; tab transitions snap.

## Out of scope (mention to the user, don't implement)

- Light theme variant of the CFV2 aesthetic. The token block is dark-only this pass. A "paper" variant is sketched in `reference/color.md` if we ever want it.
- Real video previews in the hero mosaic — currently uses per-preset gradient + faint icon as the placeholder. Once we wire `cf_jobs` (`status='complete'`) into the mosaic, the four tiles will autoplay muted recent renders.
- Applying the aesthetic to A&R Pipeline, Sound Intelligence, etc. We intentionally scoped to CFV2.

## "While I was in here" recommendations (ranked by user impact)

1. **Real recent renders in the hero mosaic.** The four bento tiles in `ExploreView` currently use color-coded gradients. Swap to autoplaying muted previews of the four most recent successful runs (`cf_jobs` + `cartoon_scripts` where `status='complete'`, ordered by `completed_at desc`). One query, four `<video autoplay loop muted>` tags. Single biggest "wow" upgrade left.
2. **Apply to A&R Pipeline next.** The bento + content-tile recipe maps directly onto prospect cards. Each prospect tile becomes a full-bleed artist photo + caps name + scoring chips — same visual energy, applied to a surface that today reads as a spreadsheet. The skill is set up to trigger automatically.
3. **Add Space Grotesk to the global token system.** Even without restyling other pages, exposing `var(--display-font)` outside `[data-cfv2="true"]` lets any future page opt-in by setting one CSS variable, no font re-import.
4. **CartoonPanel "generating state" full panel.** Today the lead-hunter progress panel got the Higgsfield treatment; the cartoon-script + image-render generation states still use the older inline progress text. Same status-panel recipe (mono name + ETA pill + thinking bar + log lines) would unify the feel.
5. **Storybook / Figma export of the new tokens.** With the aesthetic locked into CSS variables, a one-pager of "the CFV2 design system" makes onboarding the next designer or hand-off to a contractor trivial.
