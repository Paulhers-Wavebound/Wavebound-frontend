# Component Architecture — Wavebound Frontend

## File Organization
- Pages in `src/pages/label/` — one file per route
- Feature components in `src/components/<feature-name>/` — grouped by feature, not by type
- Shared/reusable components in `src/components/ui/` (shadcn managed)
- Types in `src/types/<feature>.ts` — co-located with feature
- API clients in `src/utils/<feature>Api.ts` — typed fetch wrappers
- Custom hooks in `src/hooks/` — `use-<name>.ts` kebab-case

## Routing (React Router v6)
- Label routes under `/label/*`
- Sound Intelligence: `/label/sound-intelligence` (overview) + `/label/sound-intelligence/:jobId` (detail)
- Protected routes check Supabase session — redirect to login if null
- Use `useNavigate()` for programmatic nav, `<Link>` for declarative

## State Management
- **Server state**: React Query only. No useState for API data.
- **UI state**: useState/useReducer local to component
- **Global UI state**: React Context (auth, sidebar, theme) — keep minimal
- **URL state**: useSearchParams for filters/pagination that should survive refresh

## TypeScript
- All API responses typed in `src/types/`
- No `any` — use `unknown` + type guards if shape is uncertain
- Export interfaces, not types, for object shapes (convention)
- Zod validation at API boundaries if needed

## Naming
- Components: PascalCase (`SongTimestampHeatmap.tsx`)
- Hooks: camelCase with `use` prefix (`useSoundAnalysis.ts`)
- Utils: camelCase (`soundIntelligenceApi.ts`)
- Types: PascalCase interfaces (`SoundAnalysis`, `FormatBreakdown`)
- CSS classes: Tailwind utilities, never custom CSS unless absolutely necessary
