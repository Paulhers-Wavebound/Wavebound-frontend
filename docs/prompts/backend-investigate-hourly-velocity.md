# Task: Investigate Hourly Velocity Data Feasibility

Date: 2026-03-29

**This is an investigation only — do NOT implement anything.**

## Context

The frontend velocity charts and format trends charts currently only support daily granularity. The API returns `VelocityDay[]` with one entry per day (`{ date: "Mar 22", videos: 30, avg_views: 2127 }`). There's no hourly data, so a "24H" time range view isn't possible.

We want to know if hourly velocity is feasible without increasing costs.

## What To Investigate

1. Does the current scraper already collect timestamps with hour-level precision on individual videos?
2. Could hourly aggregation be derived from existing scraped data without additional API calls?
3. What would the cost impact be if we needed to re-scrape or store more granular data?
4. Is there a lightweight way to add an `hourly_velocity: { hour: string, videos: number }[]` field for the last 24-48 hours using only data we already have?

## Constraint

Do NOT add any new scraper calls or increase API costs. Only consider approaches that derive hourly data from what's already being collected.

## Expected Output

Report your findings — what's possible, what's not, and why. Paul will decide whether to proceed.

## Relevant API Shape

```typescript
interface VelocityDay {
  date: string;    // e.g., "Mar 22"
  videos: number;  // videos posted that day
  avg_views: number;
}

// Current response returns: velocity: VelocityDay[]
```

## Supabase

- Project ref: `kxvgbowrkmowuyezoeke`
- Edge Functions base: `https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1`
