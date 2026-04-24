# The Vault — Table Scroll Fix

## What changed

- `src/pages/label/ArtistDatabase.tsx` — made the table wrapper a flex column
  (`display: flex, flexDirection: column, minHeight: 0`) and dropped the
  redundant `overflow: hidden` (the child DatabaseTable now owns scrolling).

## Why

Paul reported he couldn't scroll past the visible rows in The Vault (45k
artists, 50 per page default). Inside the page the height chain was:

1. Page root — flex column, `overflow: hidden`, correct
2. Header — auto height, correct
3. Table wrapper — `flex: 1, overflow: hidden` on a **block** div
4. `DatabaseTable` root — `flex: 1, overflow: auto`

The bug: the table wrapper was a block container, so the child's `flex: 1`
was ignored. `DatabaseTable` grew to its content height (~1600px for 50
rows) and the wrapper clipped it with no scrollbar. Making the wrapper a
flex column propagates the allocated height to `DatabaseTable`, which then
overflows and shows a scrollbar as intended. `minHeight: 0` is the standard
override for the flex-child implicit `min-height: auto` that otherwise lets
children push past the container.

## What was tested

- `npx tsc --noEmit` — clean
- Grepped other label pages for the same pattern (`flex: 1` children in
  block parents). None share the bug — other `flex: 1` usages are inside
  already-flex parents or don't involve scroll containers.

## What to verify in browser

- `/label/database` — scroll through all 50 rows on page 1
- Horizontal scroll still works (wide table with sticky first column)
- Sticky header row stays pinned while vertical scrolling
- Page size switcher (50/100/250/500) — scrolls the larger sets cleanly
- Mobile viewport — page still lays out (sidebar sheet mode)

## While I was in here

Nothing else jumped out in `ArtistDatabase.tsx`. The file already uses the
legacy dark-only tokens (`#1C1C1E`, `#2C2C2E`, hardcoded whites) — a
separate migration to the `var(--ink)` / `var(--surface)` token system
would light-theme The Vault, but that's a deliberate separate task, not an
obvious polish fix to bundle here.
