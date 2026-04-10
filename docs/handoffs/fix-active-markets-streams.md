# Fix: Active Markets Missing `estimated_monthly_streams`

## Problem

Every active market dot on the Expansion Radar map tooltip shows "0 streams" because the `activeMarkets` array in `expansion-radar-v2.ts` never includes `estimated_monthly_streams` or `estimated_revenue_monthly`. These fields ARE included for expansion opportunities (line 322) but were missed for active markets.

## Fix

In `edge-functions/expansion-radar-v2.ts`, the `activeMarkets.push()` block starting at line 229 already looks up `oppData` from `opportunityByCountry` and uses it for discovery fields. Add the two missing stream/revenue fields right after the `recommended_action` line (line 265):

```diff
         // Opportunity context (for markets with growth room)
         opportunity_score: oppData?.opportunity_score || null,
         recommended_action: oppData?.recommended_action || "maintain",
+
+        // Stream estimates (from opportunity data — used by frontend map tooltip + dot sizing)
+        estimated_monthly_streams: oppData?.estimated_monthly_streams || null,
+        estimated_revenue_monthly: oppData?.estimated_revenue_monthly || null,
       });
```

That's it — 2 lines. `oppData` is already resolved on line 227 from the `opportunityByCountry` map.

## Deploy

```bash
supabase functions deploy expansion-radar-v2 --project-ref kxvgbowrkmowuyezoeke --use-api
```

## Verify

After deploy, call the endpoint for any artist and confirm active market entries now have `estimated_monthly_streams` populated (non-null for markets that also exist in `market_opportunity_v2`).

## Frontend state

A frontend workaround is already deployed that falls back to `chart_streams` and hides "0 streams" text. Once this backend fix lands, the frontend will use the proper `estimated_monthly_streams` value automatically — no frontend changes needed.
