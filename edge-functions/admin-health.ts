/**
 * Admin health monitor — returns scraper run status, data totals, and extended intelligence stats.
 * GET — returns latest run per scraper + table row counts + extended stats
 * GET ?scraper_name=X — returns last 10 runs for a specific scraper
 *
 * Admin-only: validates JWT and checks user_profiles.label_role = 'admin'
 */
import { createClient } from "npm:@supabase/supabase-js@2";

var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Overdue thresholds in hours
var OVERDUE_HOURS: Record<string, number> = {
  "4x_daily": 8,
  daily: 26,
  free_apis: 26,
  dbt: 26,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    var supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    var serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    var anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    var supabase = createClient(supabaseUrl, serviceKey);

    // Auth — require admin
    var authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    var userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    var {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }

    // Check admin status — label_role = 'admin' is the source of truth
    var { data: profile } = await supabase
      .from("user_profiles")
      .select("label_role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || profile.label_role !== "admin") {
      return jsonResponse({ error: "Admin access required" }, 403);
    }

    var url = new URL(req.url);
    var scraperName = url.searchParams.get("scraper_name");

    // Detail view: last 10 runs for a specific scraper
    if (scraperName) {
      var { data: runs, error: runsErr } = await supabase
        .from("scraper_runs")
        .select("*")
        .eq("scraper_name", scraperName)
        .order("started_at", { ascending: false })
        .limit(10);

      if (runsErr) {
        return jsonResponse({ error: runsErr.message }, 500);
      }

      return jsonResponse({ scraper_name: scraperName, runs: runs || [] });
    }

    // ═══════════════════════════════════════════════════════
    // Run ALL queries in parallel via Promise.all
    // ═══════════════════════════════════════════════════════
    // dbt model tables — for per-layer row counts
    var DBT_COMPRESSION_TABLES = [
      "daily_summaries",
      "daily_summaries_geo",
      "song_velocity",
      "artist_catalog_summary",
      "playlist_momentum",
      "instagram_artist_daily",
      "instagram_video_summary",
      "tiktok_artist_daily",
      "tiktok_video_summary",
      "tiktok_global_benchmarks",
    ];
    var DBT_HEALTH_TABLES = [
      "entity_health",
      "song_health",
      "market_health",
      "platform_coverage",
      "cross_platform_signal",
      "discovery_streaming_divergence",
      "geographic_footprint",
      "market_velocity",
    ];
    var DBT_INTELLIGENCE_TABLES = [
      "artist_score",
      "artist_momentum",
      "artist_alerts",
      "artist_intel_feed",
      "artist_tiktok_profile",
      "catalog_intelligence",
      "catalog_tiktok_performance",
      "cross_platform_arbitrage",
      "market_opportunity",
      "market_opportunity_v2",
      "market_spillover",
      "roster_overview",
      "song_market_matrix",
      "top_artist_comments",
      "top_comments_weekly",
    ];

    // Build count queries for all dbt model tables
    var dbtCountQueries = [
      ...DBT_COMPRESSION_TABLES,
      ...DBT_HEALTH_TABLES,
      ...DBT_INTELLIGENCE_TABLES,
      "anomalies",
    ].map(function (t) {
      return supabase.from(t).select("*", { count: "exact", head: true });
    });

    var [
      latestRunsResult,
      tableCountsResult,
      extResult,
      handleHealthResult,
      songEntitiesResult,
      songsObservedTodayResult,
      ...dbtCountResults
    ] = await Promise.all([
      // Scraper runs — latest per scraper
      supabase.rpc("get_latest_scraper_runs"),
      // Data totals — lightweight dedicated RPC (12s, reliable for partitioned tables)
      supabase.rpc("get_table_counts"),
      // Extended health stats (all sections including ops dashboard)
      supabase.rpc("get_admin_health_extended"),
      // Handle health stats (per-platform alive/dead/stale/changed)
      supabase.rpc("get_handle_health_stats"),
      // Song stream coverage — total song entities
      supabase
        .from("wb_entities")
        .select("*", { count: "exact", head: true })
        .eq("entity_type", "song"),
      // Songs with daily_streams observed in last 26 hours
      supabase
        .from("wb_observations")
        .select("entity_id", { count: "exact", head: true })
        .eq("metric", "daily_streams")
        .eq("source", "kworb_artist_detail")
        .gte(
          "observed_at",
          new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        ),
      // dbt model row counts
      ...dbtCountQueries,
    ]);

    // Parse dbt model row counts into per-layer arrays
    var allDbtTables = [
      ...DBT_COMPRESSION_TABLES,
      ...DBT_HEALTH_TABLES,
      ...DBT_INTELLIGENCE_TABLES,
      "anomalies",
    ];
    var dbtModelCounts: Record<string, number> = {};
    for (var di = 0; di < allDbtTables.length; di++) {
      dbtModelCounts[allDbtTables[di]] = dbtCountResults[di]?.count || 0;
    }
    var compressionModels = DBT_COMPRESSION_TABLES.map(function (t) {
      return { name: t, rows: dbtModelCounts[t] || 0 };
    });
    var healthModels = DBT_HEALTH_TABLES.map(function (t) {
      return { name: t, rows: dbtModelCounts[t] || 0 };
    });
    var intelligenceModels = DBT_INTELLIGENCE_TABLES.map(function (t) {
      return { name: t, rows: dbtModelCounts[t] || 0 };
    });
    var anomaliesRows = dbtModelCounts["anomalies"] || 0;

    // ── Scraper Runs (with fallback if RPC doesn't exist) ──
    var latestRuns = latestRunsResult.data;
    if (latestRunsResult.error) {
      // RPC not available — fetch enough rows to capture all scrapers.
      // High-frequency scrapers (carl/oscar every 2min) used to consume the
      // old limit(200), hiding lower-frequency ones like kworb (4x daily).
      var { data: allRuns } = await supabase
        .from("scraper_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(5000);

      var seen = new Set<string>();
      latestRuns = [];
      for (var run of allRuns || []) {
        if (!seen.has(run.scraper_name)) {
          seen.add(run.scraper_name);
          latestRuns.push(run);
        }
      }
    }

    // Compute health status for each scraper
    var now = Date.now();
    var scrapers = (latestRuns || []).map(function (run: any) {
      var overdueHours = OVERDUE_HOURS[run.scraper_group] || 26;
      var lastSuccessAge =
        run.status === "success" && run.completed_at
          ? (now - new Date(run.completed_at).getTime()) / (1000 * 60 * 60)
          : null;

      var health = "unknown";
      if (run.status === "running") {
        health = "running";
      } else if (run.status === "error") {
        health = "error";
      } else if (run.status === "success") {
        health =
          lastSuccessAge !== null && lastSuccessAge > overdueHours
            ? "overdue"
            : "healthy";
      }

      return {
        scraper_name: run.scraper_name,
        scraper_group: run.scraper_group,
        status: run.status,
        health: health,
        started_at: run.started_at,
        completed_at: run.completed_at,
        duration_ms: run.duration_ms,
        rows_inserted: run.rows_inserted,
        entities_created: run.entities_created,
        entities_matched: run.entities_matched,
        error_message: run.error_message,
        metadata: run.metadata,
        hours_since_completion:
          lastSuccessAge !== null ? Math.round(lastSuccessAge * 10) / 10 : null,
        overdue_threshold_hours: overdueHours,
      };
    });

    // Group by scraper_group
    var groups: Record<string, any[]> = {};
    for (var s of scrapers) {
      if (!groups[s.scraper_group]) groups[s.scraper_group] = [];
      groups[s.scraper_group].push(s);
    }

    // Overall health: red if any error in last 24h, yellow if any overdue, green otherwise
    var hasRecentError = scrapers.some(function (s: any) {
      return (
        s.status === "error" &&
        s.completed_at &&
        now - new Date(s.completed_at).getTime() < 24 * 60 * 60 * 1000
      );
    });
    var hasOverdue = scrapers.some(function (s: any) {
      return s.health === "overdue";
    });
    var overallHealth = hasRecentError
      ? "red"
      : hasOverdue
        ? "yellow"
        : "green";

    // ── Data Totals — from dedicated get_table_counts() RPC ──
    var tc =
      !tableCountsResult.error && tableCountsResult.data
        ? tableCountsResult.data
        : null;
    var totals: Record<string, number> = {
      wb_entities: tc?.wb_entities || 0,
      wb_observations: tc?.wb_observations || 0,
      wb_observations_geo: tc?.wb_observations_geo || 0,
      wb_platform_ids: tc?.wb_platform_ids || 0,
      wb_entity_relationships: tc?.wb_entity_relationships || 0,
    };

    // ═══════════════════════════════════════════════════════
    // EXTENDED HEALTH STATS — from get_admin_health_extended() RPC
    // ═══════════════════════════════════════════════════════
    var dataFreshness: any[] = [];
    var velocityStatus: any = null;
    var accumulation: any = null;
    var coverage: any = null;
    var platformBreakdown: any[] = [];
    var dbtHealth: any = null;
    var topEntities: any = null;
    var dataQuality: any = null;
    var apiQuotas: any = null;
    var platformIdTrend: any[] = [];
    var platformIdDaily: any[] = [];
    var unresolvedEntities: any = null;
    var scraperRunHistory: any[] = [];

    var ext = !extResult.error && extResult.data ? extResult.data : null;

    if (ext) {
      // ── 1. Data Freshness ──
      var freshMap: Record<string, any> = {};

      for (var of_ of ext.obs_freshness || []) {
        freshMap[of_.platform] = {
          platform: of_.platform,
          last_observation_at: of_.last_observation_at,
          observation_count: of_.observation_count,
          geo_observation_count: 0,
          unique_countries: 0,
        };
      }
      for (var gf of ext.geo_freshness || []) {
        if (!freshMap[gf.platform]) {
          freshMap[gf.platform] = {
            platform: gf.platform,
            last_observation_at: gf.last_observation_at,
            observation_count: 0,
            geo_observation_count: gf.observation_count,
            unique_countries: gf.unique_countries || 0,
          };
        } else {
          freshMap[gf.platform].geo_observation_count = gf.observation_count;
          freshMap[gf.platform].unique_countries = gf.unique_countries || 0;
          if (
            gf.last_observation_at &&
            new Date(gf.last_observation_at) >
              new Date(freshMap[gf.platform].last_observation_at)
          ) {
            freshMap[gf.platform].last_observation_at = gf.last_observation_at;
          }
        }
      }

      for (var fKey of Object.keys(freshMap)) {
        var fEntry = freshMap[fKey];
        var hoursAgo = fEntry.last_observation_at
          ? (now - new Date(fEntry.last_observation_at).getTime()) /
            (1000 * 60 * 60)
          : 999;
        fEntry.hours_ago = Math.round(hoursAgo * 10) / 10;
        fEntry.status =
          hoursAgo < 8 ? "fresh" : hoursAgo < 26 ? "stale" : "critical";
        dataFreshness.push(fEntry);
      }
      dataFreshness.sort(function (a: any, b: any) {
        return b.hours_ago - a.hours_ago;
      });

      // ── 2. Velocity Status ──
      if (ext.first_observation_date) {
        var firstDate = new Date(ext.first_observation_date + "T00:00:00Z");
        var todayDate = new Date();
        todayDate.setUTCHours(0, 0, 0, 0);
        var daysOfData = Math.max(
          0,
          Math.floor(
            (todayDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
          ),
        );
        var daysUntil = Math.max(0, 7 - daysOfData);
        var targetDate = new Date(
          firstDate.getTime() + 7 * 24 * 60 * 60 * 1000,
        );

        velocityStatus = {
          first_observation_date: ext.first_observation_date,
          days_of_data: daysOfData,
          days_until_velocity: daysUntil,
          velocity_active: daysOfData >= 7,
          pct_complete: Math.min(100, Math.round((daysOfData / 7) * 100)),
          target_date: targetDate.toISOString().split("T")[0],
        };
      }

      // ── 3. Accumulation ──
      var obsToday = ext.obs_today || 0;
      var obsYesterday = ext.obs_yesterday || 0;
      var geoToday = ext.geo_today || 0;
      var geoYesterday = ext.geo_yesterday || 0;

      accumulation = {
        observations_today: obsToday,
        observations_yesterday: obsYesterday,
        observations_delta_pct:
          obsYesterday > 0
            ? Math.round(((obsToday - obsYesterday) / obsYesterday) * 1000) / 10
            : 0,
        geo_today: geoToday,
        geo_yesterday: geoYesterday,
        geo_delta_pct:
          geoYesterday > 0
            ? Math.round(((geoToday - geoYesterday) / geoYesterday) * 1000) / 10
            : 0,
        entities_created_today: ext.entities_created_today || 0,
        entities_created_yesterday: ext.entities_created_yesterday || 0,
      };

      // ── 4. Coverage ──
      var aTotal = ext.artists_total || 0;
      var aGeo = ext.artists_with_geo || 0;
      var aMulti = ext.artists_with_multi_platform || 0;
      var sTotal = ext.songs_total || 0;
      var sObs = ext.songs_with_observations || 0;

      coverage = {
        artists_total: aTotal,
        artists_with_geo: aGeo,
        artists_with_geo_pct:
          aTotal > 0 ? Math.round((aGeo / aTotal) * 1000) / 10 : 0,
        artists_with_multi_platform: aMulti,
        artists_with_multi_platform_pct:
          aTotal > 0 ? Math.round((aMulti / aTotal) * 1000) / 10 : 0,
        songs_total: sTotal,
        songs_with_observations: sObs,
        songs_with_observations_pct:
          sTotal > 0 ? Math.round((sObs / sTotal) * 1000) / 10 : 0,
        markets_total: ext.markets_total || 0,
        avg_platforms_per_artist: ext.avg_platforms_per_artist || 0,
      };

      // ── 5. Platform Breakdown ──
      var pbMap: Record<string, any> = {};
      for (var pb of ext.platform_breakdown || []) {
        pbMap[pb.platform] = {
          platform: pb.platform,
          total_observations: pb.total_observations,
          total_geo_observations: 0,
          unique_entities: pb.unique_entities,
          unique_countries: 0,
          distinct_metrics: pb.distinct_metrics || [],
        };
      }
      for (var pgb of ext.platform_geo_breakdown || []) {
        if (pbMap[pgb.platform]) {
          pbMap[pgb.platform].total_geo_observations =
            pgb.total_geo_observations;
          pbMap[pgb.platform].unique_countries = pgb.unique_countries;
        } else {
          pbMap[pgb.platform] = {
            platform: pgb.platform,
            total_observations: 0,
            total_geo_observations: pgb.total_geo_observations,
            unique_entities: 0,
            unique_countries: pgb.unique_countries,
            distinct_metrics: [],
          };
        }
      }
      platformBreakdown = Object.values(pbMap).sort(function (a: any, b: any) {
        return b.total_observations - a.total_observations;
      });

      // ── 6. dbt Health ──
      if (ext.dbt_available) {
        var dbtRun = scrapers.find(function (sc: any) {
          return sc.scraper_name === "dbt_run";
        });
        dbtHealth = {
          last_run_at: dbtRun ? dbtRun.completed_at : null,
          last_run_duration_seconds:
            dbtRun && dbtRun.duration_ms
              ? Math.round(dbtRun.duration_ms / 1000)
              : null,
          last_run_status: dbtRun ? dbtRun.status : null,
          entity_health_rows: ext.entity_health_rows || 0,
          entity_health_avg_score: ext.entity_health_avg_score || 0,
          entity_health_score_distribution: ext.entity_health_distribution || {
            below_30: 0,
            between_30_50: 0,
            between_50_70: 0,
            above_70: 0,
          },
          discovery_momentum_active: ext.discovery_momentum_active || 0,
          streaming_momentum_active: ext.streaming_momentum_active || 0,
          social_momentum_active: ext.social_momentum_active || 0,
          geographic_momentum_active: ext.geographic_momentum_active || 0,
          song_health_rows: ext.song_health_rows || 0,
          song_health_avg_score: ext.song_health_avg_score || 0,
          song_health_has_radio: ext.song_health_has_radio || 0,
          song_health_has_apple: ext.song_health_has_apple || 0,
          song_health_has_youtube: ext.song_health_has_youtube || 0,
          market_health_rows: ext.market_health_rows || 0,
          market_health_avg_score: ext.market_health_avg_score || 0,
          daily_summaries_rows: ext.daily_summaries_rows || 0,
          daily_summaries_distinct_dates:
            ext.daily_summaries_distinct_dates || 0,
          daily_summaries_metric_combos: ext.daily_summaries_metric_combos || 0,
          total_models: 34,
          compression_models: compressionModels,
          health_models: healthModels,
          intelligence_models: intelligenceModels,
          anomalies_rows: anomaliesRows,
        };
      }

      // ── 7. Top Entities ──
      topEntities = {
        most_listeners: ext.top_listeners || [],
        most_countries: ext.top_countries || [],
        most_platforms: ext.top_platforms || [],
        newest_entities: ext.newest_entities || [],
      };

      // ── 8. Data Quality ──
      dataQuality = {
        duplicate_observations: 0,
        null_value_observations: ext.null_value_observations || 0,
        zero_heavy_metrics: ext.zero_heavy_metrics || [],
        orphan_entities: ext.orphan_entities || 0,
      };

      // ── 9. API Quotas (SC credits + YouTube) ──
      var scHistory = ext.sc_credit_history || [];
      var scLatest = scHistory.length > 0 ? scHistory[0].credits_remaining : 0;
      var scBurnRate = 0;
      var scExhaustionDate: string | null = null;

      if (scHistory.length >= 2) {
        var scNewest = scHistory[0];
        var scOldest = scHistory[scHistory.length - 1];
        var creditsDelta =
          scOldest.credits_remaining - scNewest.credits_remaining;
        var daysDelta =
          (new Date(scNewest.completed_at).getTime() -
            new Date(scOldest.completed_at).getTime()) /
          86400000;
        if (daysDelta > 0 && creditsDelta > 0) {
          scBurnRate = creditsDelta / daysDelta;
          var daysLeft = scNewest.credits_remaining / scBurnRate;
          var exhaustion = new Date(Date.now() + daysLeft * 86400000);
          scExhaustionDate = exhaustion.toISOString().split("T")[0];
        }
      }

      apiQuotas = {
        sc_credits: {
          latest_remaining: scLatest,
          burn_rate_daily: Math.round(scBurnRate),
          projected_exhaustion_date: scExhaustionDate,
          history: scHistory,
        },
        youtube: {
          daily_limit: 10000,
          history: ext.yt_quota_history || [],
        },
      };

      // ── 10. Platform ID Trend ──
      platformIdTrend = ext.platform_id_trend || [];
      platformIdDaily = ext.platform_id_daily || [];

      // ── 11. Unresolved Entities ──
      unresolvedEntities = {
        count: ext.unresolved_artists || 0,
        sample: ext.unresolved_sample || [],
      };

      // ── 12. Scraper Run History (for cron gap detection) ──
      scraperRunHistory = ext.scraper_run_history || [];
    }

    // Handle health stats (null if RPC not available yet)
    var handleHealth =
      !handleHealthResult.error && handleHealthResult.data
        ? handleHealthResult.data
        : null;

    // Song stream coverage
    var totalSongs = songEntitiesResult.count || 0;
    var songsObservedToday = songsObservedTodayResult.count || 0;
    var songStreamCoverage = {
      total_song_entities: totalSongs,
      songs_observed_last_26h: songsObservedToday,
      coverage_pct:
        totalSongs > 0
          ? Math.round((songsObservedToday / totalSongs) * 1000) / 10
          : 0,
      status:
        totalSongs === 0
          ? "no_songs"
          : songsObservedToday === 0
            ? "no_data_today"
            : songsObservedToday / totalSongs > 0.8
              ? "healthy"
              : songsObservedToday / totalSongs > 0.5
                ? "partial"
                : "low_coverage",
    };

    return jsonResponse({
      overall_health: overallHealth,
      scrapers_by_group: groups,
      scrapers: scrapers,
      data_totals: totals,
      checked_at: new Date().toISOString(),
      // Extended stats (null if RPC not available)
      data_freshness: dataFreshness.length > 0 ? dataFreshness : null,
      velocity_status: velocityStatus,
      accumulation: accumulation,
      coverage: coverage,
      platform_breakdown:
        platformBreakdown.length > 0 ? platformBreakdown : null,
      dbt_health: dbtHealth,
      top_entities: topEntities,
      data_quality: dataQuality,
      handle_health: handleHealth,
      song_stream_coverage: songStreamCoverage,
      // Ops dashboard additions
      api_quotas: ext ? apiQuotas : null,
      platform_id_trend: platformIdTrend.length > 0 ? platformIdTrend : null,
      platform_id_daily: platformIdDaily.length > 0 ? platformIdDaily : null,
      unresolved_entities: ext ? unresolvedEntities : null,
      scraper_run_history:
        scraperRunHistory.length > 0 ? scraperRunHistory : null,
    });
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});
