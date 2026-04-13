# Culture Genome — 3D Semantic Knowledge Graph

## What it does

Interactive 3D visualization that maps all scraped creators/artists as a galaxy of semantic clusters, giving A&R executives a spatial view of the new artist market.

## Who uses it and why

- **SVP of A&R** — See the entire market landscape at a glance, identify emerging cultural waves before competitors
- **A&R Director** — Explore which clusters are growing, find white-space opportunities between genres
- **A&R Scout** — Discover new prospects by exploring clusters similar to successful signings

## Route

`/label/culture-genome`

## Correct behavior

- Page loads with 500 mock nodes in 8 color-coded clusters, auto-rotating camera
- Nodes are sized by viral momentum (larger = higher viral_score)
- Nodes are colored by cluster assignment
- Hovering a node highlights it (orange accent), shows tooltip in top-right with metadata
- Clicking a node opens bottom detail panel showing:
  - Cluster name, genre, mood, member count
  - Sorted table of cluster members with viral score, views, tier, format, engagement
  - Clicked node is highlighted in the table
- Layer toggle (top-left): Blended | Musical | Visual | Viral
  - Switching layers animates all nodes to new positions over ~1 second
- Search (top-right): fuzzy filter on creator display names
- Cluster legend (bottom-left): color dots with cluster labels and member counts
- Semi-transparent galaxy blobs surround each cluster
- Similarity edges appear when zooming close (fade in under 40 units camera distance)
- Bloom post-processing gives cinematic glow
- Star field background rotates slowly

## Edge cases

- **Empty state:** If no data, show "No genome data available" centered message
- **Error state:** WebGL failure → error boundary with fallback message (same pattern as PulseGlobe)
- **Loading state:** (future, when real data) Pulsing dot constellation skeleton
- **Mobile:** Canvas renders but touch controls replace mouse; detail panel takes full width
- **Low-power devices:** Bloom may cause frame drops — could be toggled off

## Data source

Currently mock data (`src/data/mockGenomeData.ts`). Future: `get-culture-genome` edge function reading from `culture_genome_nodes` + `culture_genome_clusters` tables.
