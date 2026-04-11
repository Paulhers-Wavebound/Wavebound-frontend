# Content & Social Bible

> The canonical reference for building Wavebound's AI operating system for the "Social & Content" role at major record labels. Every Claude Code instance MUST read this before implementing features, running site inspections, or making UX decisions.

> **Source:** Four Gemini Deep Research reports synthesized into one operational document. Covers the strategic landscape, daily workflows, decision taxonomy, and information flow of the role Wavebound serves.

---

## Table of Contents

1. [The Person We're Building For](#1-the-person-were-building-for)
2. [The 2026 Industry Context](#2-the-2026-industry-context)
3. [The Daily Operating Rhythm](#3-the-daily-operating-rhythm)
4. [The Decision Taxonomy](#4-the-decision-taxonomy)
5. [The Information Supply Chain](#5-the-information-supply-chain)
6. [The Seven Dashboard Tiles](#6-the-seven-dashboard-tiles)
7. [The Artist Intelligence Drilldown](#7-the-artist-intelligence-drilldown)
8. [The Layer 3 Principle](#8-the-layer-3-principle)
9. [Metrics That Matter vs. Vanity Metrics](#9-metrics-that-matter-vs-vanity-metrics)
10. [Implementation Implications](#10-implementation-implications)

---

## 1. The Person We're Building For

**Title:** VP of Viral Marketing / Head of Content & Social Media / Director of Content Production

**Employer:** Major record label (Columbia Records, UMG, WMG) within the Sony Music Entertainment ecosystem.

**Reports to:** Chairman, CEO, President — daily, on live-time campaign insights.

**Manages:** 30-80 artists across "Artist Pods" (cross-functional teams of Digital Product Manager, Content Producer, Audience Analyst).

**Core tension:** They spend 60% of their time on administrative tasks and only 40% on music and creative strategy. Wavebound exists to invert this ratio.

**What they care about (in order):**
1. Which artist needs my attention RIGHT NOW and why?
2. Is the thing we're pushing actually converting to streams?
3. Is something breaking that I don't know about yet?
4. What should we do differently this week vs. last week?
5. What do I tell the Chairman in 5 minutes?

**What they do NOT care about:**
- Raw view counts (lagging, inflatable)
- Global popularity ranks (meaningless for campaign optimization)
- Generic engagement rate by followers (biased toward historical performance)
- Static editorial calendars (replaced by dynamic deployment)

---

## 2. The 2026 Industry Context

### The Shift
The industry has moved from the "Attention Economy" to the "Retention Economy." 150,000+ tracks uploaded daily. The barrier is no longer distribution — it's cutting through algorithmic noise and building durable fan equity.

### Key Industry Signals

| Signal | Impact on Content Strategy | Decision Metric |
|--------|---------------------------|-----------------|
| Platform Saturation | Higher bar for "thumb-stop" hooks | 1.7s Decision Window Retention |
| Nostalgia Waves | Catalog tracks as content templates | Catalog Velocity Delta (%) |
| AI Content Surge | Demand for "Human-First" authenticity | Sentiment Intent Score |
| Conversion Gap | High views without streaming lift | Save-to-Reach Ratio (%) |
| Agentic AI | Automated workflow execution | Instructional Token Accuracy |

### The 1.7-Second Decision Window
Down from 3.0s in 2024. This is the most important number in the business. Two failure archetypes:
- **"Mute Failure"**: Drop-off at 0.5s = visual/thumbnail failing to interrupt scroll
- **"Audio Failure"**: Drop-off at 1.5s = viewer stopped for visual but rejected the audio

### Platform Roles in 2026
- **TikTok**: Primary discovery engine. Test hooks here. 84% of Billboard Global 200 songs originate from viral moments on short-form platforms.
- **Instagram**: Core platform for superfan conversion and D2C impact. "Cement" the brand story here.
- **YouTube Shorts**: Most promising upward trajectory. "Discovery-to-Depth" funnel via Shorts-to-VOD conversion.

### The Nostalgia Loop
"2026 is the new 2016." Heritage tracks are not static assets — they are "Content Fuel" for current trends. Back catalog accounts for 70% of growth in TikTok music usage. Desiigner's "Panda" saw 68.6% surge from reuse as content template.

---

## 3. The Daily Operating Rhythm

This is what Wavebound needs to support, in the exact sequence the human works.

### 08:00 - 08:45 | Morning Pulse (Data Sync)

**Goal:** Identify overnight "shocks" before meetings start.

| Time | Action | Tool | Decision |
|------|--------|------|----------|
| 08:00-08:10 | Shock Detection | Push notifications / alerts | Any viral spikes or chart entries? |
| 08:10-08:25 | Velocity Audit | Roster dashboard | Filter by growth velocity, find top 5 movers |
| 08:25-08:35 | Global Signal Check | Geographic data | Any tracks breaking in unexpected territories? |
| 08:35-08:45 | First-Party Verification | Streaming data | Verify aggregator data against DSP truth |

**Wavebound implication:** The roster dashboard IS the 08:00-08:45 screen. It must surface shocks, velocity spikes, and geographic anomalies in < 30 seconds of looking at it. The AI morning message IS the shock detection layer.

### Scanning Pattern for 30-80 Artists
They do NOT search by artist name. They search by **Filter Sets**:

| Filter | Criteria | Response |
|--------|----------|----------|
| Active Priority | Releases in +/- 14-day window | High-intensity review |
| Velocity Spikes | > 2.5x standard deviation in velocity | Investigate source |
| Crisis/Risk | Suspicious changes or fraud flags | Coordinate with legal |
| Catalog Opportunity | Anniversary or sync placement | Proactive planning |

**Time per artist:**
- Normal day: 2-3 minutes scanning, 15-20 minutes for priority artists
- Crisis day: 30 seconds scanning (high-speed filter), 90+ minutes on the crisis

### 08:45 - 10:00 | Roster Triage

**Goal:** Decide which artists get mental bandwidth today.

They use the "Spotted Pattern" — not reading every line. Fixating on: bolded percentage changes, red/green status indicators, heat maps. High-Value/High-Risk logic.

**Wavebound implication:** Visual hierarchy on roster cards must support the Spotted Pattern. The most important signal per artist must be the largest, most colorful element. Everything else is secondary text.

### 10:00 - 11:30 | The Standup

**Format:** 15-minute Slack Huddle or video call.

**Attendees:** Strategist, Campaign Manager, A&R, Media Buyer, sometimes Content Producer.

**What the strategist presents:** The "Signal Report" — not a summary of work, but 3-5 critical Decision Points. Example: "Artist A's Hook B is outperforming Hook A in UK; pivot all ad spend to Hook B by noon."

**Context switch:** This is where they move from reactive (what happened overnight) to proactive (what happens in the next 4-6 hours).

**Wavebound implication:** The roster view must be "standup-ready." A strategist should be able to screen-share the Wavebound dashboard during standup and use it as the presentation layer. No switching to slides.

### 11:30 - 13:00 | Operational Deep Dive

Metadata hygiene, distribution oversight, quality checks on upcoming releases. ISRC/UPC verification. Digital shelf analytics.

### 13:00 - 14:00 | Adaptive Interval

"Passive ingestion" — demos, culture feeds, Reddit, Discord, TikTok trends. The formal switch from Defense to Offense.

### 14:00 - 16:00 | Content Architecture

The production pipeline. Strategist becomes the bridge between data signal and creative output.

**The Pivot Brief handoff:**
| Role | Responsibility |
|------|---------------|
| Strategist (Decider) | "Switch to Audio Hook B for Gen Alpha UK creators" |
| Content Producer (Editor) | Re-cuts the teaser to emphasize new hook |
| Studio Island (Pod) | Coordinates short-form shoot with influencers |
| Strategist (Validator) | QC check on technical specs |

**Wavebound implication:** Any insight Wavebound surfaces must be actionable enough to become a Pivot Brief. "Hook B outperforms Hook A" is actionable. "Engagement is up 12%" is not.

### 16:00 - 17:30 | Executive Synthesis

**Reporting to the Chairman formats:**
1. **Live Dashboard:** 8-12 "Actionable Metrics" (real-time ROMI, channel performance)
2. **1-Page Brief:** What is the narrative? What is the trajectory? What's the recommended next step?
3. **Slack Message:** For live events. Summary in plain language pairing metrics with qualitative fan feedback.
4. **5-Minute Call:** Crisis only. "Tell a Story" — context behind the numbers.

**Wavebound implication:** Every screen in Wavebound must be exportable or screenshot-worthy for executive reporting. The AI summary IS the 1-page brief.

### 17:30 - 19:00 | Global Handover

Liaise with international affiliates. Update campaign calendars. Post final Slack summary for overnight teams.

### Weekend Pattern

| Day | Window | Activity | Trigger |
|-----|--------|----------|---------|
| Fri 19:00 - Mon 08:00 | Always-on | Automated crisis alerts | Reputational harm, bot attacks, legal |
| Sat 10:00-11:30 | Pulse check | Weekly engagement reports | Weekend viral trends |
| Sun 18:00-19:00 | Monday setup | Global milestone dashboard | Setting Monday triage priorities |

---

## 4. The Decision Taxonomy

Every feature we build must trace back to a decision in this taxonomy. If it doesn't enable a decision, it's noise.

### Tier 1: Emergency Response (Seconds to Hours)

#### 1.1 Synthetic Media / Deepfake Attack
- **Trigger:** Viral clip with low liveness scores
- **Time window:** Seconds to minutes
- **Options:** Legal takedown / Verified counter-signal / Embrace the meme
- **AI role:** Detection. Human decides communication strategy.

#### 1.2 Streaming Fraud / Bot Attack
- **Trigger:** Divergence between social engagement and streaming growth
- **Time window:** 12-24 hours
- **Options:** Request DSP audit / Pause ad spend / Publicly disavow
- **AI role:** Pattern identification. Human investigates if competitive attack.

#### 1.3 Content Suppression / Shadow-Ban
- **Trigger:** Unexplained drop in impressions despite consistent posting
- **Time window:** 24-48 hours
- **Options:** Archive suspected content / File platform appeal / Pivot to raw formats
- **AI role:** Determines suppression. Human leverages platform relationships.

### Tier 2: Campaign Execution (Hours to Days)

#### 2.1 Dynamic Budget Reallocation
- **Trigger:** High save rate (>20%) or 35% engagement spike on specific content
- **Time window:** 4-8 hours (must catch the viral wave)
- **Options:** Double down / Reallocate from underperformers / Invest in UGC
- **AI role:** Tactical ad bids. Human decides strategic priority.

#### 2.2 Format Pivot (High-Production to Raw)
- **Trigger:** High-production content failing completion rate despite high reach
- **Time window:** 2-3 days
- **Options:** Release acoustic/alternate versions / Shift to "story behind the song" clips
- **AI role:** Analyzes retention drop-offs. Human identifies the storytelling gap.

#### 2.3 Release Timing Shift
- **Trigger:** Pre-release teaser exceeds 1M views or high pre-save conversion
- **Time window:** 24-72 hours
- **Options:** Accelerate release / Extend hype phase / Surprise-drop remix
- **AI role:** Predicts peak hype window. Human manages logistics.

### Tier 3: Creative Direction (Hours to Weeks)

#### 3.1 Hook Selection
- **Trigger:** Pre-release teaser phase preparation
- **Time window:** Hours
- **Options:** Arresting Intro / Earworm Chorus / Lyrical Quote snippet
- **AI role:** Technical hook detection. Human decides brand alignment.
- **Key nuance:** Mathematically best hook may not be thematically best. Wrong hook = high skip rates on DSPs.

#### 3.2 Platform Prioritization
- **Trigger:** Shift in platform demographics or artist demographic hotspot
- **Time window:** Quarterly with monthly adjustments
- **Options:** TikTok-first discovery / YouTube-first branding / Discord-first community
- **AI role:** Macro-trend data. Human decides artist comfort and creative fit.

### Tier 4: Team & Resource Management (Days to Weeks)

#### 4.1 Pod Staffing and Rebalancing
- **Trigger:** Quarterly reviews or sudden momentum spike
- **Time window:** Monthly
- **AI role:** Predicts growth potential. Human manages interpersonal dynamics.

### Tier 5: Reporting & Intelligence

#### 5.1 Escalation — The "Fizzle Test"
- **Trigger:** 20% increase in negative mentions
- **Time window:** 2-4 hours
- **Options:** Escalate to C-Suite / Suppress via moderators / Ignore and pivot
- **AI role:** Categorizes sentiment. Human predicts human fallout.

#### 5.2 Catalog Spike Management (The Non-Obvious Decision)
- **Trigger:** 500% spike in Shazams/streams for a legacy track
- **Time window:** 24-48 hours
- **Options:** Re-release with visualizer / High-spend ad push / Observe retention
- **AI role:** Compares spike against historical hits and fizzles. Human decides if the cultural moment has "legs."
- **Key principle:** A song doesn't trend because of age — it trends because it fits a cultural context. Is that context sustainable?

---

## 5. The Information Supply Chain

### INPUTS (What the team consumes)

| Source | Primary Metrics | Update Frequency | Signal Quality |
|--------|----------------|-------------------|----------------|
| TikTok Creator Center | Viral triggers, sound engagement, demographics | Real-time / Hourly | High signal (discovery) / High noise (trends) |
| Instagram Insights | Saves, DM shares, Reels reach, Story engagement | Real-time | High signal (engagement) / Moderate noise |
| YouTube Studio | Long-form retention, Shorts performance, subscriber growth | Real-time | High signal (loyalty) / Low noise |
| Spotify for Artists | Stream counts, playlist adds, monthly active listeners | Daily / Real-time on release | Gold standard (revenue) / Low noise |
| Chartmetric | Cross-platform benchmarking, global chart positioning | Hourly / Daily | High authority / Low noise |
| Internal A&R Feed | Track readiness, release timelines, brand pillars, scouting data | Event-driven | High signal / Low volume |
| Cultural Trend Feeds | Reddit, Discord, TikTok trending, GEO trends | Continuous | High noise / Occasional gold |
| Artist Management | Tour schedules, merch drops, artist constraints, blackout periods | Event-driven | Critical constraints |

### A&R to Strategist Handoff (8-12 weeks before release)
- **What transfers:** Song demos, narrative hooks, release timelines, target demographics
- **Format:** Project management tickets + Creative Kickoff decks
- **Common failure:** "Information Silhouettes" — the A&R's gut instinct about why they signed the artist gets lost in translation to cold metrics. Last-minute track changes not communicated to strategist.

### OUTPUTS (What the team produces)

| Output | Recipient | Format | Cadence |
|--------|-----------|--------|---------|
| Daily Executive Briefing | C-Suite / VPs | 1-page doc / Slack | Daily |
| Weekly Management Report | Artist Management | PDF deck / Email | Weekly |
| Campaign Post-Mortem | All internal teams | Notion doc | Per campaign |
| Budget Reallocation Request | Product Managers | Slack / Email | As needed |
| Content Calendars | Creative / Social team | Shared digital calendar | Weekly |
| Creative/Pivot Briefs | Content Producers | Airtable + Slack | Daily |
| Influencer Briefs | Creator/Influencer team | Centralized submission system | Per campaign |
| Crisis Communications | All stakeholders | Slack "Command Center" | Emergency |

### Critical Handoff Failure Points

| Handoff | Common Failure | What Gets Lost |
|---------|---------------|----------------|
| A&R -> Strategist | "Information Silhouettes" | Emotional essence of why the artist matters |
| Strategist -> Producer | "Creative Disconnect" | Platform-native hook effectiveness sacrificed for polish |
| Strategist -> Media Buyer | "Black Box Gap" | Qualitative niche insights lost to auto-targeting |
| Management -> Strategist | "Bottleneck Delays" | 2-3 day approval kills reactive momentum |

**Wavebound implication:** Every handoff failure point is a place where the AI Layer 3 can eliminate entropy. The system should pre-package context so handoffs carry full fidelity.

---

## 6. The Seven Dashboard Tiles

The Role-Level Dashboard (roster view) must contain these seven intelligence tiles, each linked to a specific decision:

### 6.1 Roster Entropy Map (Anomaly Velocity)
- **What:** Artists deviating from 30-day baseline by >2 standard deviations
- **Decision:** Immediate budget reallocation or "Digital War Room" crisis response
- **Wavebound mapping:** Momentum tier + risk flags on roster cards

### 6.2 Format Alpha Index
- **What:** Which content formats are gaining algorithmic favor in the current 48-hour cycle
- **Decision:** Shift the "30-Piece Content Map" toward high-performing archetypes
- **Wavebound mapping:** Format spark scores + winner format on sound analysis

### 6.3 Conversion Alpha (Social-to-Stream Funnel)
- **What:** Efficiency of social reach converting to streaming intent (saves + playlist adds)
- **Decision:** Transition from Reach/Awareness to Conversion/Retention for specific campaigns
- **Wavebound mapping:** Save-to-Reach Ratio (not yet implemented — high priority)

### 6.4 Catalog Fuel Tracker
- **What:** Resurgence of legacy assets in the nostalgia loop
- **Decision:** Trigger official "Sped Up" or "Slowed + Reverb" releases for organic UGC
- **Wavebound mapping:** Catalog velocity alerts in artist_sound_velocity

### 6.5 Global Breach Alert
- **What:** Territories where content over-performs relative to local follower base
- **Decision:** Direct local marketing teams to localize content or trigger regional influencer seeding
- **Wavebound mapping:** Geography breakdown in sound analysis

### 6.6 Sentiment Pulse (Intent Intelligence)
- **What:** Comment depth and qualitative intent ("When is this dropping?" vs. generic fire emojis)
- **Decision:** Accelerate release dates or shift track-level priority
- **Wavebound mapping:** Comment sentiment + intent breakdown

### 6.7 Algorithmic Bucket Audit (Discovery Health)
- **What:** Where viewers come from — Following Feed vs. Search vs. Recommendation (FYP)
- **Decision:** Shift to "Niche Discovery" content if stuck in existing follower base
- **Wavebound mapping:** Not yet implemented — medium priority

---

## 7. The Artist Intelligence Drilldown

When you tap an artist, these are the modules that matter:

### 7.1 Retention Topology
Viewer decay curve across last 5 videos vs. genre benchmark. Where exactly is the artist losing the audience?

### 7.2 Hook Archetype Efficiency
Which hook type (Narrative / Visual / Audio-First) is driving highest completion rates? Hook-to-Save Ratio.

### 7.3 Audience Footprint Shift
Non-Follower Reach %, Reach-to-Follower Ratio, Share-to-Reach Ratio. Is the artist stuck in an echo chamber?

### 7.4 Platform Format Mix Recommendation
AI-generated optimal posting cadence for the artist's current cycle (Pre-Release / Release Week / Catalog Maintenance).

### 7.5 Comment Pulse & Intent Mapping
NLP categorization of audience interaction by intent. Distinguish bot chatter from genuine fan demand.

### 7.6 Attributed Streaming Lift
Direct correlation between specific social posts and DSP consumption spikes. Identifies "Viral Mirage" assets.

### 7.7 Catalog Fuel Index
Which older tracks show "Rejuvenation Delta." UGC Template Adoption Rate.

### 7.8 Competitive Gap Analysis
Benchmarks against algorithmically adjacent peer group. Share of Voice and Content Pillar Gap.

---

## 8. The Layer 3 Principle

### The Three Layers
1. **Layer 1 — Data Ingestion:** Raw platform data, streaming numbers, social metrics
2. **Layer 2 — Structured Analysis:** Velocity calculations, format breakdowns, trend detection
3. **Layer 3 — AI Judgment:** Deciding what matters right now for THIS person looking at THIS artist

### What Layer 3 Does
- Chooses the "Focused Sound" per artist based on full context (not just top UGC)
- Writes the morning brief that replaces the 08:00-08:45 manual scan
- Surfaces the 3-5 Decision Points for the standup
- Generates the 1-page executive brief
- Decides what to escalate vs. what to handle quietly

### The Rule
If a data point does not lead to a "Start / Stop / Continue" choice, it is noise. Every module, every number, every UI element must trace to a decision in the taxonomy (Section 4).

### AI Autonomous vs. AI Recommends vs. Human Only

| Decision Type | AI Role | Example |
|--------------|---------|---------|
| **AI Autonomous** | Executes without human input | Tagging content by hook archetype, calculating velocity |
| **AI Recommends** | Surfaces recommendation, human approves | "Pivot to Audio Hook B" — strategist taps Approve |
| **AI Prepares Context** | Packages data, human decides | Catalog spike — AI shows historical comparison, human judges if it has legs |
| **Human Only** | AI cannot replicate judgment | Crisis communication tone, artist relationship management |

---

## 9. Metrics That Matter vs. Vanity Metrics

### The Benchmarks (Alert Thresholds)

| Category | Metric | Low (Alert) | Healthy | High (Viral) |
|----------|--------|-------------|---------|---------------|
| Retention | 1.7s Decision Rate | < 45% | 50-65% | > 75% |
| Retention | Full Completion Rate | < 25% | 35-50% | > 65% |
| Conversion | Save-to-Reach Ratio | < 0.8% | 1.5-3.0% | > 5.0% |
| Conversion | Link-Click CTR | < 1.0% | 2.5-4.5% | > 7.0% |
| Interaction | Comment-to-Like Ratio | < 1:50 | 1:20-1:15 | > 1:10 |
| Discovery | Non-Follower Reach | < 30% | 45-60% | > 80% |
| Discovery | Sound Usage Velocity | < 50/day | 200-500/day | > 2,000/day |

### Kill List (Metrics to De-Emphasize)
- Raw view/listener counts
- Global popularity ranks
- Generic engagement rate (by followers)
- Static editorial calendar adherence
- Follower count as primary metric

### The Momentum Loop Score
`Share-to-Reach Ratio x Returning Audience Rate`

If this falls below 30-day average during release week: trigger "Narrative Pivot" alert. Stop promotional content, shift to community interaction (Q&A, fan duets).

---

## 10. Implementation Implications

### For Every Feature We Build

Before implementing, ask:
1. **Which decision in the taxonomy does this enable?** (Section 4)
2. **When in the daily rhythm would they see this?** (Section 3)
3. **Is this Layer 1/2/3?** If Layer 1 or 2, can we elevate it to Layer 3?
4. **Does this support the Spotted Pattern?** (Bold percentages, red/green indicators, heat maps)
5. **Is this standup-ready?** Can the strategist screen-share this during the 10am call?
6. **Is this exportable as a 1-page brief?** For the 16:00-17:30 executive synthesis?

### Artist Tiering (How the Dashboard Adapts)

| Tier | Dashboard Focus | Alert Trigger |
|------|----------------|---------------|
| Tier 1: Global Superstar | Competitive Gap & Global Breach | Drop in Share of Voice |
| Tier 2: Breaking Artist | Retention Topology & Hook Archetypes | Reach-to-Follower Ratio > 5.0 |
| Tier 3: Emerging/Catalog | Catalog Fuel Index & Sound Velocity | UGC Velocity Delta > 200% |

### Content Tiering for Release Lifecycle

| Phase | Time Window | Content Priority |
|-------|-----------|-----------------|
| Pre-Release | Weeks 12-2 | Batch 20-30 pieces. BTS, tutorials, alternate versions. |
| Launch | Day 1 - Week 1 | "Out Now" clips. 3 Stories/day minimum. Scale ad spend on viral signals. |
| Sustaining | Week 2-4 | Secondary content (acoustic, instrumentals). Celebrate fan UGC. |
| Catalog | Ongoing | Monitor for nostalgia loops. Reactivation protocol on spikes. |

### The Wavebound Brief Format
The AI-generated morning message should follow the "Presidential Daily Brief" style:

> **The Wavebound Brief (April 10, 2026):** Aggregate roster conversion from social to streaming has increased 14% WoW, led by [Artist X] whose narrative hook test in UK has reached 4.2x efficiency alpha. A nostalgia gap identified: three heritage tracks from 2016-2018 showing unexploited creation movement on TikTok in LATAM. Alert: [Artist Y]'s latest Reel flagged for suppression entropy (avg watch time < 35%) — immediate re-edit of first 1.5s or pivot to Audio-First template recommended.

### Anti-Patterns (What NOT to Build)

- Dense tables as the primary interface (kills the Spotted Pattern)
- Metrics without context ("12% increase" means nothing without "vs. benchmark" and "so what")
- Features that require training to understand (if it's not obvious in 3 seconds, redesign it)
- Reporting that requires the human to assemble the story (the AI assembles, the human approves)
- Any screen that shows data but doesn't suggest action

---

## Appendix: Role-Specific Vocabulary

| Term | Meaning |
|------|---------|
| Entropy Anomaly | Unexpected shift in audience behavior — either opportunity or crisis |
| Conversion Alpha | Efficiency of social reach converting to streaming intent |
| Retention Topology | Shape of the viewer decay curve |
| Hook Archetype | Category of first-3-second content strategy (Narrative/Visual/Audio) |
| Format Alpha | Which content format is currently winning algorithmic favor |
| Catalog Fuel | Legacy track being used as content template in current trends |
| Momentum Loop | Share-to-Reach x Returning Audience — measures durable growth |
| Viral Mirage | High views + zero conversion to streams. Wasted energy. |
| Pivot Brief | Data-driven instruction from strategist to content producer |
| Spotted Pattern | Eye-tracking scan behavior — fixate on bold numbers, skip body text |
| Digital War Room | Emergency response mode for artist crisis |
| Information Silhouette | Loss of context/nuance during a handoff between teams |
| The Fizzle Test | Determining if a negative trend will resolve itself or escalate |
