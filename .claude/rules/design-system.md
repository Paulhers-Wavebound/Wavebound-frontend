# Design System — Wavebound Label Dashboard

The label dashboard uses a **token-based theme** driven by the `[data-label-theme]` attribute. Both light (cream paper) and dark (near-black) variants are defined in `src/index.css`; components reference tokens by CSS variable so the same markup works in either theme.

> **Always reference tokens via `var(--token)`, never hardcode hex.** The palette below lists current values for reference, not for copying into components.

## Label theme tokens

Defined in `src/index.css` under `[data-label-theme="light"]` and `[data-label-theme="dark"]`.

### Surface / ink (light → dark)

```
--bg             #fafaf9 → #111110   Page background (cream → near-black)
--bg-subtle      #f3f3f1 → #1a1a18   Subtle panel fill
--surface        #ffffff → #1e1e1c   Cards, elevated content
--surface-hover  #f5f5f3 → #2a2a27   Hover / active surface
--ink            #1a1a18 → #ededeb   Primary text
--ink-secondary  #6b6b66 → #a3a39e   Secondary text, labels
--ink-tertiary   #a3a39e → #6b6b66   Tertiary, timestamps, meta
--ink-faint      #d4d4d0 → #4a4a46   Placeholder / disabled
--border         #e5e5e2 → #2e2e2b   Card / divider
--border-hover   #d4d4d0 → #3d3d39   Hovered border
--card-edge      rgba(0,0,0,0.04) → rgba(255,255,255,0.04)   Top highlight on cards
```

### Accent

```
--accent         #f25d24   Wavebound burn orange (both themes)
--accent-light   #fff0e8 → #2a1a10   Accent-tinted background
--accent-hover   #e04d15 → #ff6b35   Accent hover
```

Use accent **only** for primary CTAs, active nav, and key data highlights. Max ~3 accent uses per viewport.

### Semantic

```
--green / --green-light    Success, positive delta
--yellow / --yellow-light  Warning, pending, attention
--red / --red-light        Destructive, error
```

### Overlays & charts

```
--overlay-hover, --overlay-subtle, --overlay-active   Generic hover tints
--chart-grid           Recharts grid stroke
--chart-tooltip-bg     Recharts tooltip fill
--chart-tooltip-border Recharts tooltip border
```

### Shadows (light only — dark theme uses none)

```
--shadow-sm, --shadow-md, --shadow-lg
```

### Radius

```
--radius     14px   (Tailwind `rounded-lg`)
--radius-sm  8px    (Tailwind `rounded-md`)
```

## Typography

Three font families in active use:

- **DM Sans** — UI default, set inline: `font-['DM_Sans',sans-serif]` or `style={{ fontFamily: '"DM Sans", sans-serif' }}`
- **JetBrains Mono** — numerics, timestamps, code: `font-['JetBrains_Mono',monospace]`
- **Tiempos Text** — editorial / brief body copy only (Morning Brief, marketing surfaces)

`index.css` defines a `@font-face` for Tiempos Text; DM Sans and JetBrains Mono load from Google Fonts in `index.html`.

## Component conventions

- **Cards** — `rounded-2xl overflow-hidden` with `background: var(--surface)` and `borderTop: "0.5px solid var(--card-edge)"`. No heavy borders; depth comes from surface contrast + the thin top highlight.
- **Section headers** — 13px, `font-medium`, `uppercase`, `tracking-wide`, color `var(--ink-secondary)`.
- **Stat values** — 22–28px, `font-semibold`, color `var(--ink)`.
- **Tags / chips** — `px-2.5 py-1 rounded-lg text-[11px] font-semibold`. Always colored bg with 12% alpha + solid text color.
- **Status badges** — same size as tags, add `uppercase tracking-wide`.
- **Buttons** — `h-10 rounded-[10px]`. Primary: solid accent / solid green. Secondary: transparent bg with `border: 1px solid var(--border)`.
- Use shadcn `<Badge>`, `<Card>`, `<Table>`, `<Tabs>`, `<Dialog>` before hand-rolling equivalents.

## Chart rules (Recharts)

- `stroke="var(--chart-grid)"` for grid lines
- Tooltip uses `var(--chart-tooltip-bg)` + `var(--chart-tooltip-border)`
- Axis labels: `var(--ink-secondary)` or `var(--ink-tertiary)`, never `var(--ink)`
- Wrap every chart in `<ResponsiveContainer>`
- Animate on mount only; don't re-animate on data refresh (set `isAnimationActive={false}` for live-polling charts)

## Tailwind + CSS variable pattern

The codebase uses a deliberate **hybrid**: Tailwind for layout / spacing / sizing / borders / transitions; inline `style={}` for color tokens, backgrounds, and `fontFamily` (since the theme tokens aren't registered as Tailwind colors).

Good:

```tsx
<div
  className="flex items-center gap-2 px-4 py-3 rounded-xl transition-colors"
  style={{ background: "var(--surface)", color: "var(--ink)" }}
>
```

Not good (hardcoded colors):

```tsx
<div className="bg-[#ffffff] text-[#1a1a18]">
```

Also not good (inline layout that Tailwind would own):

```tsx
<div style={{ display: "flex", gap: 8, padding: "12px 16px" }}>
```

## Anti-patterns

- ❌ Hardcoded hex colors — always reference tokens
- ❌ Pure `#ffffff` / `#000000` text — use `--ink` and `--bg`
- ❌ Heavy drop shadows on surfaces (dark theme especially — depth comes from surface tiers)
- ❌ Gradient card backgrounds (gradients are reserved for marketing / landing surfaces)
- ❌ Tailwind arbitrary values + CSS variables on the same property (pick one)
- ❌ `className="text-white/55"` mixed with `style={{ color: "var(--ink-secondary)" }}` — the second one themes, the first one doesn't

## Legacy note

Older components (pre-March 2026) reference a dark-only palette with `--L0` / `--L1` / `--L2` / `--L3` tokens. Those tokens no longer exist. When touching a legacy file, migrate it to the current tokens above.
