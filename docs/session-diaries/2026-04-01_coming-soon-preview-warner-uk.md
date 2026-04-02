# Coming Soon Preview State — Warner UK

## What changed

**New files created (13):**

- `src/config/previewFeatures.ts` — maps label_id → preview feature list
- `src/hooks/usePreviewFeatures.ts` — hook for checking preview state
- `src/components/coming-soon/ComingSoon.tsx` — reusable glass overlay wrapper
- `src/components/coming-soon/PreviewGate.tsx` — conditional render: preview vs real page
- `src/components/coming-soon/mocks/SoundIntelligenceMock.tsx` — full mock UI (charts, tables, stats)
- `src/components/coming-soon/mocks/PaidAmplificationMock.tsx` — campaign detection, paid/organic split
- `src/components/coming-soon/mocks/ExpansionRadarMock.tsx` — market growth, niche penetration
- `src/components/coming-soon/mocks/FanBriefsMock.tsx` — AI briefs, clip library, sentiment
- `src/pages/label/previews/PreviewPageShell.tsx` — shared page shell with Coming Soon badge
- `src/pages/label/previews/SoundIntelligencePreview.tsx`
- `src/pages/label/previews/PaidAmplificationPreview.tsx`
- `src/pages/label/previews/ExpansionRadarPreview.tsx`
- `src/pages/label/previews/FanBriefsPreview.tsx`

**Modified files (2):**

- `src/App.tsx` — 4 routes wrapped with PreviewGate
- `src/components/label/LabelSidebar.tsx` — getMainNav accepts labelId, shows Paid Amplification for preview labels

## Why

Warner UK portal shipping tonight. 4 features (Sound Intelligence, Paid Amplification, Expansion Radar, Fan Briefs) aren't ready but need to look impressive as locked previews.

## Architecture decisions

- **PreviewGate pattern**: Routes render real pages by default, preview pages only for labels in the PREVIEW_FEATURES config. Zero impact on existing labels.
- **Label-scoped**: Warner UK label_id `644cb655-3fa3-4f29-b716-d4f1fce3243c` is the only entry. Adding more labels is one line in previewFeatures.ts.
- **No live code touched**: Existing page components untouched. Only App.tsx routing and sidebar nav received minimal changes.

## What was tested

- `npx tsc --noEmit` — clean, zero errors
- `npx vite build` — succeeds, 8.34s

## What to verify in browser

1. Log in as Warner UK user → all 4 nav items visible, each shows glass overlay with impressive mock data
2. Log in as any other label (Columbia, etc.) → features work exactly as before, no visual changes
3. Coming Soon badge pulses subtly in page header top-right
4. Glass overlay prevents all interaction — no clicks, no hovers pass through
5. Mock charts animate on mount
6. Mobile responsive — sidebar shows all 4 features for Warner UK

## While I was in here

1. **Warner UK needs a user account** — the label exists (`644cb655-3fa3-4f29-b716-d4f1fce3243c`) but you'll need to create a user with that label_id to demo it
2. **Bundle size** — the main index chunk is 4MB (gzipped 1.1MB). GeoMap3D alone is 845KB. Consider lazy-loading more pages.
3. **Mock data is static** — if Warner UK becomes a real client later, you'll want to remove their label_id from PREVIEW_FEATURES so they get real features
4. **Paid Amplification in sidebar** — currently admin-only for other labels. Warner UK preview bypasses this. If you want other labels to also see it, remove the admin gate.
5. **"Coming Soon" text in existing nav items** — the sidebar already has a "Soon" label system for items without paths. The preview system is separate and independent.
