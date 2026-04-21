# Add `rendered_clip_path` column to `fan_briefs`

**Priority: Low** — frontend works without it today via URL parsing.

**Found:** 2026-04-20 during Fan Briefs cleanup pass.

## Context

When a Fan Brief is approved, the render pipeline uploads a 9:16 MP4 to the
`fan-briefs` storage bucket and writes the resulting public/signed URL to
`fan_briefs.rendered_clip_url`. The frontend needs the **storage path**
(not the URL) when a social manager removes a clip, so it can call
`supabase.storage.from('fan-briefs').remove([path])`.

Before today the frontend reconstructed the path from the convention
`${artist_handle}/rendered/${briefId}.mp4`. As of this session the frontend
**derives the path by parsing the URL** (`/fan-briefs/([^?]+)`), which works
for both public and signed URL shapes and is robust to backend layout
changes.

That still leaves URL parsing in the client. The honest fix is to store the
path explicitly.

## What to do

Add a `rendered_clip_path text` column to `fan_briefs`. The render pipeline
(wherever it calls `storage.from('fan-briefs').upload(path, ...)`) should
write both:

```ts
await supabase
  .from("fan_briefs")
  .update({
    rendered_clip_url: publicUrl,
    rendered_clip_path: path, // ← new
  })
  .eq("id", briefId);
```

No index needed — it's write-once, read-on-delete.

## Frontend side (once shipped)

Update `src/pages/label/LabelFanBriefs.tsx::handleDelete`:

```ts
// Before
const storagePath = getStoragePath(brief.rendered_clip_url);

// After
const storagePath =
  brief.rendered_clip_path ?? getStoragePath(brief.rendered_clip_url);
```

Keep the URL-parsing fallback for rows inserted before the backend change
shipped — they won't have `rendered_clip_path` set.

Also add `rendered_clip_path: string | null` to the `FanBrief` interface in
`src/types/fanBriefs.ts` and regenerate `src/integrations/supabase/types.ts`
via `supabase gen types typescript`.

## Why this is low priority

URL parsing works. This is a cleanliness / robustness improvement, not a
bug fix. Bundle it with any other `fan_briefs` schema change rather than
shipping a migration just for this.
