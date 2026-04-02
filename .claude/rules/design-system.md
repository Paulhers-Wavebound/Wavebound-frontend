# Design System — Wavebound Label Dashboard

## CSS Variables (defined in index.css)
```css
--L0: #000000;        /* Page bg */
--L1: #1C1C1E;        /* Card bg */
--L2: #2C2C2E;        /* Elevated surfaces, hovers */
--L3: #3A3A3C;        /* Tertiary, borders active */
--accent: #e8430a;    /* Burn orange — CTAs, highlights */
--text: rgba(255,255,255,0.87);
--text-secondary: rgba(255,255,255,0.55);
--text-tertiary: rgba(255,255,255,0.30);
--border: rgba(255,255,255,0.06);
```

## Format Colors (for Recharts lines, dots, legends)
```typescript
// v3 canonical format names (April 2026)
const FORMAT_COLORS: Record<string, string> = {
  'Lip Sync / Dance': '#FF453A',
  'Comedy': '#FF6482',
  'POV': '#0A84FF',
  'Talking Head': '#5AC8FA',
  'Tutorial': '#FF9F0A',
  'Reaction': '#BF5AF2',
  'Lyric Overlay': '#e8430a',
  'Aesthetic Edit': '#64D2FF',
  'Transition Edit': '#30D158',
  'Montage': '#7EC8E3',
  'Slideshow': '#AC8E68',
  'Text Story': '#C9B1FF',
  'Concert': '#FFD60A',
  'BTS': '#FFA726',
  'ASMR': '#8E8E93',
  'Pet': '#FFCA28',
  'Food': '#FF8A65',
  'Art': '#DA70D6',
  'Fitness': '#34C759',
};
// See soundIntelligence.ts for full list including legacy backwards-compat mappings
```

## Chart Rules (Recharts)
- Always use dark theme: `stroke="rgba(255,255,255,0.06)"` for grid lines
- Tooltip bg: #1C1C1E with border rgba(255,255,255,0.06)
- No axis labels in pure white — use text-secondary
- ResponsiveContainer wraps every chart
- Animate on mount, don't re-animate on data refresh

## Component Conventions
- Cards: `bg-[#1C1C1E] rounded-xl border border-white/[0.06] p-5`
- Section headers: `text-sm font-medium text-white/55 uppercase tracking-wider mb-3`
- Stat values: `text-2xl font-semibold text-white/87`
- Accent only on: primary CTAs, active states, key data points. Max 3 per viewport.
- Use shadcn `<Badge>`, `<Card>`, `<Table>`, `<Tabs>` before building custom equivalents

## Anti-patterns
- No shadows on dark backgrounds (invisible, creates gray haze)
- No pure white text (#ffffff) — always use opacity values
- No gradient backgrounds — solid elevation tiers only
- No colored backgrounds on cards — L1/L2 only
- Don't mix Tailwind arbitrary values with CSS variables — pick one per property
