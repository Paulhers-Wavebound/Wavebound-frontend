import type {
  CreatorTier,
  FormatBreakdown,
  GeoBreakdown,
  IntentEntry,
  NicheEntry,
  SongRoleEntry,
  SoundAnalysis,
  SoundCanonicalGroup,
  SoundCanonicalGroupMember,
  TopVideo,
  VelocityDay,
  VibeEntry,
} from "@/types/soundIntelligence";
import type { ListAnalysisEntry } from "@/utils/soundIntelligenceApi";

export interface SoundGroupAnalysisMember {
  member: SoundCanonicalGroupMember;
  analysis: SoundAnalysis | null;
  entry: ListAnalysisEntry | null;
}

export interface SoundGroupSummary {
  group: SoundCanonicalGroup;
  trackName: string;
  artistName: string;
  coverUrl: string | null;
  soundIds: string[];
  completedCount: number;
  totalCount: number;
  videosAnalyzed: number;
  totalViews: number;
  engagementRate: number | null;
  shareRate: number | null;
  winnerFormat: string | null;
  winnerMultiplier: number;
  velocityStatus: "accelerating" | "active" | "declining";
  lastUpdated: string | null;
}

function parseMetric(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (!value) return 0;

  const compact = value.trim().toUpperCase().replace(/,/g, "");
  const numeric = Number.parseFloat(compact);
  if (Number.isNaN(numeric)) return 0;
  if (compact.endsWith("B")) return numeric * 1_000_000_000;
  if (compact.endsWith("M")) return numeric * 1_000_000;
  if (compact.endsWith("K")) return numeric * 1_000;
  return numeric;
}

function sumArrays(arrays: (number[] | undefined)[]): number[] {
  const maxLength = Math.max(0, ...arrays.map((array) => array?.length ?? 0));
  return Array.from({ length: maxLength }, (_, index) =>
    arrays.reduce((sum, array) => sum + (array?.[index] ?? 0), 0),
  );
}

function weightedAverage(
  items: { value: number | null | undefined; weight: number }[],
): number {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return 0;
  return (
    items.reduce((sum, item) => sum + (item.value ?? 0) * item.weight, 0) /
    totalWeight
  );
}

function pickVelocityStatus(
  statuses: (string | null | undefined)[],
): "accelerating" | "active" | "declining" {
  if (statuses.includes("accelerating")) return "accelerating";
  if (statuses.length > 0 && statuses.every((status) => status === "declining")) {
    return "declining";
  }
  return "active";
}

export function buildSoundGroupSummary(
  group: SoundCanonicalGroup,
  entries: ListAnalysisEntry[],
): SoundGroupSummary {
  const entriesByJob = new Map(entries.map((entry) => [entry.job_id, entry]));
  const memberEntries = group.members
    .map((member) => entriesByJob.get(member.job_id) ?? null)
    .filter((entry): entry is ListAnalysisEntry => Boolean(entry));
  const completedEntries = memberEntries.filter(
    (entry) => entry.status === "completed",
  );
  const summaries = completedEntries
    .map((entry) => entry.summary)
    .filter((summary): summary is NonNullable<ListAnalysisEntry["summary"]> =>
      Boolean(summary),
    );
  const totalViews = summaries.reduce(
    (sum, summary) => sum + summary.total_views,
    0,
  );
  const totalVideos = summaries.reduce(
    (sum, summary) => sum + summary.videos_analyzed,
    0,
  );
  const winner = [...summaries].sort(
    (a, b) => b.total_views - a.total_views,
  )[0];
  const newest = [...memberEntries].sort((a, b) =>
    (b.last_refresh_at ?? b.completed_at ?? b.created_at).localeCompare(
      a.last_refresh_at ?? a.completed_at ?? a.created_at,
    ),
  )[0];
  const primaryEntry =
    memberEntries.find((entry) => entry.job_id === group.primary_job_id) ??
    memberEntries[0] ??
    null;

  return {
    group,
    trackName: group.name || primaryEntry?.track_name || "Merged TikTok sound",
    artistName:
      group.artist_name || primaryEntry?.artist_name || "Multiple sound IDs",
    coverUrl: group.cover_url || primaryEntry?.cover_url || null,
    soundIds: group.members.map((member) => member.sound_id),
    completedCount: completedEntries.length,
    totalCount: group.members.length,
    videosAnalyzed: totalVideos,
    totalViews,
    engagementRate:
      summaries.length > 0
        ? weightedAverage(
            summaries.map((summary) => ({
              value: summary.engagement_rate,
              weight: Math.max(summary.total_views, 1),
            })),
          )
        : null,
    shareRate:
      summaries.some((summary) => summary.share_rate != null)
        ? weightedAverage(
            summaries.map((summary) => ({
              value: summary.share_rate ?? 0,
              weight: Math.max(summary.total_views, 1),
            })),
          )
        : null,
    winnerFormat: winner?.winner_format ?? null,
    winnerMultiplier: winner?.winner_multiplier ?? 0,
    velocityStatus: pickVelocityStatus(
      summaries.map((summary) => summary.velocity_status),
    ),
    lastUpdated: newest?.last_refresh_at ?? newest?.completed_at ?? null,
  };
}

function mergeVelocity(analyses: SoundAnalysis[]): VelocityDay[] {
  const byDate = new Map<string, { videos: number; viewsWeighted: number }>();

  for (const analysis of analyses) {
    for (const day of analysis.velocity ?? []) {
      const current = byDate.get(day.date) ?? { videos: 0, viewsWeighted: 0 };
      current.videos += day.videos;
      current.viewsWeighted += day.avg_views * Math.max(day.videos, 1);
      byDate.set(day.date, current);
    }
  }

  return Array.from(byDate.entries())
    .map(([date, value]) => ({
      date,
      videos: value.videos,
      avg_views:
        value.videos > 0 ? Math.round(value.viewsWeighted / value.videos) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function mergeTopVideos(analyses: SoundAnalysis[]): TopVideo[] {
  const byKey = new Map<string, TopVideo>();

  for (const video of analyses.flatMap((analysis) => analysis.top_videos ?? [])) {
    const key = video.url || `${video.creator}:${video.views}:${video.why}`;
    const current = byKey.get(key);
    if (!current || parseMetric(video.views) > parseMetric(current.views)) {
      byKey.set(key, video);
    }
  }

  return Array.from(byKey.values())
    .sort((a, b) => parseMetric(b.views) - parseMetric(a.views))
    .slice(0, 20)
    .map((video, index) => ({ ...video, rank: index + 1 }));
}

function mergeNamedDistribution<
  T extends {
    video_count: number;
    pct: number;
    avg_views: number;
    engagement: number;
  },
>(
  analyses: SoundAnalysis[],
  getRows: (analysis: SoundAnalysis) => T[] | undefined,
  getName: (row: T) => string,
  buildRow: (name: string, row: Omit<T, "pct">) => T,
): T[] {
  const totals = new Map<
    string,
    { count: number; views: number; engagementWeighted: number }
  >();

  for (const analysis of analyses) {
    for (const row of getRows(analysis) ?? []) {
      const name = getName(row);
      const current = totals.get(name) ?? {
        count: 0,
        views: 0,
        engagementWeighted: 0,
      };
      current.count += row.video_count;
      current.views += row.avg_views * row.video_count;
      current.engagementWeighted += row.engagement * row.video_count;
      totals.set(name, current);
    }
  }

  const totalCount = Array.from(totals.values()).reduce(
    (sum, row) => sum + row.count,
    0,
  );

  return Array.from(totals.entries())
    .map(([name, row]) =>
      buildRow(name, {
        video_count: row.count,
        avg_views: row.count > 0 ? row.views / row.count : 0,
        engagement: row.count > 0 ? row.engagementWeighted / row.count : 0,
      } as Omit<T, "pct">),
    )
    .map((row) => ({
      ...row,
      pct: totalCount > 0 ? (row.video_count / totalCount) * 100 : 0,
    }))
    .sort((a, b) => b.video_count - a.video_count);
}

function mergeFormats(analyses: SoundAnalysis[]): FormatBreakdown[] {
  const totals = new Map<
    string,
    {
      count: number;
      views: number;
      shareWeighted: number;
      actualShareWeighted: number;
      sparkWeighted: number;
      daily: number[][];
      postingHours: number[][];
      songBars: number[][];
      topVideos: FormatBreakdown["topVideos"];
      topHooks: string[];
      topNiches: NonNullable<FormatBreakdown["top_niches"]>;
      topIntents: NonNullable<FormatBreakdown["top_intents"]>;
    }
  >();

  for (const analysis of analyses) {
    for (const format of analysis.formats ?? []) {
      const current = totals.get(format.name) ?? {
        count: 0,
        views: 0,
        shareWeighted: 0,
        actualShareWeighted: 0,
        sparkWeighted: 0,
        daily: [],
        postingHours: [],
        songBars: [],
        topVideos: [],
        topHooks: [],
        topNiches: [],
        topIntents: [],
      };

      current.count += format.video_count;
      current.views += format.avg_views * format.video_count;
      current.shareWeighted += format.share_rate * format.video_count;
      current.actualShareWeighted +=
        (format.actual_share_rate ?? format.share_rate) * format.video_count;
      current.sparkWeighted += (format.spark_score ?? 0) * format.video_count;
      current.daily.push(format.daily);
      current.postingHours.push(format.posting_hours);
      current.songBars.push(format.songBars);
      current.topVideos.push(...(format.topVideos ?? []));
      current.topHooks.push(...(format.hooks?.top_hooks ?? []));
      current.topNiches.push(...(format.top_niches ?? []));
      current.topIntents.push(...(format.top_intents ?? []));
      totals.set(format.name, current);
    }
  }

  const totalCount = Array.from(totals.values()).reduce(
    (sum, row) => sum + row.count,
    0,
  );

  return Array.from(totals.entries())
    .map(([name, row]) => {
      const avgViews = row.count > 0 ? row.views / row.count : 0;
      const uniqueTopVideos = Array.from(
        new Map(
          row.topVideos.map((video) => [
            video.video_url || `${video.handle}:${video.views}:${video.why}`,
            video,
          ]),
        ).values(),
      )
        .sort((a, b) => parseMetric(b.views) - parseMetric(a.views))
        .slice(0, 5);

      return {
        name,
        video_count: row.count,
        pct_of_total: totalCount > 0 ? (row.count / totalCount) * 100 : 0,
        avg_views: Math.round(avgViews),
        share_rate: row.count > 0 ? row.shareWeighted / row.count : 0,
        actual_share_rate:
          row.count > 0 ? row.actualShareWeighted / row.count : 0,
        verdict: avgViews >= 100_000 ? "SCALE" : "EMERGING",
        daily: sumArrays(row.daily),
        posting_hours: sumArrays(row.postingHours),
        songBars: sumArrays(row.songBars),
        hooks: {
          face_pct: 0,
          snippet: "Merged across sound IDs",
          snippet_pct: 0,
          top_hooks: Array.from(new Set(row.topHooks)).slice(0, 5),
        },
        topVideos: uniqueTopVideos,
        insight: `${name} accounts for ${Math.round(
          totalCount > 0 ? (row.count / totalCount) * 100 : 0,
        )}% of UGC across the merged sound IDs.`,
        top_niches: row.topNiches,
        top_intents: row.topIntents,
        spark_score: row.count > 0 ? row.sparkWeighted / row.count : undefined,
      } satisfies FormatBreakdown;
    })
    .sort((a, b) => b.video_count - a.video_count);
}

function mergeCreatorTiers(analyses: SoundAnalysis[]): CreatorTier[] {
  const tiers = new Map<string, CreatorTier>();

  for (const tier of analyses.flatMap((analysis) => analysis.creator_tiers ?? [])) {
    const current = tiers.get(tier.tier);
    if (!current) {
      tiers.set(tier.tier, { ...tier });
      continue;
    }

    const count = current.count + tier.count;
    tiers.set(tier.tier, {
      ...current,
      count,
      pct: current.pct + tier.pct,
      avg_views:
        count > 0
          ? (current.avg_views * current.count + tier.avg_views * tier.count) /
            count
          : 0,
      avg_share_rate:
        count > 0
          ? (current.avg_share_rate * current.count +
              tier.avg_share_rate * tier.count) /
            count
          : 0,
      daily: sumArrays([current.daily, tier.daily]),
      topCreators: [...current.topCreators, ...tier.topCreators].slice(0, 5),
      insight: "Merged creator tier across attached sound IDs.",
    });
  }

  const total = Array.from(tiers.values()).reduce(
    (sum, tier) => sum + tier.count,
    0,
  );

  return Array.from(tiers.values())
    .map((tier) => ({ ...tier, pct: total > 0 ? (tier.count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);
}

function mergeGeography(analyses: SoundAnalysis[]): GeoBreakdown[] {
  const countries = new Map<string, GeoBreakdown>();

  for (const geo of analyses.flatMap((analysis) => analysis.geography ?? [])) {
    const current = countries.get(geo.country);
    if (!current) {
      countries.set(geo.country, { ...geo });
      continue;
    }

    countries.set(geo.country, {
      ...current,
      pct: current.pct + geo.pct,
      daily: sumArrays([current.daily, geo.daily]),
      topFormats: [...current.topFormats, ...geo.topFormats].slice(0, 5),
      insight: "Merged geography across attached sound IDs.",
    });
  }

  const pctTotal = Array.from(countries.values()).reduce(
    (sum, geo) => sum + geo.pct,
    0,
  );

  return Array.from(countries.values())
    .map((geo) => ({
      ...geo,
      pct: pctTotal > 0 ? (geo.pct / pctTotal) * 100 : geo.pct,
    }))
    .sort((a, b) => b.pct - a.pct);
}

export function aggregateSoundGroupAnalysis(
  group: SoundCanonicalGroup,
  members: SoundGroupAnalysisMember[],
): SoundAnalysis | null {
  const analyses = members
    .map((member) => member.analysis)
    .filter((analysis): analysis is SoundAnalysis => Boolean(analysis));

  if (analyses.length === 0) return null;

  const primary =
    analyses.find((analysis, index) => {
      const member = members[index];
      return member?.member.job_id === group.primary_job_id && analysis;
    }) ?? analyses[0];
  const velocity = mergeVelocity(analyses);
  const formats = mergeFormats(analyses);
  const totalVideos = analyses.reduce(
    (sum, analysis) => sum + (analysis.videos_analyzed ?? 0),
    0,
  );
  const totalViews = analyses.reduce(
    (sum, analysis) => sum + (analysis.total_views ?? 0),
    0,
  );
  const peakDay =
    [...velocity].sort((a, b) => b.videos - a.videos)[0]?.date ??
    primary.peak_day;
  const winnerFormat = formats[0];
  const medianFormatViews =
    formats.length > 0
      ? [...formats].sort((a, b) => a.avg_views - b.avg_views)[
          Math.floor(formats.length / 2)
        ]?.avg_views || 1
      : 1;

  const topVideos = mergeTopVideos(analyses);

  return {
    ...primary,
    sound_url: group.members[0]?.sound_url ?? primary.sound_url,
    track_name: group.name || primary.track_name,
    artist_name: group.artist_name || primary.artist_name,
    cover_url: group.cover_url || primary.cover_url,
    status: pickVelocityStatus(analyses.map((analysis) => analysis.status)),
    created_at: [...analyses]
      .map((analysis) => analysis.created_at)
      .sort((a, b) => a.localeCompare(b))[0],
    last_scan: [...analyses]
      .map((analysis) => analysis.last_scan)
      .sort((a, b) => b.localeCompare(a))[0],
    videos_analyzed: totalVideos,
    total_videos_on_sound: analyses.reduce(
      (sum, analysis) => sum + (analysis.total_videos_on_sound ?? 0),
      0,
    ),
    total_views: totalViews,
    avg_share_rate: weightedAverage(
      analyses.map((analysis) => ({
        value: analysis.avg_share_rate,
        weight: Math.max(analysis.total_views ?? 0, 1),
      })),
    ),
    actual_share_rate: weightedAverage(
      analyses.map((analysis) => ({
        value: analysis.actual_share_rate ?? analysis.avg_share_rate,
        weight: Math.max(analysis.total_views ?? 0, 1),
      })),
    ),
    avg_duration_seconds: weightedAverage(
      analyses.map((analysis) => ({
        value: analysis.avg_duration_seconds,
        weight: Math.max(analysis.videos_analyzed ?? 0, 1),
      })),
    ),
    peak_day: peakDay,
    peak_day_count:
      velocity.find((day) => day.date === peakDay)?.videos ??
      primary.peak_day_count,
    weekly_delta_videos: analyses.reduce(
      (sum, analysis) => sum + (analysis.weekly_delta_videos ?? 0),
      0,
    ),
    weekly_delta_views_pct: weightedAverage(
      analyses.map((analysis) => ({
        value: analysis.weekly_delta_views_pct,
        weight: Math.max(analysis.total_views ?? 0, 1),
      })),
    ),
    posting_hours: sumArrays(analyses.map((analysis) => analysis.posting_hours)),
    velocity,
    formats,
    winner: {
      format: winnerFormat?.name ?? primary.winner.format,
      multiplier:
        winnerFormat && medianFormatViews > 0
          ? winnerFormat.avg_views / medianFormatViews
          : primary.winner.multiplier,
      video_count: winnerFormat?.video_count ?? primary.winner.video_count,
      avg_views: winnerFormat?.avg_views ?? primary.winner.avg_views,
      share_rate: winnerFormat?.share_rate ?? primary.winner.share_rate,
      actual_share_rate:
        winnerFormat?.actual_share_rate ?? primary.winner.actual_share_rate,
      recommendation: `Treat this as one canonical sound across ${group.members.length} TikTok IDs. Use the filters above when you need to isolate a single ID.`,
    },
    hook_analysis: {
      ...primary.hook_analysis,
      top_hooks: Array.from(
        new Set(analyses.flatMap((analysis) => analysis.hook_analysis.top_hooks)),
      ).slice(0, 6),
    },
    top_videos: topVideos,
    creator_tiers: mergeCreatorTiers(analyses),
    geography: mergeGeography(analyses),
    lifecycle: {
      ...primary.lifecycle,
      current_velocity: analyses.reduce(
        (sum, analysis) => sum + (analysis.lifecycle?.current_velocity ?? 0),
        0,
      ),
      insight: `Combined across ${group.members.length} TikTok sound IDs so the campaign read matches the consolidated mobile sound.`,
    },
    niche_distribution: mergeNamedDistribution<NicheEntry>(
      analyses,
      (analysis) => analysis.niche_distribution,
      (row) => row.niche,
      (name, row) => ({ ...row, niche: name, pct: 0 }),
    ),
    intent_breakdown: mergeNamedDistribution<IntentEntry>(
      analyses,
      (analysis) => analysis.intent_breakdown,
      (row) => row.intent,
      (name, row) => ({ ...row, intent: name as IntentEntry["intent"], pct: 0 }),
    ),
    song_role_distribution: mergeNamedDistribution<SongRoleEntry>(
      analyses,
      (analysis) => analysis.song_role_distribution,
      (row) => row.role,
      (name, row) => ({
        ...row,
        role: name as SongRoleEntry["role"],
        pct: 0,
      }),
    ),
    vibe_distribution: mergeNamedDistribution<VibeEntry>(
      analyses,
      (analysis) => analysis.vibe_distribution,
      (row) => row.vibe,
      (name, row) => ({ ...row, vibe: name, pct: 0 }),
    ),
    unclassified_count: analyses.reduce(
      (sum, analysis) => sum + (analysis.unclassified_count ?? 0),
      0,
    ),
    spotify_snapshots: analyses.flatMap(
      (analysis) => analysis.spotify_snapshots ?? [],
    ),
    playlist_tracking: analyses.flatMap(
      (analysis) => analysis.playlist_tracking ?? [],
    ),
    shazam_snapshots: analyses.flatMap(
      (analysis) => analysis.shazam_snapshots ?? [],
    ),
    format_spark_scores: formats.reduce<Record<string, number>>(
      (acc, format) => {
        if (format.spark_score != null) acc[format.name] = format.spark_score;
        return acc;
      },
      {},
    ),
    reels_count: analyses.reduce(
      (sum, analysis) => sum + (analysis.reels_count ?? 0),
      0,
    ),
  };
}
