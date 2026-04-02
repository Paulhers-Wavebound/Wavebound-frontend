# Wavebound Product Capabilities

> Last updated: April 2, 2026

---

## LAYER 1 — EXECUTIVE SUMMARY

Wavebound is a label intelligence platform that gives music labels real-time visibility into artist performance, sound virality, and content strategy — replacing spreadsheets, gut feeling, and manual TikTok scrolling with automated insights and AI-powered action plans.

**Core Capabilities:**

- **Roster Command Center** — Live dashboard showing every signed artist's momentum, risk level, posting cadence, and release readiness at a glance
- **AI-Generated Content Strategy** — Personalized 7-day and 30-day content plans for each artist, built from competitive analysis and platform trend data
- **Sound Intelligence** — Real-time monitoring and forensic analysis of any TikTok sound: who's using it, what formats work, where it's trending, and when to push or pull back
- **Artist Intelligence Reports** — Deep-dive profiles combining TikTok, Instagram, and Spotify data into a single performance narrative with strategic recommendations
- **Expansion Radar** — Geographic and linguistic audience mapping that identifies untapped markets with revenue projections
- **Fan Briefs** — AI-extracted content moments from artist catalogs, pre-packaged as fan-ready clips with hooks, format recommendations, and platform targeting
- **Paid Amplification Intelligence** — Automatic identification of high-engagement organic content ready for paid boosting, with engagement-rate-based prioritization
- **AI Content Assistant** — Conversational AI that answers label-specific questions about artist performance, content strategy, and platform trends
- **Multi-Label, Role-Based Access** — Secure workspaces where label admins, team members, and viewers see exactly what they should, with per-artist visibility controls

---

## LAYER 2 — PRODUCT WALKTHROUGH

### 2.1 Label Dashboard (Roster Command Center)

The primary workspace for label teams. Shows every artist on the roster with real-time health indicators.

**What the user sees:**

- Grid or list view of all signed artists, each displayed as a card with avatar, name, handle, and key metrics
- Momentum tier badges: Viral, Breakout, Momentum, Stable, or Stalled — color-coded for instant triage
- Posting status indicators showing days since last post, with color warnings (green < 3 days, amber 3–7 days, red > 7 days)
- Release readiness scores as circular progress rings
- Pipeline progress bars showing where each artist is in the onboarding/analysis process (8 sequential phases)
- Risk alerts panel — a horizontally scrollable strip of cards highlighting critical, warning, and informational alerts across the entire roster
- Attention card calling out artists who haven't posted in 7+ days

**What data/insights are surfaced:**

- Performance ratio (current multiplier vs baseline)
- Content plan availability status
- Risk flags with severity levels
- Pipeline completion percentage
- Momentum tier classification based on recent trajectory

**Interactive elements:**

- Search bar to filter artists by name or handle
- Filter tabs: All, Attention, Momentum, Stalled
- Toggle between grid and list views
- Click any artist to open their full profile
- Refresh button to reload latest metrics
- Add Artist modal to onboard new artists (enter TikTok handle, name, optional Instagram)

**Role-based experience:**

- **Label Admin**: Full roster visibility, can add/remove artists, manage team, access settings
- **Label Member**: Sees assigned artists only, can run analyses and view reports
- **Label Viewer**: Read-only access to assigned artists
- **Platform Admin**: Can switch between label contexts, sees all labels

---

### 2.2 Artist Profile (Deep Dive)

Accessed by clicking any artist from the roster. A comprehensive single-artist intelligence view.

**What the user sees:**

- Artist header with avatar, name, TikTok/Instagram handles
- Four key metric cards: TikTok followers, Instagram followers, monthly listeners, momentum tier
- Performance timeline — an area chart showing video views over time, with special markers for viral moments (star icons for 10x+ performance) and breakout videos (green dots for 4x+)
- Release readiness gauge — a progress ring showing 0–100 readiness score with individual factor checklist
- Risk flags section listing active warnings with severity colors
- Four deliverable cards linking to: Content Plan, Intelligence Report, 30-Day Plan, and Artist Brief
- Deep research sections (when available):
  - Content X-Ray table: performance breakdown by format type with verdict badges (SCALE, STOP/FIX, MAINTAIN, TEST, REDUCE)
  - Best and worst performing videos with thumbnails
  - TikTok vs Instagram comparison table
- Activity feed showing recent alerts and milestones with severity indicators and timestamps

**Insights surfaced:**

- Delta metrics showing percentage changes: average views, engagement rate, posting frequency, follower growth
- 7-day and 30-day performance ratio trends
- Cross-platform performance comparison (TikTok vs Instagram)
- Format-level performance analysis with strategic verdicts
- Posting frequency trends and gaps

---

### 2.3 Sound Intelligence

A dedicated analysis engine for any TikTok sound. Two views: overview (all monitored sounds) and detail (single sound deep-dive).

#### Overview Page

**What the user sees:**

- URL input to submit any TikTok sound for analysis
- Grid or list of all analyzed sounds with status badges (processing, completed, failed)
- Each sound card shows: cover art, track name, artist, video count, velocity status (Accelerating/Active/Declining), monitoring badge, next check countdown

**Interactive elements:**

- Submit sound URL for new analysis
- Toggle grid/list view
- Export overview as PDF
- Click any sound to enter detailed analysis

#### Detail Page

**What the user sees (top to bottom):**

1. **Sound Header** — Track cover, name, artist, album, monitoring status, lifecycle indicator
2. **Health Strip** — One-line summary: total videos, unique creators, total views, primary role %, organic intent %, directional arrow
3. **Monitoring Trend Chart** — Real-time multi-line chart (refreshes every 60 seconds) showing format, niche, or intent breakdown over time. Tabs to switch between modes. Detects intensive monitoring (15-min intervals) vs standard (3-hour).
4. **Winner Card** — The single best-performing format highlighted with multiplier, video count, average views, engagement rate, and strategic recommendation
5. **Axis Browser** — Six-tab classification system:
   - _Format_: Video types with volume bars, avg views, engagement %
   - _Niche_: Community targeting (Casual, Music, Cars, etc.) with engagement metrics
   - _Vibe_: Mood spectrum (energetic, calm, funny) with color gradient bar
   - _Intent_: Organic/paid/official/fan breakdown with stacked visualization
   - _Creators_: Gender and age demographics with sub-bars
   - _Song Role_: Primary/background/sound bite usage breakdown
6. **Velocity Chart** — Daily bar chart showing new videos per day using this sound. Time range selector (7D to ALL). Peak day marker, 7-day average, days since peak.
7. **Format Breakdown Table** — Sortable table with one row per format: video count, % of total, avg views, engagement rate, share rate, verdict (SCALE/EMERGING/SATURATED/DECLINING). Click any row to expand a drilldown showing:
   - Who's making these: top niches, dominant vibe, intent breakdown, face-in-2s %, hook usage %
   - Timing: song clip usage heatmap and daily posting timeline
   - Per-format posting hours (24-hour chart)
   - AI insight callout
   - Top videos with links, creator handles, and performance metrics
8. **Format Trends Chart** — Multi-line chart showing format popularity over time. Click legend to toggle lines, double-click to solo a format.
9. **Hook & Duration Section** — Face-in-first-2-seconds percentage with multiplier, top hook text phrases, optimal snippet quote, duration comparison (top 10 avg vs bottom 10 avg)
10. **Posting Hours Chart** — 24-hour distribution with peak hour highlight. Toggle between UTC and local timezone.
11. **Top Performers Grid** — Ranked video cards (3-column grid) showing creator, format, niche, vibe, intent, why it worked, views, and engagement rate. Filterable by niche (click in Axis Browser).
12. **Creator Tiers Section** — Expandable rows for Nano/Micro/Macro/Mega creators showing adoption timeline, preferred formats, engagement stats, and top creators list
13. **Geographic Spread** — Expandable country rows with flag, adoption timeline, format preferences per region, and AI regional insights
14. **Lifecycle Card** — Visual phase progression (Ignition → Breakout → Sustain/Decay) with current phase highlighted

**Export capabilities:**

- Full analysis PDF export
- Full CSV export
- Format-specific CSV export

**Monitoring & Alerts:**

- Sounds can be actively monitored with periodic re-checks
- Alert system notifies of format spikes, velocity surges, and trend changes
- Bell icon in header shows unread alerts with severity colors
- Click alert to navigate directly to the relevant sound

---

### 2.4 Content Plans & Strategy Documents

Each artist receives four deliverable documents, generated through the analysis pipeline and refined by the admin team.

**Document Types:**

1. **7-Day Content Plan** — Day-by-day content calendar with specific video ideas, reference examples, hooks, shot lists, and format recommendations
2. **Intelligence Report** — Narrative analysis of the artist's current performance, competitive positioning, and strategic opportunities
3. **30-Day Plan** — Extended strategy with weekly content plays, format experiments, and growth targets
4. **Artist Brief** — Comprehensive brand document covering positioning, content DNA (audio signature, visual style, format performance), platform metrics, 90-day growth targets, and content guardrails

**What label users see:**

- Deliverable cards on the artist profile showing availability status
- Click to open full document in a reader view
- Documents rendered as rich HTML with embedded data visualizations

**What label users can do:**

- View each document type via tabs on the artist detail page
- Documents update when admin team publishes new versions

---

### 2.5 Expansion Radar

Geographic and linguistic audience intelligence for identifying new market opportunities.

**What the user sees:**

- Artist selector to choose which artist to analyze
- Stats row: monthly listeners, markets currently reached, untapped markets, estimated missed reach
- Interactive world map (3D globe or flat map fallback) with city-level data points
- Expansion opportunity cards in a 2-column grid, each showing:
  - Market name with flag and region
  - Priority level (High, Medium, New Signal)
  - Comparable artist benchmarks in that market
  - Current listener count vs opportunity
  - Comment signal percentage (audience interest)
  - Go-to-market Opportunity Score
  - Projected monthly revenue impact
  - Evidence bullets and recommended strategy
- Revenue estimate section with per-market revenue cards and total opportunity summary
- Language signal analysis showing content language vs audience language distribution, with mismatch alerts and quick-win suggestions
- Niche evidence grid with comparable artist cards

**Interactive elements:**

- Click markets on the map to highlight and scroll to the corresponding opportunity card
- Expand/collapse opportunity cards for details
- CTA to generate a market-specific content plan

---

### 2.6 Fan Briefs

AI-extracted content moments from an artist's catalog, packaged for fan creators.

**What the user sees:**

- Two tabs: Content (pending review) and Clips (approved and rendered)
- Each brief card shows:
  - Artist avatar and handle
  - Source content title with confidence score badge
  - Video player (YouTube embed with timestamp for Content tab; rendered clip for Clips tab)
  - Editable hook text (the suggested creator prompt)
  - Caption text
  - Format recommendation badge, platform recommendation badges, sound pairing badge
  - Source metadata: title, timestamp range, reasoning ("why now")
  - Action buttons: Approve, Modify Hook, Skip

**Workflow:**

1. AI identifies compelling moments from artist content
2. Each moment appears as a pending brief with a suggested hook
3. Label team reviews: approve as-is, modify the hook text, or skip
4. Approved briefs are automatically rendered into downloadable clips
5. Rendered clips appear in the Clips tab with download button

---

### 2.7 Paid Amplification

Identifies organic content with high engagement rates that should be boosted with paid spend.

**What the user sees:**

- Four stat cards: Boost Ready count, High Potential count, Average ER, Top ER
- Grid or table view of qualifying videos (engagement rate ≥ 3% from last 12 months)
- Each video shows: thumbnail, caption, creator handle, views, likes, shares, saves, comments, engagement rate, posting date
- ER badge logic:
  - ≥ 8%: "BOOST READY" (green) — "Run as Spark Ad now"
  - ≥ 5%: "HIGH POTENTIAL" (orange) — "Monitor 48hrs, then boost"
- Artist readiness carousel showing per-artist ad readiness status
- Quick reference cards for amplification guidelines

**Interactive elements:**

- Toggle between grid and table views
- Sort table by any metric column
- Click video to open on TikTok

---

### 2.8 AI Content Assistant (Chat)

Conversational AI for label-specific questions about artists, content strategy, and platform trends.

**What the user sees:**

- Full-screen chat interface with dark theme
- Sidebar listing chat sessions grouped by date, with favorites pinned at top
- Suggestion cards for common queries: "Stream performance," "Viral sounds," etc.
- Message stream with user and assistant messages, typing indicators, and status cards
- Rich content in responses: embedded TikTok video cards, video strips, markdown formatting

**Interactive elements:**

- Create new chat sessions
- Rename, delete, or favorite sessions
- Send messages with Enter (Shift+Enter for newlines)
- Click suggestion cards to send pre-built prompts
- Copy messages, provide feedback (thumbs up/down)
- Stop button during response streaming
- Rate limiting: 30 messages/hour, 3-second cooldown

**Sidebar modes:**

- Dockable (fixed to right side) or floating (overlays content)
- Resizable width (360px to 900px)
- Focus mode (full-screen AI view, Escape to exit)
- Available globally on any page via sidebar toggle

---

### 2.9 Label Settings

Team and workspace management for label administrators.

**What the user sees:**

- Label information: logo, name, slug, invite code, contact email, creation date
- Team members table: email, role, join date
- Artist assignment interface: assign team members to specific artists

**Admin-only actions:**

- Edit contact email
- Change member roles (Admin, Member, Viewer)
- Remove team members
- Generate new invite codes
- Assign/unassign members to artists (controls per-artist visibility)

---

### 2.10 Admin Dashboard (Platform Operations)

Internal admin portal for Wavebound platform operators. Separate from label admin.

**Tabs:**

**Analytics:**

- Overview cards: total users, signups, DAU, DAU/WAU ratio, chat count, video count, power users, days to paywall, plan breakdown
- Signup growth chart
- User segment breakdown
- Activation funnel visualization
- Retention cohort analysis
- Daily usage chart
- Active users count
- Top 50 users by activity
- Power user metrics
- Activity feed
- PDF export of all analytics

**Labels:**

- Table of all labels with invite codes, artist counts, status, onboarding progress
- Delete labels with typed confirmation

**Artists:**

- Searchable table of all artists across all labels
- Pipeline status and review status badges
- Delete artists with typed confirmation

**Pipeline:**

- Real-time pipeline monitoring table showing 9 processing phases per artist
- Phase status icons: pending, processing, completed, failed
- Retry button to re-trigger failed pipelines
- Auto-refresh every 30 seconds for active jobs
- Filter by status

**Plan Review:**

- Two-column review interface: artist list (left) and document preview (right)
- Four document tabs: 7-Day Plan, Intel Report, 30-Day Plan, Artist Brief
- Approve or flag plans with one click
- Version history with rollback capability
- Search and filter by review status

**Content Editing:**

- Direct editing of all four deliverable documents per artist
- Intelligence Report: inline HTML editing with live preview
- 30-Day Plan: structured play editor with GIF management, format fields, hook editing
- Artist Brief: comprehensive form editor with accordion sections for overview, positioning, content DNA, platform metrics, 90-day targets, and content strategy
- GIF picker for swapping reference media
- Save & Render triggers automated HTML regeneration
- Polling feedback shows when renders complete

---

### 2.11 Authentication & Onboarding

**Login/Signup:**

- Email/password authentication
- Invite code required for signup (label-specific codes)
- Forgot password and reset password flows
- Join link format: `/join/:inviteCode` for pre-filled signup

**User Profile (`/me`):**

- Avatar upload and display name editing
- Role selection: Artist, Producer, Manager, A&R, Label Rep, Content Creator
- Social media handles: TikTok, Instagram, YouTube
- Theme selector with unlockable premium themes (subscription, referral, or achievement-based)
- Achievements section
- Referral program
- Subscription & billing management
- Admin console (admin users only)

---

### 2.12 Additional Features

**Favorites & Collections:**

- Save any TikTok video, Instagram Reel, or photo carousel to favorites
- Organize favorites into custom folders with colors
- Grid or compact list view with sorting (date, views, type)
- Drag-and-drop to move between folders
- Multi-select for bulk operations

**Content Plans (Personal):**

- Create projects with names and colors
- Save content plan workspaces with video selections
- Weekly content plan grid with 7-day layout
- Video cards with production details, hooks, notes
- Replace/refresh videos in plan slots
- Global notes panel per plan
- Share plans via link (public shareable view)

**Content Discovery Library:**

- Browse 19+ content categories (viral, trending, format-specific)
- Multi-faceted filtering: genre, sub-genre, content style, viral score, views, platform, effort level, gender
- Content type support: TikTok videos, Instagram Reels, photo carousels
- Sort by newest, views, viral score, or year
- Paginated loading with "load more"
- Discover chat assistant for AI-guided exploration

**TikTok Profile Audit:**

- Submit a TikTok profile URL for comprehensive analysis
- Multi-tab dashboard: profile stats, category breakdown, video performance
- Charts: pie, line, bar, radar for different metric views
- Timezone selector, metric visibility toggles, engagement mode selector
- Video preview modal
- Auto-save analysis results

**Content Calendar:**

- Calendar grid for scheduling posts
- Day cells with event indicators
- Content library panel for selecting items
- Selected date sidebar with detailed view
- Color coding by project

**Blog:**

- Blog listing with featured post banner
- Category tags and read time indicators
- Individual blog post reader

**Offline Detection:**

- Automatic offline banner when connection drops

---

## LAYER 3 — FULL CAPABILITY MATRIX

### 3.1 Navigation Structure

```
/login                          — Email/password login
/join/:inviteCode               — Signup with invite code
/forgot-password                — Password reset request
/reset-password                 — Set new password

/label                          — Roster Command Center (dashboard)
/label/artist/:id               — Artist detail (legacy route)
/label/artists/:artistHandle    — Artist profile (primary route)
/label/sound-intelligence       — Sound Intelligence overview
/label/sound-intelligence/:jobId — Sound Intelligence detail
/label/amplification            — Paid Amplification dashboard
/label/expansion-radar          — Expansion Radar (geographic intelligence)
/label/fan-briefs               — Fan Briefs management
/label/settings                 — Label team & workspace settings
/label/help                     — Help center with FAQ

/chat                           — AI Content Assistant (full page)
/me                             — User profile & settings
/favorites                      — Saved content collection
/my-plans                       — Content plan projects
/my-plans/:planId               — Plan workspace editor
/my-analyses                    — Saved analysis history
/content-plan                   — Artist content plan viewer
/tiktok-audit/:jobId            — TikTok profile audit viewer

/share/:shareId                 — Shared notes (public link)
/shared-plan/:shareId           — Shared content plan (public link)
/l/:slug                        — Artist bio page (public)

/admin                          — Platform admin dashboard
/admin/onboarding               — Admin onboarding workflow
/admin/plans                    — Plan review queue
/admin/edit                     — Content editing suite
/admin/artists                  — All artists management
/admin/labels                   — All labels management

/about                          — Company about page
/blog                           — Blog listing
/blog/:slug                     — Blog post reader
/privacy                        — Privacy policy
/terms                          — Terms of service
/support                        — Support resources
```

### 3.2 Label Dashboard — Complete Element Inventory

| Element                                      | Type             | Data Shown                                                                                                                     | User Action                                                           |
| -------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Search bar                                   | Input            | —                                                                                                                              | Filter artists by name/handle                                         |
| Filter tabs (All/Attention/Momentum/Stalled) | Tab bar          | Count per filter                                                                                                               | Switch active filter                                                  |
| View toggle (Grid/List)                      | Button pair      | —                                                                                                                              | Switch layout mode                                                    |
| Refresh button                               | Button           | —                                                                                                                              | Reload all roster metrics                                             |
| Add Artist button                            | Button           | —                                                                                                                              | Opens add artist modal                                                |
| Artist card (grid)                           | Card             | Avatar, name, handle, momentum tier badge, posting status, performance ratio, pipeline progress, risk alerts, readiness circle | Click to navigate to artist profile                                   |
| Artist row (list)                            | Table row        | Avatar, name, handle, status badge, last post date, performance ratio, plan status                                             | Click to navigate; sort by column headers                             |
| Momentum tier badge                          | Badge            | Viral/Breakout/Momentum/Stable/Stalled                                                                                         | Visual indicator only                                                 |
| Pipeline progress bar                        | Progress         | 8 phase completion dots                                                                                                        | Hover for phase names                                                 |
| Risk alerts panel                            | Scrollable strip | Severity icon, message, artist handle                                                                                          | Scroll left/right; click "View" to navigate to artist                 |
| Attention card                               | Card             | Count of inactive artists, individual issues                                                                                   | Click "View" per artist                                               |
| Add Artist modal                             | Dialog           | —                                                                                                                              | Enter TikTok handle (required), artist name, Instagram handle; submit |

### 3.3 Artist Profile — Complete Element Inventory

| Element                          | Type          | Data Shown                                                                  | User Action                           |
| -------------------------------- | ------------- | --------------------------------------------------------------------------- | ------------------------------------- |
| Back button                      | Button        | —                                                                           | Return to roster                      |
| Artist header                    | Section       | Avatar, name, TikTok handle, Instagram handle                               | —                                     |
| Metric card: TikTok followers    | Stat card     | Follower count                                                              | —                                     |
| Metric card: Instagram followers | Stat card     | Follower count                                                              | —                                     |
| Metric card: Monthly listeners   | Stat card     | Listener count                                                              | —                                     |
| Metric card: Momentum tier       | Stat card     | Tier name with color badge                                                  | —                                     |
| Performance timeline             | Area chart    | Views per video over time                                                   | Hover for tooltip (date, views, tier) |
| Viral marker (star)              | Chart dot     | Videos with 10x+ performance ratio                                          | —                                     |
| Breakout marker (circle)         | Chart dot     | Videos with 4x+ performance ratio                                           | —                                     |
| Release readiness gauge          | Progress ring | Score 0–100 with factor checklist                                           | —                                     |
| Risk flags list                  | List          | Flag text, severity color, icon                                             | —                                     |
| Deliverable card: Content Plan   | Link card     | Availability status                                                         | Click to view HTML document           |
| Deliverable card: Intel Report   | Link card     | Availability status                                                         | Click to view HTML document           |
| Deliverable card: 30-Day Plan    | Link card     | Availability status                                                         | Click to view HTML document           |
| Deliverable card: Artist Brief   | Link card     | Availability status                                                         | Click to view HTML document           |
| Delta metrics                    | Stat row      | Avg views %, engagement %, posting frequency %, followers %                 | —                                     |
| Content X-Ray table              | Table         | Format name, performance ratio, view multiplier, video count, verdict badge | Click format to expand                |
| Best/Worst performers            | Video cards   | Thumbnail, caption, views, engagement                                       | Click caption to expand               |
| Platform comparison table        | Table         | TikTok vs Instagram: avg views, engagement %, posting frequency             | —                                     |
| Activity feed                    | List          | Alert title, message, severity dot, timestamp, video link                   | Click "Show more"; click video link   |

### 3.4 Sound Intelligence Detail — Complete Element Inventory

| Element                        | Type            | Data Shown                                                                       | User Action                                               |
| ------------------------------ | --------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Sound header                   | Section         | Cover art, track name, artist, album, monitoring badge, lifecycle status         | —                                                         |
| Delete button                  | Button          | —                                                                                | Delete analysis with confirmation dialog                  |
| Export PDF button              | Button          | —                                                                                | Generate and download PDF                                 |
| Export CSV button              | Button          | —                                                                                | Download full CSV                                         |
| Export format CSV button       | Button          | —                                                                                | Download format-specific CSV                              |
| Health strip                   | Stat bar        | Videos, creators, views, song role %, organic %, status arrow                    | —                                                         |
| Monitoring trend chart         | Line chart      | Format/Niche/Intent breakdown over time                                          | Switch mode tabs; hover for top 5 contributors            |
| Winner card                    | Card            | Format name, multiplier, video count, avg views, ER, recommendation              | —                                                         |
| Axis Browser: Format tab       | Bar chart       | Formats with counts, avg views, engagement %                                     | —                                                         |
| Axis Browser: Niche tab        | Bar chart       | Niches with counts, engagement %                                                 | Click niche to filter top performers                      |
| Axis Browser: Vibe tab         | Spectrum bar    | Mood distribution with color gradient                                            | —                                                         |
| Axis Browser: Intent tab       | Stacked bar     | Organic/paid/official/fan percentages                                            | —                                                         |
| Axis Browser: Creators tab     | Bar chart       | Gender and age demographics                                                      | —                                                         |
| Axis Browser: Song Role tab    | Stat strip      | Primary/background/sound bite breakdown                                          | —                                                         |
| Velocity chart                 | Bar chart       | Daily new videos, peak marker, 7-day average                                     | Time range selector (7D–ALL); hover tooltip               |
| Format breakdown table         | Sortable table  | Format, count, %, avg views, ER, share rate, verdict                             | Sort by any column; click row to expand drilldown         |
| Format drilldown: Who's making | Section         | Top niches, dominant vibe, intent breakdown, face %, hook %                      | —                                                         |
| Format drilldown: Timing       | Charts          | Song clip heatmap, daily timeline, posting hours                                 | —                                                         |
| Format drilldown: Top videos   | List            | Handle, reason, views, ER %, link                                                | Click to open TikTok                                      |
| Format drilldown: AI insight   | Callout         | Strategic recommendation text                                                    | —                                                         |
| Format trends chart            | Line chart      | Format popularity lines over time                                                | Time range; click legend to toggle; double-click to solo  |
| Hook & duration section        | Two-column      | Face-in-2s %, hook phrases, optimal snippet, duration comparison                 | —                                                         |
| Posting hours chart            | Bar chart       | 24-hour posting distribution, peak hour                                          | Toggle UTC/local timezone; hover                          |
| Top performers grid            | Card grid       | Rank, creator, format badge, niche badge, vibe badge, intent badge, views, ER    | Niche filter from Axis Browser; show more/less pagination |
| Creator tiers section          | Expandable rows | Tier (Nano/Micro/Macro/Mega), count, timeline, formats, engagement, top creators | Click to expand/collapse                                  |
| Geographic spread              | Expandable rows | Country flag, adoption timeline, format preferences, AI insight                  | Click to expand/collapse                                  |
| Lifecycle card                 | Phase track     | Ignition → Breakout → Sustain/Decay progression, days since peak                 | —                                                         |
| Alert bell                     | Icon button     | Unread alert count                                                               | Click to open alert panel                                 |
| Alert panel                    | Popup list      | Alert title, message, severity, track name, time ago                             | Click alert to navigate; mark all as read                 |

### 3.5 AI Content Assistant — Complete Element Inventory

| Element              | Type              | Data Shown                                                 | User Action                                            |
| -------------------- | ----------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Session sidebar      | List              | Sessions grouped by date, favorites pinned                 | Click session to switch; create/rename/delete/favorite |
| New chat button      | Button            | —                                                          | Create new conversation                                |
| Suggestion cards     | Card grid         | Pre-built prompts (Stream performance, Viral sounds, etc.) | Click to send prompt                                   |
| Message input        | Textarea          | Character count                                            | Type message; Enter to send; Shift+Enter for newline   |
| Send/Stop button     | Button            | —                                                          | Send message or stop streaming                         |
| User message         | Bubble            | Message text, timestamp                                    | —                                                      |
| Assistant message    | Bubble            | Markdown content, video embeds, status cards               | Copy; thumbs up/down feedback                          |
| Typing indicator     | Animation         | —                                                          | —                                                      |
| Video card strip     | Horizontal scroll | Embedded TikTok video references                           | Click to open                                          |
| Rate limit indicator | Badge             | Messages remaining / cooldown                              | —                                                      |
| Dock/Float toggle    | Button            | —                                                          | Switch sidebar mode                                    |
| Width resize handle  | Drag handle       | —                                                          | Resize between 360–900px                               |
| Focus mode toggle    | Button            | —                                                          | Enter/exit fullscreen AI mode                          |

### 3.6 Expansion Radar — Complete Element Inventory

| Element                           | Type              | Data Shown                                                                | User Action                                |
| --------------------------------- | ----------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| Artist selector                   | Dropdown          | Artist names on roster                                                    | Select artist to analyze                   |
| Stat card: Monthly listeners      | Stat card         | Count + growth %                                                          | —                                          |
| Stat card: Markets reached        | Stat card         | Count                                                                     | —                                          |
| Stat card: Untapped markets       | Stat card         | Count (accent color)                                                      | —                                          |
| Stat card: Estimated missed reach | Stat card         | Revenue estimate                                                          | —                                          |
| World map (3D globe or flat)      | Map visualization | City-level data points                                                    | Click market to highlight opportunity card |
| Opportunity card                  | Expandable card   | Flag, market name, region, priority, metrics, evidence, strategy, revenue | Expand/collapse for details                |
| Revenue estimate cards            | Card row          | Per-market revenue, total opportunity                                     | —                                          |
| Language signal chart             | Bar chart         | Language distribution with flags                                          | —                                          |
| Language mismatch alert           | Alert box         | Content vs audience language gap                                          | —                                          |
| Niche evidence grid               | Card grid         | Comparable artists with format, market, views                             | —                                          |
| Generate plan CTA                 | Button            | —                                                                         | Trigger market-specific content plan       |

### 3.7 Fan Briefs — Complete Element Inventory

| Element                          | Type            | Data Shown                                                    | User Action                                           |
| -------------------------------- | --------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| Tab: Content                     | Tab             | Pending brief count                                           | Switch to pending view                                |
| Tab: Clips                       | Tab             | Approved brief count                                          | Switch to approved view                               |
| Brief card: header               | Section         | Artist avatar, handle, source title, confidence score, status | —                                                     |
| Brief card: video (Content mode) | YouTube embed   | Source video at timestamp                                     | Replay clip                                           |
| Brief card: video (Clips mode)   | Video player    | Rendered 4:5 clip                                             | Download clip; view source                            |
| Brief card: hook text            | Text (editable) | AI-generated hook                                             | Click to edit inline; Enter to save; Escape to cancel |
| Brief card: caption              | Text            | Secondary prompt text                                         | —                                                     |
| Brief card: tags                 | Badge row       | Format, platform(s), sound pairing                            | —                                                     |
| Brief card: source info          | Section         | Title, timestamp range, reasoning                             | —                                                     |
| Approve button                   | Button          | —                                                             | Move to clips tab for rendering                       |
| Modify Hook button               | Button          | —                                                             | Enable inline hook editing                            |
| Skip button                      | Button          | —                                                             | Remove from pending queue                             |

### 3.8 Paid Amplification — Complete Element Inventory

| Element                   | Type        | Data Shown                                                           | User Action               |
| ------------------------- | ----------- | -------------------------------------------------------------------- | ------------------------- |
| Stat card: Boost Ready    | Stat card   | Count of ER ≥ 8% videos                                              | —                         |
| Stat card: High Potential | Stat card   | Count of ER ≥ 5% videos                                              | —                         |
| Stat card: Avg ER         | Stat card   | Average engagement rate                                              | —                         |
| Stat card: Top ER         | Stat card   | Highest individual ER                                                | —                         |
| View toggle (Grid/Table)  | Button pair | —                                                                    | Switch layout             |
| Video card (grid)         | Card        | Thumbnail, caption, handle, views, ER, ER badge                      | Click to open on platform |
| Video row (table)         | Table row   | All metrics: ER, views, likes, shares, saves, comments, date, artist | Sort by any column        |
| ER badge: BOOST READY     | Badge       | ER ≥ 8%                                                              | —                         |
| ER badge: HIGH POTENTIAL  | Badge       | ER ≥ 5%                                                              | —                         |
| Artist readiness carousel | Carousel    | Artist avatar, handle, readiness status, best ER                     | Click artist cards        |

### 3.9 Label Settings — Complete Element Inventory

| Element                    | Type                 | Data Shown               | User Action                       |
| -------------------------- | -------------------- | ------------------------ | --------------------------------- |
| Label logo                 | Image                | Logo image               | —                                 |
| Label name                 | Text                 | Label name               | —                                 |
| Label slug                 | Text                 | URL-friendly identifier  | —                                 |
| Invite code                | Text + button        | Current invite code      | Copy to clipboard                 |
| Contact email              | Input (admin) / Text | Email address            | Edit (admin only)                 |
| Created date               | Text                 | Creation timestamp       | —                                 |
| Team members table         | Table                | Email, role, joined date | —                                 |
| Role dropdown              | Select (admin)       | Current role per member  | Change role (Admin/Member/Viewer) |
| Remove member button       | Button (admin)       | —                        | Remove with confirmation          |
| Artist assignment dropdown | Select               | Available artists        | Assign member to artist           |

### 3.10 Admin Dashboard — Complete Element Inventory

| Element                        | Type            | Data Shown                                                                         | User Action                          |
| ------------------------------ | --------------- | ---------------------------------------------------------------------------------- | ------------------------------------ |
| Tab: Analytics                 | Tab             | —                                                                                  | View analytics dashboard             |
| Overview cards (9)             | Stat cards      | Users, signups, DAU, DAU/WAU, chats, videos, power users, paywall countdown, plans | —                                    |
| Signup growth chart            | Line chart      | Signups over time                                                                  | —                                    |
| User breakdown chart           | Chart           | User segments                                                                      | —                                    |
| Activation funnel              | Funnel viz      | Step completion rates                                                              | —                                    |
| Retention cohorts              | Table/chart     | Week-over-week retention                                                           | —                                    |
| Daily usage chart              | Bar chart       | Usage per day                                                                      | —                                    |
| Active users count             | Counter         | Real-time active count                                                             | —                                    |
| Top 50 users table             | Table           | User metrics                                                                       | —                                    |
| Power users table              | Table           | High-engagement users                                                              | —                                    |
| Activity feed                  | List            | Recent platform events                                                             | —                                    |
| PDF export button              | Button          | —                                                                                  | Download analytics PDF               |
| Refresh button                 | Button          | —                                                                                  | Reload all stats                     |
| Tab: Labels                    | Tab             | —                                                                                  | View all labels                      |
| Labels table                   | Table           | Name, invite code, artist count, status, onboarding status, created                | Click row; copy code; delete         |
| Delete label dialog            | Dialog          | —                                                                                  | Type label name to confirm delete    |
| Tab: Artists                   | Tab             | —                                                                                  | View all artists                     |
| Artists search                 | Input           | —                                                                                  | Filter by name/handle                |
| Artists table                  | Table           | Name/handle, label, pipeline status, review status, invite code, updated           | Click row; copy code; delete         |
| Delete artist dialog           | Dialog          | —                                                                                  | Type handle to confirm delete        |
| Tab: Pipeline                  | Tab             | —                                                                                  | View pipeline status                 |
| Pipeline filter                | Dropdown        | All/Processing/Completed/Failed                                                    | Filter table rows                    |
| Pipeline table                 | Table           | Artist, label, overall status, 9 phase icons                                       | Retry button per job                 |
| Tab: Plan Review               | Tab             | —                                                                                  | Review deliverables                  |
| Artist list (left panel)       | Scrollable list | Name, handle, label, status badge                                                  | Search; click to select              |
| Document tabs                  | Tab bar         | 7-Day, Intel Report, 30-Day, Brief                                                 | Switch document type                 |
| Document preview (right panel) | Iframe          | Full HTML document                                                                 | Scroll/read                          |
| Approve button                 | Button          | —                                                                                  | Mark plan as approved                |
| Flag button                    | Button          | —                                                                                  | Mark as needs changes                |
| History button                 | Button          | —                                                                                  | Open version history drawer          |
| Tab: Edit                      | Tab             | —                                                                                  | Edit deliverables                    |
| Artist selector                | Dropdown/list   | —                                                                                  | Select artist to edit                |
| Intel Report editor            | Iframe          | HTML content                                                                       | Inline editing; save; discard        |
| 30-Day Plan editor             | Split panel     | HTML preview + structured editor                                                   | Edit plays; swap GIFs; save & render |
| Artist Brief editor            | Split panel     | HTML preview + accordion form                                                      | Edit all sections; save & render     |
| GIF picker modal               | Modal           | Available GIFs from storage                                                        | Select GIF to replace                |

### 3.11 User Profile — Complete Element Inventory

| Element                 | Type                 | Data Shown                                    | User Action                                                        |
| ----------------------- | -------------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| Avatar                  | Image + button       | Current avatar                                | Upload new image                                                   |
| Display name            | Input                | Current name                                  | Edit inline                                                        |
| Email                   | Text                 | User email                                    | —                                                                  |
| Role dropdown           | Select               | Current role                                  | Select: Artist, Producer, Manager, A&R, Label Rep, Content Creator |
| TikTok handle           | Input                | Current handle                                | Edit                                                               |
| Instagram handle        | Input                | Current handle                                | Edit                                                               |
| YouTube handle          | Input                | Current handle                                | Edit                                                               |
| Theme selector          | Selector             | Available themes                              | Select theme (7 options; some locked)                              |
| Theme unlock indicators | Badge                | Lock type (subscription/referral/achievement) | —                                                                  |
| Achievements section    | Section              | Earned achievements                           | View milestones                                                    |
| Referral section        | Section              | Referral link, friend count                   | Copy link; track referrals                                         |
| Admin console           | Section (admin only) | Admin tools                                   | Access admin features                                              |
| Subscription section    | Section              | Current plan, status                          | Manage billing                                                     |
| Sign out button         | Button               | —                                             | Log out                                                            |

### 3.12 Multi-Tenant & Access Control Matrix

| Capability             | Platform Admin    | Label Admin | Label Member     | Label Viewer     | Guest          |
| ---------------------- | ----------------- | ----------- | ---------------- | ---------------- | -------------- |
| View roster            | All labels        | Own label   | Assigned artists | Assigned artists | —              |
| Add artists            | Yes               | Yes         | Yes              | —                | —              |
| Remove artists         | Yes               | Yes         | —                | —                | —              |
| Run analyses           | Yes               | Yes         | Yes              | —                | —              |
| View reports           | Yes               | Yes         | Yes              | Yes              | —              |
| Edit deliverables      | Yes (admin panel) | —           | —                | —                | —              |
| Approve/flag plans     | Yes               | —           | —                | —                | —              |
| Manage team            | Yes               | Yes         | —                | —                | —              |
| Change member roles    | Yes               | Yes         | —                | —                | —              |
| Switch label context   | Yes               | —           | —                | —                | —              |
| Access admin dashboard | Yes               | —           | —                | —                | —              |
| View shared plans      | —                 | —           | —                | —                | Yes (via link) |
| View artist bio pages  | —                 | —           | —                | —                | Yes (public)   |

### 3.13 Feature Gating

Certain features are behind preview gates, controlled per-label:

| Feature            | Gate ID              | Behavior when gated                   |
| ------------------ | -------------------- | ------------------------------------- |
| Sound Intelligence | `sound-intelligence` | Shows preview mock with "Coming Soon" |
| Paid Amplification | `paid-amplification` | Shows preview mock                    |
| Expansion Radar    | `expansion-radar`    | Shows preview mock                    |
| Fan Briefs         | `fan-briefs`         | Shows preview mock                    |

When a feature is gated, users see a visually appealing mock of the feature with a clear indication that it's coming soon, rather than a blank page.

### 3.14 Responsive & Mobile Considerations

- Label sidebar collapses into a mobile sheet (hamburger menu) on small screens
- Dashboard grid adapts from multi-column to single-column on mobile
- Artist profile deep research sections auto-collapse on mobile
- AI sidebar converts from dockable to overlay on smaller viewports
- Favorites sidebar is sticky on desktop, collapses on mobile
- Bottom navigation bar appears on mobile for primary navigation
- Charts and tables use ResponsiveContainer wrappers for fluid sizing
- Video cards maintain 9:16 aspect ratio across breakpoints

### 3.15 Global Features (Present on All Authenticated Pages)

| Feature             | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| AI Sidebar          | Dockable/floating chat panel accessible from any page        |
| Offline Detector    | Banner appears when internet connection drops                |
| Day Selector Dialog | Global dialog for adding content to specific plan days       |
| Theme System        | Dark theme default with 7 theme options (2 free, 5 premium)  |
| Activity Tracking   | Background event logging with deduplication                  |
| Session Recovery    | Analysis state persists across navigation (30-minute window) |

---

## PLANNED / IN-PROGRESS FEATURES

The following features appear to be in various stages of development based on code analysis:

1. **Expansion Radar** — Currently uses mock/demo data rather than live data for most metrics. Geographic map and opportunity analysis framework is built but awaiting real data integration.

2. **Fan Briefs Clip Rendering** — The approval-to-render pipeline is built, but clip rendering depends on external processing that may still be in setup.

3. **Verdict Algorithm** — The momentum/verdict scoring logic has a known issue where most items show "SCALE" — the engagement × recency weighting needs calibration.

4. **Song Duration** — Currently hardcoded to 120 seconds in some places rather than reading from the actual song metadata.

5. **Bio Pages** — Artist public bio pages (`/l/:slug`) exist as a route but appear to be minimal.

6. **Content Calendar** — Calendar view components exist but may not be fully integrated into the main label workflow.

7. **Achievements System** — Achievement unlocks are referenced (e.g., "Curator" badge for first favorite) but the full achievement catalog and display may be partial.

8. **Premium Themes** — Unlock mechanics exist (subscription, referral, achievement) but the purchasing/subscription flow integration status is unclear.

9. **Instagram Reel Analysis** — Infrastructure exists for Instagram Reel content alongside TikTok, but the depth of Instagram-specific analysis may be less mature.

10. **Ad Impact Attribution** — Referenced in the Paid Amplification tab but the attribution tracking between organic spikes and paid spend appears to be in early stages.
