# Add Audit Log for Artist Deletion

**Priority: Medium** — once an artist is deleted via `delete-artist`, there
is no record of who did it, when, or what was removed. For a destructive
irreversible operation run from a web UI, that's a compliance gap.

**Found:** 2026-04-16 during delete-artist audit.

## What to build

A new `artist_deletion_log` table that records every invocation of the
`delete-artist` edge function, successful or not.

```sql
CREATE TABLE artist_deletion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_by_user_id uuid NOT NULL REFERENCES auth.users(id),
  deleted_by_email text,
  label_id uuid NOT NULL,
  artist_handle text NOT NULL,
  artist_name text,
  deletions jsonb NOT NULL,   -- the full deletions[] array from the function
  errors jsonb,               -- null if clean, array if partial failure
  success boolean NOT NULL,
  ip_address text,
  user_agent text
);

CREATE INDEX idx_artist_deletion_log_label ON artist_deletion_log (label_id, created_at DESC);
CREATE INDEX idx_artist_deletion_log_handle ON artist_deletion_log (artist_handle);
```

RLS: label admins can read their own label's entries, super-admins can
read all. No INSERT / UPDATE / DELETE from the client — the edge function
writes with service-role only.

## Edge function changes

In `edge-functions/delete-artist.ts`, after all deletions run:

1. Capture `req.headers.get('user-agent')` and
   `req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()` early in the
   handler.
2. After the deletions array is finalized, insert into
   `artist_deletion_log` with the full payload regardless of
   success/failure.
3. Do the audit-log insert with a separate `try/catch` so a logging
   failure does not mask the actual deletion outcome.

This should be part of the same PR as the delete-artist rewrite (see
`2026-04-16_delete-artist-rewrite.md`) since both touch the same file.

## Frontend follow-up (not urgent)

Once the table exists, add a read-only "Deletion history" view to the
label admin area so Paul / label admins can audit past removals. Separate
session — flag when ready and I'll build the UI.

## Test plan

1. Run a delete against a throwaway artist, verify one row is inserted
   into `artist_deletion_log` with all fields populated.
2. Confirm RLS: log in as a non-admin label user and verify they only see
   their own label's entries.
3. Temporarily break a table delete, confirm the audit row still gets
   written with `success: false` and the errors array populated.
