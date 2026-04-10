import type { BriefingData, BriefingParagraph } from "@/types/artistBriefing";
import type { ArtistCard } from "@/types/artistIntelligence";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
function countryName(code: string): string {
  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

function velocityLabel(card: ArtistCard): string {
  if (card.trend === "rising_fast") return "having a breakout moment";
  if (card.trend === "rising") return "building strong momentum";
  if (card.trend === "stable") return "holding steady";
  if (card.trend === "falling") return "losing traction";
  if (card.trend === "falling_fast") return "in steep decline";
  return "active";
}

function timeframeLabel(card: ArtistCard): string {
  const accel = card.momentum?.acceleration_7d ?? 0;
  if (accel > 5) return "strongest week in recent memory";
  if (accel > 2) return "notable uptick this week";
  if (accel < -5) return "weakest performance in weeks";
  if (accel < -2) return "declining week";
  return "steady week";
}

export function generateBriefingParagraph(
  data: BriefingData,
): BriefingParagraph {
  const { artistCard: card, alerts, marketsV2, songs } = data;
  const name = card.name.split(" ").pop() ?? card.name; // Last name for brevity

  const keyDrivers: string[] = [];
  const parts: string[] = [];

  // Opening: velocity state
  parts.push(`${card.name} is ${velocityLabel(card)}.`);

  // What's driving it: check alerts for specifics
  const celebrationAlerts = alerts.alerts.filter(
    (a) => a.severity === "celebration",
  );
  const geoAlerts = alerts.alerts.filter((a) => a.alert_type === "geographic");
  const songAlerts = alerts.alerts.filter(
    (a) => a.alert_type === "song_momentum",
  );
  const breakoutAlerts = alerts.alerts.filter(
    (a) => a.alert_type === "cross_platform_breakout",
  );

  // New markets
  const surgingMarkets = marketsV2.filter(
    (m) => m.velocity === "surging" || m.velocity === "rising",
  );
  const preBreakoutMarkets = marketsV2.filter(
    (m) => m.discovery_signal_type === "pre_breakout",
  );

  // Viral/accelerating songs
  const hotSongs = songs.filter(
    (s) => s.velocity_class === "viral" || s.velocity_class === "accelerating",
  );

  // Build the narrative based on what's most notable
  if (hotSongs.length > 0 && surgingMarkets.length > 0) {
    // Best case: songs moving + markets expanding
    const songNames = hotSongs
      .slice(0, 2)
      .map((s) => `"${s.song_name}"`)
      .join(" and ");
    const marketNames = surgingMarkets
      .slice(0, 3)
      .map((m) => countryName(m.country_code))
      .join(", ");

    parts.push(
      `${songNames} ${hotSongs.length === 1 ? "is" : "are"} driving activity across ${surgingMarkets.length} markets including ${marketNames}.`,
    );
    keyDrivers.push(`${hotSongs.length} songs accelerating`);
    keyDrivers.push(`${surgingMarkets.length} markets surging`);
  } else if (hotSongs.length > 0) {
    const songNames = hotSongs
      .slice(0, 2)
      .map((s) => `"${s.song_name}"`)
      .join(" and ");
    parts.push(
      `${songNames} ${hotSongs.length === 1 ? "is" : "are"} the primary catalyst, ${hotSongs.length === 1 ? "showing" : "both showing"} strong velocity this week.`,
    );
    keyDrivers.push(`${hotSongs.length} songs accelerating`);
  } else if (surgingMarkets.length > 0) {
    const marketNames = surgingMarkets
      .slice(0, 3)
      .map((m) => countryName(m.country_code))
      .join(", ");
    parts.push(
      `International traction is building in ${marketNames}, with chart positions improving across multiple platforms.`,
    );
    keyDrivers.push(`${surgingMarkets.length} markets surging`);
  }

  // Pre-breakout detection
  if (preBreakoutMarkets.length > 0) {
    const names = preBreakoutMarkets
      .slice(0, 2)
      .map((m) => countryName(m.country_code))
      .join(" and ");
    parts.push(
      `Discovery signals in ${names} suggest demand is forming before streaming catches up — a classic pre-breakout pattern.`,
    );
    keyDrivers.push(
      `Pre-breakout signals in ${preBreakoutMarkets.length} markets`,
    );
  }

  // Cross-platform breakout
  if (breakoutAlerts.length > 0) {
    parts.push(
      `Cross-platform breakout detected — ${card.signals.platforms_growing} platforms showing simultaneous growth.`,
    );
    keyDrivers.push("Cross-platform breakout");
  }

  // Scale context
  parts.push(
    `Active in ${card.geo.total_markets} markets across ${card.signals.platforms_tracked} platforms with ${songs.length} songs tracked.`,
  );

  // Urgency signal
  let urgencyLevel: BriefingParagraph["urgencyLevel"] = "low";

  if (
    card.trend === "rising_fast" ||
    preBreakoutMarkets.length >= 2 ||
    breakoutAlerts.length > 0
  ) {
    urgencyLevel = "critical";
    parts.push("Immediate attention recommended — this is a breakout window.");
  } else if (card.trend === "rising" || surgingMarkets.length >= 2) {
    urgencyLevel = "high";
    parts.push(
      "Momentum is building — amplification within the next 1-2 weeks could accelerate the trajectory significantly.",
    );
  } else if (card.trend === "falling" || card.trend === "falling_fast") {
    urgencyLevel = "medium";
    const decliningMarkets = marketsV2.filter(
      (m) => m.velocity === "declining" || m.velocity === "exiting",
    );
    if (decliningMarkets.length > 0) {
      parts.push(
        `Declining in ${decliningMarkets.length} market${decliningMarkets.length > 1 ? "s" : ""}. Consider defensive action or content refresh to stabilize.`,
      );
    } else {
      parts.push("Monitor closely — trajectory needs intervention to reverse.");
    }
  }

  return {
    text: parts.join(" "),
    urgencyLevel,
    keyDrivers,
  };
}

// ─── Bottom Line Generator ─────────────────────────────────────────

export function generateBottomLine(data: BriefingData): string {
  const { artistCard: card, marketsV2, songs } = data;

  const hotSongs = songs.filter(
    (s) => s.velocity_class === "viral" || s.velocity_class === "accelerating",
  );
  const highOppMarkets = marketsV2.filter(
    (m) => m.opportunity_tier === "high" && m.urgency === "act_now",
  );
  const totalMarkets = card.geo.total_markets;

  const parts: string[] = [];

  parts.push(
    `${card.name} is at ${card.artist_score}/100 and ${card.trend === "rising_fast" ? "accelerating rapidly" : card.trend === "rising" ? "trending upward" : card.trend === "stable" ? "holding position" : "losing ground"}.`,
  );

  if (hotSongs.length > 0) {
    parts.push(
      `${hotSongs.length} song${hotSongs.length > 1 ? "s are" : " is"} in motion.`,
    );
  }

  if (highOppMarkets.length > 0) {
    const topOpp = highOppMarkets[0];
    const topCountry = countryName(topOpp.country_code);
    parts.push(
      `${topCountry} is the highest-priority opportunity with organic traction already building.`,
    );
  }

  if (card.trend === "rising" || card.trend === "rising_fast") {
    const predictedMarkets = marketsV2.filter(
      (m) =>
        !m.is_present &&
        m.spillover_probability != null &&
        m.spillover_probability >= 50,
    );
    if (predictedMarkets.length > 0) {
      parts.push(
        `If current trajectory holds, expect entry into ${predictedMarkets.length} additional market${predictedMarkets.length > 1 ? "s" : ""} within 30 days, pushing from ${totalMarkets} to ${totalMarkets + predictedMarkets.length} markets.`,
      );
    }
    parts.push("The data says: move.");
  } else if (card.trend === "falling" || card.trend === "falling_fast") {
    parts.push(
      "The trend needs intervention. Without action, further market erosion is likely within 2-3 weeks.",
    );
  } else {
    parts.push(
      "Steady position — look for amplification opportunities to accelerate growth.",
    );
  }

  return parts.join(" ");
}

// ─── Momentum Score (simplified from spec formula) ─────────────────

export function computeMomentumLabel(card: ArtistCard): {
  label: string;
  color: string;
} {
  const accel = card.momentum?.acceleration_7d ?? 0;
  if (accel > 3) return { label: "ACCELERATING", color: "#30D158" };
  if (accel > 0) return { label: "BUILDING", color: "#0A84FF" };
  if (accel > -3) return { label: "STEADY", color: "#8E8E93" };
  if (accel > -6) return { label: "SLOWING", color: "#FFD60A" };
  return { label: "DECLINING", color: "#FF453A" };
}

// ─── Window Estimation ─────────────────────────────────────────────

export function estimateOpportunityWindow(
  platformCount: number,
  isDecelerating: boolean,
): { days: number; urgency: "critical" | "high" | "medium" | "normal" } {
  if (isDecelerating) return { days: 4, urgency: "critical" };
  if (platformCount >= 3) return { days: 7, urgency: "high" };
  if (platformCount >= 2) return { days: 12, urgency: "medium" };
  return { days: 18, urgency: "normal" };
}
