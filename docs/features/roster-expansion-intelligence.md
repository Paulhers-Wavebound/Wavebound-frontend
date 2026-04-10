# Roster Expansion Intelligence

Enriches the Expansion Radar with roster-specific signals (TikTok audience geo, comment language, fan intensity, touring, platform fit, playlist reach) to give label executives dramatically higher-signal expansion recommendations.

## Who uses it and why

Senior label executives (VP/SVP level) deciding where to push roster artists next and how to allocate marketing budget across markets. Instead of generic chart-derived scores, they see evidence like "8.2% of TikTok audience in Brazil, 43% of comments in Portuguese, Shazam pre-breakout signal detected."

## Correct behavior

- Roster artists (those with `label_id` in `artist_intelligence`) show enriched UI automatically
- Non-roster artists fall back to standard Expansion Radar V2 (no regression)
- RosterBadge pill appears next to methodology explainer
- MarketIntelligenceCards show top 6 markets with:
  - Enriched score (0-100) alongside original chart-based score
  - Confidence meter (1-9 dots showing signal convergence)
  - Evidence bullets auto-generated from data
  - Score breakdown bar (chart % vs roster %)
- Clicking a card opens EvidenceWall drawer with full signal breakdown
- BudgetAllocationChart shows % distribution across top 8 markets with ROI index
- All existing components (map, heat grid, spillover, entry songs, etc.) still render

## Edge cases

- **No TikTok audience geo data:** Audience signal score = 0, other signals still contribute
- **No comment sentiment data:** Language and fan intensity signals = 0
- **No touring data:** Touring alignment = 0
- **Non-roster artist:** Full fallback to expansion-radar-v2 behavior, no roster fields in response
- **Empty enriched opportunities:** MarketIntelligenceCards hidden, falls through to standard cards
- **Loading state:** Same skeleton loader as V2
- **Error state:** Same error component as V2

## Data flow

```
wb_observations_geo (tiktok_audience_pct) ─┐
wb_comment_sentiment (language_distribution) ─┤
artist_touring_signal ─────────────────────────┤
artist_audience_footprint ─────────────────────┤──→ roster_expansion_intelligence (dbt L2)
artist_playlist_intelligence ──────────────────┤       ↓
market_opportunity_v2 (chart backbone) ────────┘  expansion-intelligence (edge fn)
                                                      ↓
                                                  useExpansionRadar hook
                                                      ↓
                                              LabelExpansionRadar page
                                                ├─ MarketIntelligenceCards
                                                ├─ BudgetAllocationChart
                                                └─ EvidenceWall (drawer)
```

## API

`POST /functions/v1/expansion-intelligence` with `{ entity_id }`. Returns standard `ExpansionRadarResponse` extended with `enriched_opportunities`, `roster_signals`, `market_evidence`, and `budget_allocation` when `_meta.is_roster === true`.
