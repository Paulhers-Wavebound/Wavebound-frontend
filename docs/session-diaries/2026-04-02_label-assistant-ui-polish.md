# Label Assistant UI Polish — Terminal Intelligence Redesign

**Date:** 2026-04-02

## Follow-up fixes (same session)

### 1. ContentAssistant (artist chat) purple → orange

- `src/pages/ContentAssistant.tsx` — Changed accent from `#8B5CF6` to `#e8430a`, accentHover from `#A78BFA` to `#ff5722`

### 2. Source tag persistence via localStorage

- `src/pages/label/LabelAssistant.tsx` — Source badges now survive session switches and page reloads. Stored in `localStorage` under `wavebound_label_sources` key. Loads on session switch, saves on stream completion.

### 3. Inline source citation support

- `src/components/chat/MessageList.tsx` — Added `SourceTagReplacer` component: scans rendered HTML for `[Roster Data]`, `[Artist KB]`, `[Viral DB]`, `[Sound Intel]`, `[Alerts]`, `[Web]` patterns and renders as styled inline badges.
- `src/index.css` — Added `.inline-source-tag` CSS class (small, muted, monospace pill).
- `docs/handoffs/backend-todo.md` — Added handoff note with exact system prompt addition for `label-chat.ts` to have Claude include inline source tags.

### 4. Keyboard shortcut Cmd+Shift+O → new conversation

- `src/pages/label/LabelAssistant.tsx` — Global keydown listener. Works on both Mac (Cmd) and Windows (Ctrl).

### 5. Code-split heavy routes with React.lazy

- `src/App.tsx` — Lazy-loaded 9 heavy pages: LabelAssistant, SoundIntelligenceOverview, SoundIntelligenceDetail, LabelAmplification, LabelArtistProfile, LabelFanBriefs, ContentAssistant, TikTokAudit, LabelExpansionRadar.
- **Main bundle reduced from 4,213 KB → 2,838 KB (33% smaller, ~394 KB less gzipped)**. Heavy pages load on demand.

## What changed (original pass)

### Files modified:

- `src/index.css` — Replaced all purple accent colors (#8b5cf6, #a78bfa, #c4b5fd) with orange (#e8430a) in streamdown markdown styles (links, list markers, code, blockquotes). Removed outer border from tables. Added mobile horizontal scroll for tables. Added shimmer keyframe animation.
- `src/components/chat/ToolStatusCard.tsx` — Complete rewrite. Now renders as compact inline monospace lines (one per tool). Search icon + spinner for active, green checkmark for done. No card borders. Exports `SOURCE_LABELS` for source citation mapping.
- `src/components/chat/ChatInput.tsx` — Fixed accent from purple to orange throughout (focus glow, send button, hover states). Added Escape to clear input. Added iOS safe-area-inset-bottom padding. Capped textarea at 4 lines.
- `src/components/chat/MessageList.tsx` — Major redesign. Assistant messages: full-width, no bubble/card, generous 32px spacing. User messages: right-aligned with subtle bg-white/5. Added source citation tags (tool badges at top of response). Added hover-only copy button with toast. Replaced bouncing dots with skeleton shimmer for pre-first-token loading. Removed timestamps and vote buttons for cleaner look.
- `src/pages/label/LabelAssistant.tsx` — Integrated `use-stick-to-bottom` for spring-based auto-scroll. Added per-message source tracking (captures tool names before clearing). Mobile viewport height with iOS top-bar offset. Sidebar polish: relative timestamps, MessageSquare icon for "New conversation", tighter spacing. Welcome screen: larger title, all suggestion icons use accent color, hover effects. Removed double-wrapper around ChatInput.

### Design system alignment:

- All chat accent colors now use #e8430a (burn orange) instead of purple
- Dark theme tokens consistent with portal (L0-L3 scale)
- Tables render without outer border, monospace font, clean row separators

## Why

The label chat (Intelligence page) felt like a bolted-on chatbot rather than a premium Bloomberg-terminal-style data tool. This polish pass brings it in line with the portal's design language and makes it feel like a first-class feature.

## What was tested

- `npx tsc --noEmit` — clean, zero errors
- `npm run build` — production build succeeds (8.53s)
- Purple color audit: confirmed all chat-related purple references eliminated (remaining purple in unrelated files like TikTokAuditDashboard, ContentAssistant — intentional, not in scope)

## What to verify in browser

1. **Message layout** — Assistant messages should be full-width with no bubble. User messages right-aligned with subtle dark background.
2. **Tool status** — When Claude calls tools, compact monospace lines should appear above the response (search icon + spinner, then green check)
3. **Source citations** — After tools complete, "Sources: Roster Data, Artist KB" etc. badges should appear at top of assistant response
4. **Streaming cursor** — Block cursor blinks at end of streaming text
5. **Copy button** — Hover over assistant message → clipboard icon top-right. Click → toast "Copied to clipboard"
6. **Follow-up pills** — Appear after last assistant message, disappear when user sends next message
7. **Welcome screen** — Brain icon in orange, suggestion chips with orange icons, hover effects
8. **Sidebar** — Relative timestamps ("2 hours ago"), MessageSquare icon, clean spacing
9. **Mobile** — Sidebar opens as Sheet, input stays above keyboard, tables scroll horizontally
10. **Input focus** — Orange glow ring on focus instead of purple
11. **Markdown rendering** — Links in orange, list markers in orange, code highlights in warm orange, blockquote borders in orange

## While I was in here

1. **ContentAssistant (artist chat) still uses purple** — `/src/pages/ContentAssistant.tsx` has `accent: "#8B5CF6"`. Should be migrated to orange for consistency when that page is touched next.
2. **Conversation memory/persistence** — The chat doesn't persist source tags across page reloads (tool badges only show for the current session). Could store in DB alongside messages for historical reference.
3. **Inline source citations** — Currently showing tool badges at TOP of response. Next iteration could parse the response and place `[Roster Data]` inline after data-heavy claims for higher trust signal.
4. **Keyboard shortcut Cmd+N** — Not implemented (browser intercepts). Could use Cmd+Shift+N or a custom combo via a global key listener.
5. **Bundle size warning** — The main chunk is 4.2MB (1.2MB gzipped). The GeoMap3D chunk (845KB) and the main index chunk are the biggest offenders. Consider code-splitting the assistant page and other heavy routes.
