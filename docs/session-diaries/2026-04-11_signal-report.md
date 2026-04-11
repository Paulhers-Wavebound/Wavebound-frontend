# Session Diary: Signal Report — Morning Brief Redesign

**Date:** 2026-04-11
**Task:** Replace the paragraph-based morning brief with a Signal Report that replicates the strategist's 08:00-10:00 manual triage

## What Changed

### New Types & Generator (`contentDashboardHelpers.ts`)

**`SignalReport` interface** — Full structured morning brief:
- `rosterPulse`: 1-sentence overall direction + key metrics
- `decisionPoints`: 3-5 `DecisionPoint` objects (the standup content)
- `riskAlerts`: critical/warning risk_flags surfaced from roster
- `todos`: actionable checklist derived from decision points
- `metrics`: roster-level numbers for the header

**`DecisionPoint` interface** — Each critical decision:
- `category`: maps to Bible taxonomy (MOMENTUM_CAPTURE, BUDGET_REALLOCATION, FORMAT_PIVOT, CATALOG_ACTIVATION, CONTENT_PIPELINE, CRISIS_RESPONSE, CONVERSION_ALERT)
- `signal`: what happened (specific artist + specific data)
- `decision`: what to do (actionable, not generic)
- `urgency`: "now" | "today" | "this_week"
- `evidence`: supporting data chips

**`generateSignalReport()` function** — Uses ALL available data:
1. **MOMENTUM_CAPTURE**: Artists with views delta > +25%, uses best_format + best_format_vs_median + save_to_reach_pct
2. **BUDGET_REALLOCATION**: Content anomaly spikes (views_spike), uses deviation_multiple + insight_message
3. **FORMAT_PIVOT**: Declining artists with clear best format, uses worst_format + hook_score + format_shift history
4. **CATALOG_ACTIVATION**: weekly_pulse.catalogue_alert OR catalog-tier artists with sound velocity "up"
5. **CONTENT_PIPELINE**: Posting droughts 7+ days, checks has_content_plan flag
6. **CONVERSION_ALERT** (Viral Mirage): High views + low save_to_reach_pct (<0.8%), the Bible's #1 anti-metric
7. **AI Focus Sounds**: weekly_pulse.focused_sound for artists not already covered

Sorted by urgency (now > today > this_week), capped at 5 decision points.

### New Component (`SignalReportCard.tsx`)

Renders the Signal Report with four sections:
1. **Header**: Greeting + roster pulse + metric pills (velocity %, save rate, active/total)
2. **Risk Alerts**: Red/amber alert bars for critical/warning risk_flags
3. **Decision Points**: Each with category icon + urgency badge + signal + decision + evidence chips
4. **Today's Actions**: Interactive TODO checklist with checkboxes, urgency badges, show more/less

Category icons and colors:
- Scale (green TrendingUp), Reallocate (yellow Zap), Pivot (blue Target), Catalog (purple Music2), Pipeline (orange Clock), Crisis (red ShieldAlert), Conversion (red Bookmark)

Urgency badges: NOW (red), TODAY (amber), THIS WEEK (muted)

### Dashboard Integration (`ContentSocialDashboard.tsx`)

Priority chain:
1. `presidentBrief.text` (AI-generated from backend) → PresidentBriefCard
2. `signalReport` (client-generated from all data) → **SignalReportCard** (new primary)
3. Legacy ContentBriefingCard fallback

The Signal Report now gets `songUGC` as input alongside artists and anomalies, unlocking catalog performance data for decision points.

`generatePDBBriefing()` retained as text-only fallback — now delegates to `generateSignalReport()` internally.

## Why

The Bible (§3) documents that strategists spend 08:00-10:00 manually triaging dashboards, then present a "Signal Report" at standup — 3-5 critical Decision Points with specific artist + signal + recommended action. Wavebound should have that ready when they open the app at 8am.

The old PDB briefing was a paragraph summary. The new Signal Report is the actual document they'd present at standup, with an interactive TODO list so they can track what they've acted on.

## What Was Tested
- `npx tsc --noEmit` — clean compile, zero errors

## What to Verify in Browser
1. The Signal Report card should appear at the top of the Content & Social dashboard
2. Should show: greeting, roster pulse, metric pills, decision points with evidence chips, TODO checklist
3. Decision points should be sorted by urgency (NOW first)
4. TODO checkboxes should be interactive (check/uncheck)
5. "Chat about this" should navigate to assistant with the signal report as context
6. Risk alerts should appear in red/amber bars between the pulse and decision points

## Data Dependencies
The Signal Report is only as good as the data feeding it. Key data that enriches it:
- `roster_dashboard_metrics.risk_flags` — drives risk alerts
- `content_anomalies` — drives BUDGET_REALLOCATION and MOMENTUM_CAPTURE
- `artist_content_dna.best_format` / `worst_format` — drives FORMAT_PIVOT specificity
- `save_to_reach_pct` (calculated from avg_saves_30d / avg_views_30d) — drives CONVERSION_ALERT
- `weekly_pulse.focused_sound` / `catalogue_alert` — drives AI-enhanced decision points
- `artist_content_evolution.format_shift` — adds context to FORMAT_PIVOT decisions
