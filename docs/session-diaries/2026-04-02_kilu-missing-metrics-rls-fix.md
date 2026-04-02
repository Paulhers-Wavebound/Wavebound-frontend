# RLS Overhaul — Admin Bypass + Warner Exec Onboarding

**Date:** 2026-04-02

## What changed

### Database — `is_admin()` helper function

- New `SECURITY DEFINER` function wrapping `(SELECT auth.uid())` for per-query caching
- Used by all admin-bypass policies — single source of truth

### Database — 6 new admin-bypass RLS policies

All use `(SELECT is_admin())`:

- `roster_dashboard_metrics`, `artist_alerts`, `artist_rag_content`
- `content_catalog`, `content_segments`, `fan_briefs`

### Database — 3 fixed label member RLS policies

Replaced restrictive policies (required `user_artist_links` or `account_type = 'admin'`) with simple label_id match:

- `roster_dashboard_metrics`: "Label members see own label metrics"
- `artist_intelligence`: "Label members see own label artists"
- `artist_alerts`: "Label users see own label alerts" (also fixed `user_profiles.id` → `user_profiles.user_id` bug)

### Database — Warner Music UK activation

- `labels.is_active` set to `true` (was `false`)
- `user_artist_links` row added for kilusmind + Paul

### Frontend

- `AddArtistModal.tsx`: Creates `user_artist_links` on artist add

## Why

1. Kilu showed "–" for Last Post/Performance — `roster_dashboard_metrics` had no admin-bypass RLS policy
2. A fresh Warner exec signing up would see **zero data** — member policies required `user_artist_links` entries that don't exist for new users
3. `artist_alerts` label policy used wrong column (`user_profiles.id` vs `user_profiles.user_id`)

## What was tested

- `npx tsc --noEmit` — clean
- **Simulated fresh Warner member** (no admin role, no artist links): sees 1 metric, 1 intel record, 11 alerts
- **Cross-label isolation verified**: Warner member sees 0 Soulbound rows
- **Invite code tested via API**: `INVALID-CODE` → rejected, `WARNE2W-2026` → accepted with `label_name: "Warner Music UK"`
- **Test user cleaned up** after API test
- **10/10 verification checklist** passed (label active, trigger exists, all policies created, edge fn active)

## What to verify in browser

- Kilu should show "6d ago" and "0.7x" on the Warner dashboard
- Warner exec can sign up at `/join/WARNE2W-2026`, see dashboard with Kilu's data
- Warner exec cannot see Soulbound data

## Exec onboarding instructions

The Warner exec should:

1. Go to `https://[your-domain]/join/WARNE2W-2026`
2. Enter email + password → "Create Account"
3. They'll be auto-logged in and redirected to `/label`
4. They'll have `label_role = 'member'` (view + edit, not manage team)
5. To upgrade to label admin: Paul goes to Settings → Team → change their role

## While I was in here

1. **Backend `start-onboarding` should create `user_artist_links`** server-side as a safety net
2. **AddArtistModal stub inserts (lines 66-75)** silently fail via anon client — consider removing since the pipeline recreates them
3. **Consider migrating `artist_intelligence`'s old "Admins read all" policy** to use `is_admin()` for consistency
