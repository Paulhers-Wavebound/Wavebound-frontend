# Bible_A&R.md — Wavebound A&R Intelligence Reference

> **Purpose:** Single reference for Claude Code when building A&R features for the Wavebound label portal. Distilled from 4 deep-research papers on Sony/Columbia A&R operations (2026).

---

## 1. WHO USES THIS & HOW

### Label Hierarchy (Sony Model — applies to all majors)
| Role | Roster Size | Time Split | What They Need From Wavebound |
|------|------------|------------|-------------------------------|
| **SVP of A&R** | Oversees label | 35% artist meetings, 25% deals, 20% strategy | Executive dashboard, risk simulations, greenlight proposals |
| **A&R Director** | 8-12 artists | 20% studio, 15% scouting, 15% data | Project health, producer matching, release window optimization |
| **A&R Manager** | 8-12 artists | 30% scouting, 20% data, 15% artist dev | Discovery radar, content strategy, format testing results |
| **A&R Coordinator** | Supports team | 60% admin/logistics | Automated clearance tracking, session booking, asset chasing |
| **A&R Scout** | Funnel filter | 80% digital discovery | Autonomous scouting alerts, watchlists, rise probability scores |

### Estimated Headcount Per Label (US)
Columbia: 89-124 | RCA: 74-109 | Epic: 68-95 | Latin: 55-82 | Other: 44-68

### Key People at Columbia (Primary Wavebound Target)
- **Ron Perry** — Chairman/CEO Columbia
- **Justin Eshak & Imran Majid** — Co-Heads of A&R
- **Manos** — EVP Columbia (our highest-priority contact)
- **Julie Swidler** — EVP Business & Legal Affairs (Sony)
- **Rob Stringer** — Chairman Sony Music Group (final sign-off >$500K)

---

## 2. THE SCOUTING THRESHOLD — Data Proof Required Before Labels Listen

### Minimum "Radar Entry" Metrics (Independent Artist)
| Metric | Baseline | Why It Matters |
|--------|----------|----------------|
| Spotify Monthly Listeners | 50K-100K+ | Proves streaming floor |
| Spotify Follower Growth | >15% MoM with >2K followers | "Save intent" — active fandom |
| TikTok/IG Followers | 10K+ combined, >5% engagement rate | Content creation potential |
| Spotify Save Rate | >10% of listeners | High-intent signal |
| Live Ticket Sales | 100-250 cap sell-outs | IRL proof beyond bots |
| Email/SMS List | 250+ subscribers | Owned audience |
| Track Completion Rate (30s) | >60% | Minimum for major label consideration |

### The "Unreleased Test"
Artists must provide 3-5 unreleased tracks of equal or better quality to prove they're not a one-hit viral wonder.

---

## 3. DISCOVERY PIPELINE — 5 Stages

### Discovery Channel Weights
| Channel | Weight | Primary Signal |
|---------|--------|----------------|
| Social Media Velocity | 45% | Format performance, cross-platform migration |
| Streaming Analytics | 25% | Retention topology, save rates |
| UGC / Sound Usage | 15% | Sound velocity, participation context |
| Personal Networks | 10% | Manager track record |
| Live & Local | 5% | Ticket conversion, crowd sentiment |

### Workflow Stages
1. **Flagging** (AI) → Artist hits velocity trigger → added to Watchlist
2. **Deep Dive** (Research) → Audience persona mapping, lookalike analysis → Persona Profile
3. **Assessment** (Predictive) → Intelligence report with Rise Probability Score → Dossier
4. **Validation** (Human) → A&R Director applies ear + cultural intuition → Shortlist
5. **Execution** (Meeting) → Artist meeting, vibe check, deal negotiation → Offer

### Timeline: Discovery → Signed Contract
- Normal: 3-6 months
- Viral Breakout (competitive bidding): As fast as 21 days

---

## 4. KEY METRICS WAVEBOUND MUST SURFACE

### Core "Alpha" Scores
| Metric | Definition | Wavebound Implementation |
|--------|-----------|--------------------------|
| **Growth Velocity (Vg)** | 2nd-order derivative of audience growth — rate of acceleration | `pct_change_7d` on `wb_observations` |
| **Geo-Footprint / Trigger Market Alpha** | Growth from early-adopter regions (SE Asia, LatAm) predicting Western success | `wb_observations_geo` → Expansion Radar |
| **Format Alpha** | Which version (original/sped-up/slowed/stems) drives most engagement | Track across platforms |
| **Comment Intent** | NLP: Low ("fire emoji"), High ("when are you coming to London?"), Transaction ("where can I buy?") | `wb_tiktok_comments` classification |
| **Conversion Alpha** | Ratio of casual listeners → superfans (TikTok viewer → Spotify follower → email) | Cross-platform funnel |
| **Audience Migration** | % completing: Discovery → Engagement → Following → Conversion | Fan journey tracking |
| **Ghost Curve** | Compare artist's trajectory to historical breakouts at same stage | Historical comparables model |
| **Rise Probability (P_rise)** | `(wV·V + wR·R + wC·C) / D30` — weighted velocity, retention, conversion over 30-day decay | Composite scoring |

### The Executive Dashboard Views
| View | Primary Metric | Maps To |
|------|---------------|---------|
| Talent Radar | Rise Probability Score (1-10) | Discovery/Scouting |
| Risk Simulator | Projected Breakeven (months) | Deal evaluation |
| Legal Pulse | Contractual Velocity (deal stages) | Business Affairs |
| Integrity Monitor | Authenticity/Bot Score | Quality filter |
| Geographic Heatmap | Trigger Market Export Alpha | Expansion Radar |

---

## 5. DEAL STRUCTURE — What Labels Evaluate

### Advance Tiers
| Tier | Advance (Album 1) | Terms |
|------|-------------------|-------|
| Development | $50K-$150K | 1 Firm + 3 Option Albums |
| Viral Breakout | $250K-$750K | 1 Firm + 2 Options, aggressive marketing |
| Established/Indie-Major | $1M+ | 1 Firm + 1 Option, potential 50/50 profit share |

### 360 Participation
- Live Touring: 10-25% net
- Merch: 15-30% gross
- Endorsements: 20% net
- "Basket Clause": Royalty on future revenue streams not yet invented

### ROI Model
```
ROI = (Σ Rt/(1+i)^t - (A+C)) / (A+C)
```
Where: Rt = net revenue year t, i = risk-adjusted discount rate, A = advance, C = production + marketing costs. Labels target 10-15% IRR over 5-7 year / 3-4 album projection.

### Budget Sign-off Chain
1. A&R Council → Creative + Data approval
2. Business Affairs / Legal → Contract + Clearance
3. SVP Finance → Budget + ROI
4. Label Chairman (e.g. Ron Perry) → Imprint sign-off
5. SMG Chairman (Rob Stringer) → Required for >$500K total commitment

### Why Deals Die (30-40% failure rate)
| Reason | What Wavebound Can Flag |
|--------|------------------------|
| Ownership gaps on early viral masters | Rights/metadata audit |
| Metadata corruption / frozen royalties | Data quality scoring |
| Cultural mismatch (manager vs label vision) | Sentiment analysis |
| ROI model can't support the advance | Predictive P&L |
| Predatory prior manager contracts | Contract risk flags |

---

## 6. POST-SIGNING LIFECYCLE — What A&R Manages

### Development Phases
| Phase | Timeline | Focus |
|-------|----------|-------|
| Incubation | Months 1-6 | Creative exploration, brand building, profile singles |
| Momentum | Months 7-12 | Higher output frequency, format testing, sync pitching |
| Global Launch | Months 13-24 | Debut EP/album, major marketing spend, touring |

### Ongoing A&R Responsibilities
- Producer/songwriter matching (data-driven "Jump Scores" + sonic DNA)
- Studio session oversight + budget tracking
- Split sheet enforcement (must be signed before collaborator leaves studio)
- Format testing (original, sped-up, slowed-reverb, stems for UGC)
- Release window optimization
- Cross-functional coordination: Marketing, Sync, Legal, International
- Content strategy for short-form video (TikTok/Reels/Shorts)

---

## 7. EXISTING TOOLS IN THE ECOSYSTEM

### What Labels Currently Use
| Tool | Function | Wavebound Advantage |
|------|----------|---------------------|
| **SONIC** (Sony internal) | Data + asset management, catalog search | We're external — works across labels |
| **The Hub** (Sony internal) | Project management, global coordination | N/A — internal ops |
| **Chartmetric** | Track Scores, playlist analysis, geographic heat | We go deeper: real-time wb_ data, TikTok comments, anomaly detection |
| **Viberate** | TikTok analytics, rise probability | We own the raw data pipeline, not dependent on their API |
| **Soundcharts** | Radio airplay alerts, social spikes | We combine with streaming + TikTok at observation level |
| **Sodatone** | Producer "Jump Scores," discovery | We can build this into producer matching |
| **Luminate** | Market-level consumption data | We complement with artist-level cross-platform intelligence |
| **WhatsApp** | Actual high-speed A&R communication | Our Label Intelligence Assistant replaces this need |

### Key Gap Wavebound Fills
> No existing tool shows labels the markets they are NOT in but should be. Expansion Radar owns this gap.

---

## 8. PAIN POINTS — What A&R Wishes Existed

### Top Time Sinks (Build Features That Kill These)
1. **Data silos / "Spreadsheet Sprawl"** — 50%+ of labels still use Excel for artist intelligence
2. **Manual demo scanning** — 7-second gut decisions on thousands of weekly submissions
3. **Legal/clearance latency** — Sample clearance takes days-weeks, stalls releases
4. **Asset chasing** — Following up for stems, metadata, split sheets
5. **Multi-tool fatigue** — Jumping between 6+ SaaS platforms kills creative momentum
6. **Report compilation** — Pulling from Chartmetric + Viberate + internal finance manually
7. **Approval bottlenecks** — "Legal is where deals go to die"

### The Wish List (Direct Quotes from A&R)
- "Real-time 'Copyright Clean' button for demos before we even hit play"
- "See through the 'Bot Fog' — know which fans are real people with credit cards"
- "Contract that drafts itself based on verbal terms agreed in the studio"
- "Simulate impact of a global tour on artist's mental health and creative output"

---

## 9. WAVEBOUND FEATURE MAPPING

### Layer 1: Process Intelligence (What We See)
- Cross-platform streaming velocity, social signals across 8 platforms, 80+ countries
- Growth acceleration (pct_change_7d), z-scores, anomaly detection
- Geographic heat maps via `wb_observations_geo`
- TikTok sound velocity, comment intent classification
- Historical comparables / Ghost Curves

### Layer 2: Synthesis & Briefing (What We Produce)
- **Artist Intelligence Briefs**: Vitals, signability checklist, risk simulation
- **Expansion Radar**: Markets artist is NOT in but should be
- **Proactive Anomaly Alerts**: "This artist just spiked 300% in Indonesia"
- **Fan Briefs**: Audience composition, intent classification, superfan density
- **Competitive Intelligence**: Which other labels are circling

### Layer 3: Agentic Execution (What We Automate)
- Daily scoring of roster + watchlist artists
- Custom filtering by label-specific criteria
- Predictive alerting on velocity triggers
- Content strategy recommendations based on format alpha
- Release window simulation

### Feature Priority for Label Portal
| Feature | Target User | Status |
|---------|------------|--------|
| Expansion Radar | A&R Director/Manager | Live (real wb_ data) |
| Artist Health Dashboard | All A&R | In progress |
| Sound Intelligence | Scout/Manager | wb_tiktok pipeline live |
| Fan Briefs | Director/SVP | Designed |
| Label Intelligence Assistant | All | Edge function live |
| Anomaly Alerts | Manager/Director | Post April 10 (velocity data required) |
| Ghost Curve Comparables | SVP/Director | Future |
| Release Window Simulator | Director/SVP | Future |

---

## 10. IMPLEMENTATION RULES

### When Building A&R Features:
1. **Always think in the label's language**: "Rise Probability," "Growth Velocity," "Trigger Markets," "Conversion Alpha" — not generic analytics terms
2. **Surface leading indicators, not lagging**: Social signals predict streaming; streaming confirms. Show what's COMING, not what happened
3. **Respect the hierarchy**: SVPs need strategic briefs. Scouts need raw feeds. Don't give executives scout-level noise
4. **Bot detection is non-negotiable**: Any metric shown to a label must account for authenticity. Flag suspicious patterns
5. **Geographic granularity matters**: Labels think in territories (US, UK, DACH, Nordics, LatAm, SEA). Surface data at this level
6. **Format matters**: Track which version of a song (original/sped-up/slowed) is driving engagement — labels use this for release strategy
7. **Comment intent > comment volume**: 100 "when are you touring London?" comments > 10,000 fire emojis
8. **Cross-platform migration is the killer metric**: TikTok views → Spotify saves → email signups. Show the funnel
9. **Benchmarking creates network effects**: When labels compare rosters on shared Wavebound metrics, it becomes infrastructure, not a tool
10. **Monday morning meetings are the use case**: Every feature should answer "Can I present this to the A&R Council on Monday?"

### Data Architecture Alignment
- `wb_entities` → Artists (the roster + watchlist)
- `wb_observations` → Platform metrics over time (the health signals)
- `wb_observations_geo` → Geographic breakdown (Expansion Radar fuel)
- `wb_tiktok_videos` → Per-video performance (format alpha, sound velocity)
- `wb_tiktok_comments` → Comment intent classification (fan brief fuel)
- `wb_platform_ids` → Cross-platform identity resolution (the foundation)
- `wb_entity_relationships` → Label-artist, artist-producer connections

---

## 11. COMPETITIVE POSITIONING

### Why Wavebound Wins
| Competitor | What They Do | What They Miss |
|-----------|-------------|----------------|
| Chartmetric | Dashboards + Track Scores | No proactive intelligence, no territorial gaps, no anomaly detection |
| Viberate | TikTok analytics + rise scores | Single-platform, no cross-platform migration tracking |
| Soundcharts | Alerts + team workspace | No AI synthesis, no predictive modeling |
| Luminate | Market-level data | No artist-level real-time intelligence |
| Spotify for Artists | First-party streaming data | Single platform, no competitive intelligence |

### Wavebound's Unique Value
1. **Cross-platform observation layer** — 8 platforms, 80+ countries, unified ontology
2. **Leading indicators** — Social velocity predicts streaming 7-10 days ahead
3. **Expansion Radar** — Only tool showing untapped geographic markets
4. **AI Intelligence Briefs** — Not dashboards, but synthesized recommendations
5. **Anomaly detection** — Proactive alerts, not reactive reports
6. **Comment intent classification** — Qualitative intelligence at scale
7. **Network effect via shared metrics** — Becomes industry infrastructure

---

*Last updated: April 2026. Source: 4 deep-research papers on Sony/Columbia A&R operations.*
