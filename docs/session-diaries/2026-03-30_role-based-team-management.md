# Session: Role-Based Team Management (Admin/Member/Viewer)

**Date:** 2026-03-30

## What Changed

### Database
- Added `label_role` column to `user_profiles` (text, constrained to 'admin'/'member'/'viewer')
- Created `trg_set_default_label_role` trigger — auto-sets 'member' when a user gets a label_id, clears role when label_id removed
- Updated `get_label_members(uuid)` RPC — now returns `label_role`, sorted by role (admins first)
- Created `update_label_member_role(uuid, uuid, text)` RPC — changes a member's role within a label
- Created `remove_label_member(uuid, uuid)` RPC — removes a member by clearing their label_id and label_role
- Backfilled all 7 existing label users to 'admin' role
- Added RLS policies to labels table (5 policies: service role full, member read own, admin read all, admin update, anon lookup by invite code)
- Synced local migration history with remote (83 stub files, `db push` now works)
- Regenerated Supabase types (6492 lines, includes label_role + new RPCs)

### New Files
- `src/hooks/useLabelPermissions.ts` — Returns `{ role, canManage, canEdit, canView }`. Global admins always get full perms.
- `src/pages/label/LabelHelp.tsx` — Help/support page with FAQ and contact cards
- `supabase/migrations/` — 83 stub files syncing with remote history

### Modified Files
- `src/pages/label/LabelSettings.tsx` — Full rewrite: role badges on team members, role dropdown (admin can change roles), remove member button, role legend, all admin actions gated behind `canManage`
- `src/pages/label/LabelDashboard.tsx` — "Add Artist" button gated behind `canEdit` (hidden from viewers)
- `src/pages/label/LabelArtistProfile.tsx` — Danger zone (remove artist) gated behind `canManageLabel`
- `src/components/label/LabelSidebar.tsx` — Settings + Help buttons now navigate, active states, fixed `.then()` fetch pattern
- `src/App.tsx` — Added routes: `/label/settings`, `/label/help`
- `src/integrations/supabase/types.ts` — Regenerated twice (new tables, RPCs, label_role column)
- ~20 files — Removed all `(supabase.from as any)` casts

## Role Permissions Matrix

| Action | Admin | Member | Viewer |
|--------|-------|--------|--------|
| View dashboard + analytics | Yes | Yes | Yes |
| Add artists | Yes | Yes | No |
| Remove artists | Yes | No | No |
| Run Sound Intelligence | Yes | Yes | No |
| Edit label settings | Yes | No | No |
| Manage team roles | Yes | No | No |
| Remove team members | Yes | No | No |

## What Was Tested
- `npx tsc --noEmit` — clean
- `update_label_member_role` RPC — tested changing Columbia test user to 'member', verified sort order, reverted to 'admin'
- `get_label_members` — verified returns label_role, sorts by role
- Default trigger — fires on INSERT/UPDATE, sets 'member' when label_id is set
- RLS policies on labels — anon lookup by invite code works, service role full access works
- `supabase db push` — "Remote database is up to date"

## What to Verify in Browser
- Settings page: role badges (Admin/Member/Viewer) next to each team member
- Click a role badge → dropdown to change role (Admin/Member/Viewer) + Remove option
- Change a test user to Viewer → they should NOT see Add Artist on dashboard
- Change back to Admin → full access restored
- New signups via invite code → should get 'member' role by default
- Help page loads at /label/help, sidebar links work
