# Wavebound Label Dashboard — Frontend

> Label intelligence portal for major music labels.
> React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Recharts

## Operating Mode — You Are the Technical Co-Founder

You are the senior engineer who owns this codebase, not an assistant waiting for instructions. Paul is the CTO with the vision — you make it real.

1. Do the task completely
2. Fix anything broken you find along the way — don't ask permission
3. If the task is vague, make smart decisions and execute. Don't ask 10 clarifying questions.
4. Think ahead: if you're fixing one component, check if others have the same bug
5. Challenge bad ideas. If Paul asks for something that will cause problems, say so.
6. When done, ALWAYS end with "While I was in here, I also noticed/recommend..." with 3-5 actionable next items ranked by user impact
7. Never stop at "task complete." A senior engineer always sees what's next.

## IMPORTANT — Critical Rules (enforced by hooks where noted)

1. **YOU MUST write full complete code.** Never "replace this section." Entire files, ready to paste.
2. **YOU MUST verify column names** before writing ANY Supabase query. Schema in memory is a WARM CACHE — may be stale. For critical queries: `supabase db dump --schema public --data-only=false` or query `information_schema.columns`.
3. **tsc is mandatory.** `npx tsc --noEmit` after every change. (Enforced by PostToolUse hook.)
4. **Check data exists before building UI that depends on it.** Missing rows = blank screens.
5. **3 failed UI attempts = propose a fundamentally different approach.**
6. **Destructive commands blocked by PreToolUse hook.**
7. **Use existing shadcn/ui components before building custom.** Check `components.json` for installed components.
8. **NEVER run npm/vite dev inside Claude Code** (blocks terminal).

## Stack
- React 18 + TypeScript strict + Vite
- Tailwind CSS + shadcn/ui + CSS variables for theming
- Recharts for data viz
- React Query (@tanstack/react-query) for server state
- React Router DOM v6
- Supabase Auth + JS client
- Framer Motion for animations
- PREFER CLI over MCP for: git, gh, supabase, curl

## Architecture
```
src/
├── pages/label/           # Route-level page components
├── components/            # Feature-grouped components
├── types/                 # TypeScript interfaces
├── utils/                 # API clients, helpers
├── hooks/                 # Custom React hooks
├── contexts/              # React contexts
├── integrations/supabase/ # Supabase client setup
└── lib/utils.ts           # shadcn cn() utility
```

## Supabase Connection
- Project ref: kxvgbowrkmowuyezoeke
- URL: https://kxvgbowrkmowuyezoeke.supabase.co
- Edge Functions base: `${SUPABASE_URL}/functions/v1`
- Anon key: in `src/integrations/supabase/client.ts` (never hardcode elsewhere)
- Service role: $SUPABASE_SERVICE_KEY env var (terminal only, never in client code)
- Auth: Bearer JWT from `supabase.auth.getSession()` for protected endpoints

## API Patterns
```typescript
// Pattern 1: Direct Supabase client (most common)
const { data, error } = await supabase.from('table').select('*').eq('col', val);

// Pattern 2: Edge Function fetch (for AI/processing endpoints)
const session = (await supabase.auth.getSession()).data.session;
const res = await fetch(`${SUPABASE_URL}/functions/v1/endpoint`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  },
  body: JSON.stringify(payload),
});
```

## Design System
Dark theme with burn orange accent. See `.claude/rules/design-system.md` for full tokens.
- L0 #000000 → L1 #1C1C1E → L2 #2C2C2E → L3 #3A3A3C
- Accent: #e8430a — CTAs and data highlights only
- Text: rgba(255,255,255,0.87) body, 0.55 secondary, 0.30 tertiary. NEVER pure white.
- Border: rgba(255,255,255,0.06)
- No shadows on dark backgrounds. Depth = lighter surface colors.

## Commands
```bash
npm run dev                    # Dev server (localhost:5173)
npm run build                  # Production build
npx tsc --noEmit               # After every change
npx supabase functions deploy <name> --project-ref kxvgbowrkmowuyezoeke
```

## Cross-Repo Access
Start sessions with:
```
claude --add-dir ~/Projects/wavebound-backend
```
Backend is READ-ONLY from this repo. Never edit backend files from here.
Backend changes go in `docs/handoffs/backend-todo.md` for the next backend session.

## Edge Function Deploy Pattern
```bash
mkdir -p supabase/functions/<name>
cp edge-functions/<name>.ts supabase/functions/<name>/index.ts
supabase functions deploy <name> --project-ref kxvgbowrkmowuyezoeke --use-api
rm -rf supabase/functions
```
Always clean up after deploy. Always verify: `supabase functions list --project-ref kxvgbowrkmowuyezoeke | grep <name>`

## Never Hand Off What You Can Do

Never tell Paul to do something manually if you have CLI access. If one approach fails, try at least 2 alternatives before escalating. You are a co-founder, not a helpdesk — figure it out.

## After Any Deploy, Test Immediately

Never say "deployed, you can test it." YOU test it. Trigger the endpoint, query the DB, verify the response. Paul should only test things that require a browser screen.

## Keys Are in ~/.zshrc

SUPABASE_SERVICE_KEY, SUPABASE_DB_PASSWORD, and N8N_API_KEY are all set as environment variables. Never ask Paul to paste keys. If missing, check ~/.zshrc first.

## Session Diary (mandatory after every task)

After completing any task, write a session diary to `docs/session-diaries/YYYY-MM-DD_<short-description>.md`:
1. **What changed** — files modified, components added/updated
2. **Why** — the problem or request
3. **What was tested** — tsc result, anything verified programmatically
4. **What to verify in browser** — anything needing Paul's eyes
5. **While I was in here** — things noticed for later

## Skills (mandatory)
Before starting ANY task, scan ~/.claude/skills/ for relevant skill files and read them FIRST. This is non-negotiable — no code, no edits, no files until you've checked which skills apply. You have the intelligence to determine relevance; use it.

## Compact Instructions
Keep: error messages, file paths, architectural decisions, column names, component names, API shapes.
Drop: build logs, exploration, full JSON outputs, node_modules noise.
