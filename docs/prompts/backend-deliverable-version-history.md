# Task: Build Deliverable Version History Backend

Date: 2026-03-30

## What You Need To Do

The frontend has a complete version history UI (drawer, preview modal, revert flow) in the admin plan review tab. But the backend infrastructure doesn't exist yet. Two edge functions and one database table are needed.

## 1. Create `deliverable_versions` Table

```sql
CREATE TABLE deliverable_versions (
  id BIGSERIAL PRIMARY KEY,
  artist_handle TEXT NOT NULL,
  deliverable_type TEXT NOT NULL CHECK (deliverable_type IN (
    'content_plan_7day', 'content_plan_7day_html', 'content_plan_30day',
    'intelligence_report', 'artist_brief'
  )),
  version_number INTEGER NOT NULL,
  content JSONB,
  content_html TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL CHECK (created_by IN ('pipeline', 'pipeline_render', 'human_swap', 'revert')),
  week_of TEXT,
  job_id TEXT,
  notes TEXT
);

CREATE INDEX idx_dv_artist ON deliverable_versions(artist_handle);
CREATE INDEX idx_dv_type ON deliverable_versions(artist_handle, deliverable_type);
CREATE UNIQUE INDEX idx_dv_unique ON deliverable_versions(artist_handle, deliverable_type, version_number);
```

Enable RLS with admin-only access (check `user_roles` for admin role).

## 2. Create `get-deliverable-versions` Edge Function

**Endpoint**: GET with query params

**Actions:**
- `list` — `?artist_handle=X&deliverable_type=Y` (type is optional)
  - Returns `{ versions: DeliverableVersion[], current: Record<string, CurrentDeliverable> }`
  - `current` should check `artist_intelligence` for each type's current content/html and return `{ has_content, has_html, content_size, html_size }`
  - Versions ordered by `created_at DESC`

- `detail` — `?version_id=N`
  - Returns full `DeliverableVersion` including `content` and `content_html`

**Auth**: Require Bearer JWT + admin role check.

## 3. Create `revert-deliverable-version` Edge Function

**Endpoint**: POST

**Body**: `{ version_id, artist_handle, re_render? }`

**Logic:**
1. Fetch the version row by `version_id`
2. Copy current `artist_intelligence` content to a new version row (as backup before overwrite, `created_by: 'revert'`)
3. Write the old version's `content`/`content_html` back to the appropriate column in `artist_intelligence`
4. If `re_render` is true, trigger HTML re-rendering (if applicable)
5. Return `{ status: 'reverted', deliverable_type, restored_version, artist_handle, re_render_triggered }`

**Column mapping** (deliverable_type → artist_intelligence column):
- `content_plan_7day` → `content_plan_html` (the JSON plan)
- `content_plan_7day_html` → `content_plan_html` (rendered HTML)
- `content_plan_30day` → `content_plan_30d_html` or `thirty_day_plan_html`
- `intelligence_report` → `intelligence_report_html`
- `artist_brief` → `artist_brief_html`

**Auth**: Require Bearer JWT + admin role check.

## 4. Hook Into Existing Pipeline

The pipeline (WF-SI synthesis, or the artist research pipeline) should write a version row to `deliverable_versions` every time it updates a deliverable in `artist_intelligence`. This is the critical part — without this, there's nothing to version.

**Where to hook:** Wherever the pipeline writes to `artist_intelligence.content_plan_html`, `intelligence_report_html`, `content_plan_30d_html`, `artist_brief_html` — also insert a row into `deliverable_versions` with `created_by: 'pipeline'` or `'pipeline_render'`.

## Frontend Types (for reference)

```typescript
type DeliverableType = 'content_plan_7day' | 'content_plan_7day_html' | 'content_plan_30day' | 'intelligence_report' | 'artist_brief';

interface DeliverableVersion {
  id: number;
  artist_handle: string;
  deliverable_type: DeliverableType;
  version_number: number;
  content: Record<string, unknown> | null;
  content_html: string | null;
  created_at: string;
  created_by: 'pipeline' | 'pipeline_render' | 'human_swap' | 'revert';
  week_of: string | null;
  job_id: string | null;
  notes: string | null;
}

interface RevertResponse {
  status: 'reverted';
  deliverable_type: string;
  restored_version: number;
  artist_handle: string;
  re_render_triggered: boolean;
}
```

## Frontend Files (already built, do not modify)

- `src/utils/adminVersionHistory.ts` — API client
- `src/components/admin/VersionHistoryDrawer.tsx` — UI drawer
- `src/components/admin/VersionPreviewModal.tsx` — preview modal

## Supabase

- Project ref: `kxvgbowrkmowuyezoeke`
- Deploy pattern: `supabase functions deploy <name> --project-ref kxvgbowrkmowuyezoeke`

## Verification

```bash
# 1. Check table exists
curl -s "https://kxvgbowrkmowuyezoeke.supabase.co/rest/v1/deliverable_versions?select=id&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"

# 2. Test list endpoint
curl -s "https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1/get-deliverable-versions?artist_handle=annemarie" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $USER_JWT"

# 3. Test revert (after seeding a test version)
curl -s -X POST "https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1/revert-deliverable-version" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"version_id": 1, "artist_handle": "annemarie"}'
```
