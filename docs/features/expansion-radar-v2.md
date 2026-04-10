# Expansion Radar V2

Cross-platform market expansion intelligence powered by 5 new compression algorithms from the V2 backend.

## Who uses it

Senior VPs of Digital Marketing, label A&R teams — anyone deciding where to invest marketing spend for an artist's geographic expansion.

## What it does

Analyzes an artist's presence across 7 platforms in 70+ markets and surfaces:

- **Market Momentum**: Active markets with velocity trends and 7-day deltas
- **Early Signal Radar**: Markets where discovery demand (Shazam, TikTok) is forming ahead of streaming — pre-breakout detection
- **Entry Songs**: Per-market song recommendations (which song to push where)
- **Spillover Timeline**: Predicted market cascade (e.g., Mexico → Colombia → Argentina)
- **Market Heat Grid**: Cross-platform signal strength with velocity + discovery scores
- **Expansion Opportunity Cards**: Top markets with urgency badges, entry song recs, spillover context, and transparent score breakdowns
- **Comparable Artists**: Market overlap analysis showing unique markets to target
- **Revenue Sizing**: Estimated uncaptured monthly revenue across all expansion markets
- **Arbitrage Intelligence**: Market-level CPM, fan value, ROI vs US, and action labels (GO NOW / TEST / OPTIMIZE / BASELINE / MONITOR)
- **Top Expansion Banner**: Hero callout for the best signal × arbitrage market
- **Why This Market**: Expandable cards with signal context, opportunity metrics (CPM, merch, live, ticket price, YoY growth), and templated campaign recommendations

## Correct behavior

- Artist selector shows V2 fields: artist_score, tier badge, trend, cross-platform signal
- Map shows velocity arrows on dots, blue glow + radar ping on pre-breakout markets
- Early Signal Radar shows discovery-vs-streaming divergence gauges for pre_breakout and early_demand signals
- Entry Songs shows #1 recommended song per market with velocity badge and playlist reach
- Spillover Timeline shows cascade flow from active markets with probability badges and estimated days
- Opportunity cards show urgency (ACT NOW/PLAN/MONITOR), window confidence (solid/dashed/dotted border), entry song, spillover context
- Score breakdown is expandable on opportunity cards
- Revenue sizing shows headline uncaptured amount and per-market breakdown with per-stream rates
- Coming Soon placeholders (Comment Intelligence, Niche Migration) removed

## Edge cases

- **No pre-breakout signals**: Early Signal Radar panel shows "No early signals detected"
- **No entry songs**: Entry Songs section hidden
- **No spillover predictions**: Spillover Timeline hidden
- **No expansion opportunities**: Multiple sections gracefully hide
- **Empty discovery_radar**: Right panel empty state
- **Zero revenue**: Revenue section hidden
- **No market intelligence data**: ROI and Action columns show "—" dash, Why This Market shows fallback message
- **Market intel loading slower than radar**: Grid renders without arbitrage columns, then fills in when intel arrives

## API

POST `expansion-radar-v2` with `{ entity_id }`. Response includes `_meta.version: "v2"`.
Old `expansion-radar` endpoint unchanged for backward compatibility.
