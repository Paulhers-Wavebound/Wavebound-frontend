# Session: Artist Onboarding Intelligence Trigger (2026-04-07)

## What changed

- `src/components/label/UniversalAddArtistModal.tsx` — After `start-onboarding` succeeds, reads `entity_id` from response and fires `trigger-artist-onboarding` with tasks `["comments", "catalog", "videos"]`. Updated toast to "Setting up intelligence for [Artist Name]".
- `src/components/label/AddArtistModal.tsx` — Same change applied to the legacy add-artist modal.
- `docs/handoffs/backend-todo.md` — Added HIGH priority item: `start-onboarding` must create `wb_entities` + `wb_platform_ids` and return `entity_id`.
- `docs/features/artist-onboarding-trigger.md` — New feature doc.

## Why

Label managers want comment sentiment, catalog data, and video scraping to start immediately when a new artist is added, not wait for the next scheduled pipeline run.

## What was tested

- `npx tsc --noEmit` — clean, no errors.
- Both modals updated consistently.

## What to verify in browser

- Add an artist via the modal — confirm the toast says "Setting up intelligence for [Artist Name]" instead of the old "Pipeline started for @handle" message.
- Network tab: after `start-onboarding` returns, check if `trigger-artist-onboarding` fires (will only fire once backend returns `entity_id` in the response).

## Blocked on backend

The `trigger-artist-onboarding` call won't fire until `start-onboarding` is updated to create the entity and return `entity_id`. The frontend is ready — once the backend change deploys, this feature activates automatically with zero frontend changes.
