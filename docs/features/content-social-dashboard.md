# Content & Social Dashboard

Role-specific dashboard for Content & Social team members at record labels, matching the design quality of the Digital Marketing dashboard but tailored for content strategy.

## Who uses it and why

Label Content & Social managers use this to monitor roster posting health, content performance, format strategy, and anomalies at a glance.

## Correct behavior

- Briefing card shows data-driven narrative about posting gaps, trending artists, and recommended actions
- Priority cards highlight posting droughts, content spikes, engagement drops, and format shifts
- Roster table shows Artist, Posting Window, Consistency, Content Velocity, Format Alpha, Top Sound, and Activity columns
- Posting Window column marks artists as `DROP IN Xd` for high/medium-confidence announced releases within 14 days, `FRESH RELEASE` for songs released in the last 30 days, or `QUIET` outside that window
- Consistency pill is based on numeric 7-day/30-day posting frequency first, with categorical `posting_cadence` only as fallback; one recent post cannot make a low-cadence artist look `Hot`
- Consistency pill shows the actual posts-per-week reason (`0.6/wk`, `3/wk`, etc.) and flags stale cadence conflicts with a warning tooltip
- Upcoming-release pills expose provenance on hover: release title when known, source URL, evidence sentence, source type, and confidence
- Artist profile Overview tab shows a Release Intel panel with the latest AI release scan result, source/evidence when found, and the last checked timestamp
- Artist profile Release Intel panel lets a label user confirm a missed public upcoming release by entering the release date and source URL; the confirmed row immediately becomes the source for Posting Window logic
- Top Sound column shows the artist's top-performing sound (most new UGC this week) with title, weekly new UGC count, velocity arrow, and total UGC
- Filter tabs: All, Posting Gap, Top Performers, Declining, Format Shift, UGC Surge
- Table is sortable by Posting Window, Content Health, Performance, Format Alpha, Top Sound, Activity, or Artist name
- Expanded row shows metric tiles: Cadence, Velocity, Engagement, Top Sound (when data exists) plus a priority action banner
- "Chat about this" button on briefing prefills the assistant with the briefing content
- All data is real, sourced from: roster_dashboard_metrics, content_anomalies, artist_content_dna, artist_content_evolution, tiktok_video_summary, catalog_tiktok_performance
- Sound Performance section shows which songs have TikTok UGC with status, video count, creator count, total plays, and cross-platform gap detection
- Sound Performance merges catalog-linked songs AND Sound Intelligence-analyzed sounds, deduplicating by TikTok music ID and sorted by total plays
- Notification bell shows real content_anomalies (posting droughts, view spikes, engagement drops) when in Content & Social role
- Insight banner at bottom shows a generated summary

## Edge cases

- **Empty roster**: Shows "Your roster is empty" message
- **No anomalies**: Priority cards section hidden, briefing says "no urgent issues"
- **Missing content DNA**: Artists without Gemini analysis show "—" for format/genre fields
- **No upcoming-release brief**: Posting Window falls back to `days_since_release`; artists still show `FRESH RELEASE` when they released in the last 30 days
- **Stale cadence category**: If `tiktok_video_summary.posting_cadence` says daily but roster frequency says under weekly, the numeric frequency wins, the artist shows `Inconsistent`/`At Risk` instead of `Hot`, and the pill can show a warning tooltip until the summary is backfilled
- **Fresh null release scan**: Artist profile shows "No dated release found" plus the scan freshness, so a verified null is visibly different from "Not scanned yet"
- **AI missed a public release**: A label user can confirm the date/source on the artist profile; the row is stored as `confirmed` with `source_type = manual` and high confidence
- **Invalid or stale upcoming date**: Posting Window ignores invalid or past `next_release_date` values and falls back to recent-release detection
- **Low-confidence upcoming date**: Stored for human review but does not drive the green Posting Window pill or roster sort
- **No sound data**: Artists without sound tracking show "—" in Top Sound column. UGC Surge filter only shows artists with active sound velocity
- **No filter matches**: Shows "No artists match this filter" in table
- **Loading state**: Shows skeleton placeholders
- **Error state**: Shows retry button

## Data sources

| Table                       | What it provides                                                           |
| --------------------------- | -------------------------------------------------------------------------- |
| roster_dashboard_metrics    | Posting freq, views, engagement, release dates, momentum tier, risk flags  |
| content_anomalies           | Performance spikes/drops, posting droughts                                 |
| artist_intelligence         | AI brief `weekly_pulse.next_release` freshness and fallback fields         |
| artist_release_calendar     | Structured upcoming release date, source URL, evidence, confidence, status |
| artist_content_dna          | Format distribution, mood, hooks, signature style                          |
| artist_content_evolution    | Strategy shifts, performance trends                                        |
| tiktok_video_summary        | Posting cadence, consistency score                                         |
| catalog_tiktok_performance  | Song UGC: video count, creators, plays, TikTok status, cross-platform gap  |
| get_si_sound_performance()  | RPC: SI-analyzed sounds not yet in catalog (total views, creators, status) |
| get_artist_sound_velocity() | RPC: Per-artist top sound by weekly UGC momentum, velocity direction       |
