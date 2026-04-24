# 2026-04-23 — Factory v2 merge path (decision needed)

## Why this doc exists

`/label/content-factory-v2` ships today as a prototype under a parallel route — `/label/fan-briefs` and `/label/content-factory` are **untouched** and still production. When the prototype graduates, we have to pick how the existing routes and data collapse into the unified surface. This is a decision, not a coding task. Paul picks one; the frontend executes from there.

## The three options

### Option A — **Redirect old routes into v2 presets**

`/label/fan-briefs` and `/label/content-factory` become thin redirect routes. Any deep link hits the v2 Create tab with the right preset pre-selected (and query params preserving item IDs where possible).

**Pros**

- Zero data migration. Both old routes read the same Supabase tables v1 Factory v2 will read.
- Muscle memory preserved — bookmarks still work, Slack links still resolve.
- Onboarding story for existing Warner / Columbia users is clean: "same data, one surface."

**Cons**

- Two-way translation is needed for URL state. `?tab=content&venue=fallon&type=live` on Fan Briefs has to round-trip into Factory v2's query shape. Any URL we can't cleanly translate lands on the Create tab without context — silent data-loss risk.
- v2 has to be feature-complete for _both_ old flows before we flip. The karaoke banner, audit modal, venue pills, Content Factory stepper, TikTok upload, WhisperX provider toggle — everything the live routes currently do has to land first, or users hit the redirect and find nothing.

**Estimated effort**: 2 sprints. Most of it is rebuilding Fan Briefs content/clips tabs + the T7 stepper inside the v2 Create preset shells.

### Option B — **Keep both — v2 is a second entry point**

Old routes stay. Factory v2 becomes an alternative surface. Same backend, two frontends.

**Pros**

- Zero migration risk. Old users can keep using what they know while power users opt into v2.
- Gives us a live A/B — Mixpanel (or whatever we wire) can show which surface actually drives more approvals per manager per week.
- If v2 flops, we kill it cleanly. Nothing to unwind.

**Cons**

- **Double maintenance.** Every Fan Briefs fix (like today's live-performance extension) has to land in both. Every Content Factory stepper improvement, same. Inevitable drift as we move fast — one surface always gets the fix first, the other always lags.
- Mental model tax on the team and on customers. "Is Fan Briefs going away? Should I use v2? Why are there two?"
- The whole point of the merge — one HITL inbox — gets diluted the second some approvals go through the old UI.

**Estimated effort**: ~1 sprint to polish v2 to parity with old on the _Create_ and _Review_ flows, then indefinite double-maintenance.

### Option C — **Hard-delete old routes after v2 reaches parity**

v2 ships with all Fan Briefs + Content Factory functionality folded in. Old routes are deleted in the same PR that opens v2 to Warner + Columbia. Sidebar entries for Fan Briefs + Content Factory come out. Only v2 remains.

**Pros**

- Forcing function — we don't ship v2 until it's genuinely complete. No temptation to cut corners because "users can fall back to old."
- Cleanest code. One surface, one set of components, one test pass.
- Matches the product thesis: Factory v2 is _the_ label ops surface, not _a_ label ops surface.

**Cons**

- Highest migration risk. If we get any part of the data-fetch or permissions wrong, Warner / Columbia lose access to tools they use daily. They will notice the same hour.
- Deep links break hard. Every old `/label/fan-briefs?tab=content&venue=grammys` URL in someone's bookmarks / Slack history / email → 404 or wrong landing. Needs an aggressive redirect middleware (see option A's cons) OR we accept the breakage and send a proactive heads-up.
- Reviewable surface area goes from "a new route" to "a new route + the deletion of two live routes" — harder PR review, harder rollback if something breaks.

**Estimated effort**: 2 sprints of parity work + 1 high-stakes migration PR + a week of babysitting for Warner / Columbia after flip.

## My recommendation

**Option A — redirect old routes into v2 presets.** The three reasons:

1. **The merge is the product bet.** Keeping two surfaces forever (option B) doesn't ship the bet. Hard-deletion (option C) ships the bet but concentrates all risk into one high-stakes PR, and the breakage from lost deep-links lands on the exact customers we least want to annoy.

2. **Redirects are cheap compared to what they prevent.** We can write a translation table for the URL shapes we care about (the `?venue=`, `?type=`, `?job_id=` flavors) and fall back to a generic landing for anything else. That pays back the effort in a single "why did my link break" Slack ping from Warner.

3. **We can ship option A in stages.** Phase 1: v2 ships, both surfaces live, PR-side redirect only on the entry point (sidebar click goes to v2). Phase 2: deep links redirect. Phase 3: old sidebar entry removed. Each phase is revertable. Hard-delete isn't.

## What I'd push back on

If you're leaning option C "force us to ship the real product" — fair, but not in a single PR. Stage it: ship v2 alongside for 4 weeks, watch approvals split, _then_ drop the old routes. The gain from forcing function is real; the risk from one-shot cutover is higher than it looks.

## Open questions for Paul (answer before any of this starts)

1. Which option? (A / B / C)
2. If A or C: do we own redirect middleware, or delegate to client-side `<Navigate>`? (Server-side is safer for external deep links, client-side is what the app already uses.)
3. Which metric proves "v2 wins"? Approvals-per-manager-per-week? Time-to-first-approval? Kill-rate delta? Without one, option B's A/B is meaningless.
4. Timing — is this blocked on Autopilot + Library landing first, or do those ship separately under v2?

## Dependencies

- Factory v2 needs Autopilot + Library before it's _really_ parity. Neither is built. Explicitly deferred in today's session.
- The kill-feedback → priors backend (see `2026-04-23_factory-v2-kill-feedback-priors.md`) is not strictly blocking for the merge, but its absence means v1 v2 will drop kill data on the floor — another reason not to rush the cutover.
