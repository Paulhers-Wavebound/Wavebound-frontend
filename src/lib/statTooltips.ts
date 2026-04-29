/**
 * Centralized tooltip copy for every stat and section card on the artist page.
 * One source of truth so we can review the language as a single diff and keep
 * tone consistent across ~18 components and ~200 individual metrics.
 *
 * Convention per string:
 *   [What it measures] + [Calculation / source] + [How to read it (optional)].
 *   Keep ≤ ~180 chars where possible — fits comfortably in `max-w-xs`.
 */

export const STAT_TOOLTIPS = {
  // ── ProfileHeader.tsx ───────────────────────────────────────────────────────
  header: {
    momentumTier:
      "Overall trajectory tag derived from cross-platform chart movement: Viral / Breakout / Momentum / Stable / Stalled. Refreshed nightly.",
    tiktokFollowers:
      "Current follower count on the artist's TikTok account. Scraped daily from the public profile.",
    instagramFollowers:
      "Current follower count on the artist's Instagram account. Scraped daily from the public profile.",
    monthlyListeners:
      "Spotify monthly listeners — unique listeners across the artist's catalog in the trailing 28 days. Refreshed daily by Spotify.",
    daysSinceLastPost:
      "Days since the artist's most recent organic TikTok post. Green ≤ 3d, yellow 4–7d, red 8d+.",
    inviteCode:
      "Single-use code the artist enters to claim their profile and unlock content-plan access.",
  },

  // ── OverviewTab.tsx ─────────────────────────────────────────────────────────
  overview: {
    artistScore:
      "Composite 0–100 score combining health (streaming + social), momentum (growth trends), discovery (platform coverage), and catalog (streaming depth). Rebuilt nightly from cross-platform chart data.",
    healthSubScore:
      "0–100. Strength of streaming and social baselines: monthly listeners, follower counts, engagement levels, and chart presence relative to peak.",
    momentumSubScore:
      "0–100. 7- and 30-day acceleration in streams, follower growth, and post engagement. Higher = trending up faster.",
    discoverySubScore:
      "0–100. Breadth of presence across streaming, social, live, and chart sources. Penalised for missing platform links.",
    catalogSubScore:
      "0–100. Depth of catalog performance — how many songs are streaming, not just the top hit. Higher = less hit-dependent.",
    tier: "Tier label derived from the Artist Score: New, Rising, Established, etc. Determines color of the score badge.",
    trend:
      "Direction of the Artist Score over the last 7 days: up, down, or stable. Arrow icon mirrors this.",
    releaseReadiness:
      "0–100 readiness score for a single drop. Blends posting cadence, engagement trend, audience growth, and catalog momentum. Higher = better release window.",
    platformTrendsSection:
      "7-day % change per platform. Spotify (listeners), TikTok (sound usage), YouTube (views), Shazam (counts). Requires 7+ days of history to compute.",
    spotifyTrend: "7-day % change in Spotify monthly listeners.",
    tiktokTrend: "7-day % change in TikTok sound usage and views.",
    youtubeTrend: "7-day % change in YouTube video views.",
    shazamTrend: "7-day % change in Shazam tag counts.",
    viralSongs:
      "Catalog songs currently classified viral — daily streams up sharply week-over-week and above absolute thresholds. Auto-tagged by the catalog ingestor.",
    acceleratingSongs:
      "Catalog songs with sustained positive 7-day growth that haven't yet hit viral thresholds.",
    momentumSparkline:
      "30-day Artist Score trend line. Number on the right is the change vs 30 days ago.",
    rmmSection:
      "Relative Momentum Map — each video plotted by date and Performance Ratio (PR). PR = video views ÷ the artist's median view count over the last 30 organic posts.",
    anomaliesSection:
      "Notable deviations from the artist's baseline in the last 7 days — sudden spikes or drops in views, posts, or engagement.",
    riskAlertsSection:
      "Backend-flagged risks (no posts in 14+ days, sentiment swing, bot-like spike, etc.). Severity color: red = high, yellow = medium.",
    aiFocusSection:
      "Weekly AI-written narrative summarising what changed and what to do about it. Generated every Monday from the last 7 days of metrics.",
  },

  // ── PerformanceChart.tsx ────────────────────────────────────────────────────
  rmm: {
    section:
      "Relative Momentum Map. Each dot is one video plotted on Performance Ratio (views ÷ artist's median over the last 30 organic posts). 1.0× = typical for this artist.",
    currentPR:
      "Performance Ratio of the most recent video. 1.0× = typical for this artist.",
    avg7PR: "Average Performance Ratio across the last 7 videos.",
    avg30PR: "Average Performance Ratio across the last 30 videos.",
    medianBaseline:
      "Median view count across the last 30 organic videos. The denominator for every Performance Ratio.",
    organicToggle:
      "Toggle to exclude posts marked as ads or likely-promoted, so the baseline reflects organic performance only.",
    tierLegend:
      "Tier thresholds — Stalled <0.5× • Stable 0.5–1.5× • Momentum 1.5–4× • Breakout 4–10× • Viral 10×+.",
  },

  // ── ContentTab.tsx ──────────────────────────────────────────────────────────
  content: {
    formatPerformance: {
      section:
        "Performance grouped by content format (Dance, Comedy, BTS, etc.). Format detected by AI on each video and aggregated across the analysis window.",
      videosAnalyzed:
        "Number of videos in the analysis window classified into a format.",
      hookScore:
        "0–10 average. AI rating of the first 1.5s of each video — how strong it is at stopping a scroll. Higher = better hooks.",
      viralScore:
        "0–10 average. AI rating of remix-ability, share-trigger, and trend-fit of each video.",
      primaryGenre:
        "AI-detected dominant musical genre across the artist's TikTok content.",
      dominantMood:
        "AI-detected dominant emotional tone across the artist's TikTok content (energetic, melancholic, playful, etc.).",
      perFormatVideos:
        "Videos in the analysis window classified into this format.",
      perFormatAvgViews: "Average view count across all videos in this format.",
      perFormatHookScore:
        "Average hook score (0–10) across videos in this format.",
      perFormatViralScore:
        "Average viral score (0–10) across videos in this format.",
      perFormatEngagement:
        "Average (likes + comments + shares) ÷ plays for videos in this format.",
      vsMedian:
        "Format's average views ÷ artist's overall median views. >1× = above their average; <1× = below.",
      bestFormat:
        "Format with the highest average views in the analysis window.",
      worstFormat:
        "Format with the lowest average views in the analysis window.",
      signatureStyle:
        "AI summary of recurring style and themes across this artist's content.",
    },
    activity: {
      section:
        "Posting cadence and engagement trend on TikTok, computed from the trailing 30 days of organic posts.",
      cadence:
        "Daily / Regular / Sporadic / Inactive — set by post-frequency thresholds across the trailing 30 days.",
      consistency:
        "0–100. How evenly posts are distributed across time (low variance in inter-post gaps). Higher = more reliable cadence.",
      engagementRate:
        "Average (likes + comments + shares) ÷ plays across recent TikTok videos.",
      performanceTrend:
        "Improving / Stable / Declining — direction of average views over the last 14 days vs the prior 14.",
      totalVideos: "Lifetime TikTok video count on the account.",
      videos7d: "Number of organic videos posted in the last 7 days.",
      videos30d: "Number of organic videos posted in the last 30 days.",
      avgVirality:
        "Average Performance Ratio (views ÷ median) across all analysed videos.",
      playsTrend:
        "% change in average plays per video over the last 7 days vs the prior 7.",
      engagementTrend:
        "% change in engagement rate over the last 7 days vs the prior 7.",
      strategy:
        "AI-generated narrative describing how this artist's content strategy has evolved across the analysis window.",
      viewsChange:
        "% change in average views: most-recent window vs prior window. Calculated from the same posts the evolution narrative uses.",
      newFormats:
        "Formats appearing in the recent window that weren't in the prior window.",
      droppedFormats:
        "Formats from the prior window that no longer appear in recent posts.",
    },
    tiktokProfile: {
      section:
        "Snapshot of the artist's TikTok account performance. Grade and stats scraped from the public profile, refreshed daily.",
      grade:
        "A–F overall account grade. Composite of posting consistency, engagement rate, and content-quality scores.",
      consistency:
        "Daily / Regular / Sporadic / Inactive / Dormant — same as the activity cadence, but evaluated across the full account history.",
      playsTrend:
        "% change in average video plays over the last 30 days vs the prior 30.",
      avgPlays:
        "Average view count per video across all videos on the account.",
      engagementRate:
        "Average (likes + comments + shares) ÷ plays across all videos on the account.",
      originalSound:
        "% of videos using the artist's own original audio vs trending external sounds. Higher = stronger sonic identity.",
      postsPerWeek: "Average number of TikTok posts per week.",
      totalVideos: "Lifetime video count on the account.",
      videos30d: "Videos posted in the last 30 days.",
      bestVideoPlays:
        "Highest view count achieved by any single video on the account.",
      daysSinceLastPost:
        "Days since the most recent TikTok post. Red >14d, orange >7d.",
    },
    fanComments: {
      section:
        "AI analysis of fan comments on the artist's TikTok videos. Comments classified by an LLM, refreshed daily.",
      sentimentScore:
        "0–100 average sentiment of fan comments. >70 = positive, 40–70 = mixed, <40 = critical.",
      energyScore:
        "0–100 emotional intensity of fan comments. Higher = more passionate (positive or negative); lower = passive.",
      audienceVibe:
        "Engaged / Casual / Mixed / Cold — overall fan engagement quality from comment patterns.",
      commentsAnalyzed:
        "Total number of TikTok comments included in this analysis. Higher count = more reliable signal.",
      intentBreakdown:
        "Share of comments by intent: Praise, Hype, Lyric quotes, Trend refs, Questions, Collab requests, Complaints.",
      topComments:
        "Highest-engagement comments from the analysis window. Useful for finding fan voice and reactions.",
      contentIdeas:
        "AI-extracted content suggestions based on what fans are asking for in the comments.",
      fanRequests:
        "Most-repeated explicit asks from fans (e.g. 'release the snippet', 'tour Australia').",
    },
  },

  // ── SoundsTab.tsx ───────────────────────────────────────────────────────────
  sounds: {
    pulse: {
      section:
        "Top-line catalog health and momentum across all songs. Updated nightly from cross-platform chart data.",
      catalogScore:
        "0–100 catalog health gauge. Composite of streaming velocity, viral count, and catalog depth.",
      hotSongs:
        "Songs currently above the artist's median streams baseline AND trending up.",
      soundSparkScore:
        "Composite 0–100 score derived from how many catalog songs are sparking on TikTok (high creator pickup, growing video counts).",
      catalogDailyStreams:
        "Total streams across the entire catalog in the last 24h. Trailing 7-day % change shown next to it.",
      momentumSparkline:
        "30-day catalog momentum trend. Number = change vs 30 days ago.",
      viralSongs:
        "Catalog songs currently in viral phase — explosive short-term growth above absolute thresholds.",
      acceleratingSongs:
        "Catalog songs with sustained positive momentum that haven't yet hit viral thresholds.",
    },
    velocity: {
      section:
        "Per-song catalog performance, sorted by daily streams. Velocity class is recomputed nightly.",
      dailyStreams: "Streams in the last 24h for this song.",
      totalStreams: "All-time total streams for this song across DSPs.",
      change7d: "% change in this song's daily streams over the last 7 days.",
      velocityClass:
        "Viral / Accelerating / Growing / Steady / Decelerating / Declining / New — set by 7-day change and absolute thresholds.",
      songHealth:
        "0–100 song health score. Combines streams, growth direction, and chart presence for this song.",
      countriesCharting:
        "Number of country charts the song currently appears on.",
      nearPeak: "Song is within ~15% of its all-time peak daily-stream count.",
    },
    tiktok: {
      section:
        "Performance of catalog songs as TikTok sounds — videos using the audio, creator pickup, plays, and engagement.",
      grade:
        "A–F TikTok grade. Composite of plays, creator count, engagement, and growth across catalog sounds.",
      originalSoundPct:
        "% of TikTok videos using the artist's own original audio (as opposed to trending external sounds).",
      avgEngagement:
        "Average (likes + comments + shares) ÷ plays across videos using the artist's sounds. Green if >5%, red if <2%.",
      soundsUsed: "Number of distinct catalog sounds with TikTok video pickup.",
      playsTrend:
        "7-day % change in total TikTok plays across all the artist's sounds.",
      videoCount: "Total videos using this sound on TikTok.",
      uniqueCreators: "Distinct creators who've made a video with this sound.",
      status:
        "Viral / Trending / Active / Established / Emerging — sound's TikTok lifecycle stage.",
      totalPlays: "Sum of plays across all videos using this sound.",
      videos7d: "New videos using this sound in the last 7 days.",
      tiktokEngagement:
        "(likes + comments + shares) ÷ plays for videos using this sound.",
      fanToArtistRatio:
        "Fan-made videos ÷ artist-posted videos for this sound. >1 = fans driving usage.",
      crossPlatformGap:
        "Compares TikTok pickup to DSP performance. 'TT hot → DSP cold' = high TikTok activity not yet converting to streams (push opportunity).",
    },
    streaming: {
      section:
        "DSP performance and discovery signals — Spotify, Deezer, Kworb, Wikipedia.",
      momentumChart:
        "30-day momentum score over time. Hover for the score and date.",
      monthlyListeners:
        "Spotify monthly listeners — unique listeners in the trailing 28 days. 7-day % change shown next to it.",
      dailyStreams:
        "Daily streams across the catalog (Spotify). 7-day % change shown next to it.",
      spotifyFollowers:
        "Followers on the Spotify artist profile. 7-day delta shown.",
      loyaltyRatio:
        "Spotify followers ÷ monthly listeners. Higher = more committed fans relative to passive listeners. Above ~25% is strong.",
      peakMlStatus:
        "Position vs all-time peak monthly listeners. 'Near peak' = within ~15%.",
      kworbRank: "Global Kworb rank (lower is better). 7-day rank delta shown.",
      leadStreamPct:
        "% of total streams coming from the lead/top song in the catalog. High % = hit-dependent.",
      deezerFans: "Fan count on Deezer.",
    },
    playlists: {
      section: "Editorial and algorithmic playlist placements across DSPs.",
      songsListed:
        "Number of catalog songs currently in at least one tracked playlist.",
      totalPlacements:
        "Sum of all placements across all songs and all playlists.",
      totalReach:
        "Sum of follower counts across every playlist the catalog is in.",
      bestSong: "Song with the most reach via playlist placements.",
      bestPlaylist: "Highest-reach playlist any catalog song is currently in.",
      bestPlaylistReach: "Follower count of the highest-reach playlist.",
      bestPosition:
        "Best chart-style position any song holds across all tracked playlists.",
      avgPosition: "Average position across all current placements.",
      highReachCount: "Placements where the playlist has 100K+ followers.",
      reachTier:
        "Massive / High / Medium / Low — overall playlist footprint tier based on aggregated reach.",
      perSongPlaylists:
        "Number of distinct playlists this song is currently in.",
      perSongReach:
        "Sum of follower counts across every playlist this song is in.",
    },
    dna: {
      section:
        "Genre, mood, and signature style of the catalog plus discovery-platform signals (Shazam, Wikipedia, etc.).",
      primaryGenre: "AI-detected dominant musical genre across the catalog.",
      dominantMood: "AI-detected dominant emotional tone across the catalog.",
      signatureStyle:
        "AI summary of recurring sonic and stylistic traits across the catalog.",
      hookScore:
        "Catalog-wide hook strength (0–100, mapped from a 0–10 scale). Average across analysed videos.",
      viralScore:
        "Catalog-wide remix-ability and shareability (0–100, mapped from a 0–10 scale). Average across analysed videos.",
      discoveryScore:
        "0–100. How discoverable the artist is across discovery platforms (Shazam, Wikipedia, search).",
      fastestGrowingPlatform:
        "Platform with the largest 7-day % gain among Spotify / TikTok / YouTube / Shazam.",
      shazamTrend: "7-day % change in Shazam tag counts.",
      wikipediaPageviews:
        "Daily Wikipedia article pageviews. 7-day delta shown next to it.",
    },
  },

  // ── GrowthTab.tsx ───────────────────────────────────────────────────────────
  growth: {
    audience: {
      section:
        "Total audience footprint across social and streaming platforms.",
      totalReach:
        "Sum of TikTok followers + Instagram followers + YouTube subscribers + Spotify followers. May double-count cross-platform fans.",
      tiktokFollowers: "Current TikTok followers.",
      instagramFollowers: "Current Instagram followers.",
      youtubeSubs: "Current YouTube subscribers.",
      spotifyFollowers: "Current Spotify followers.",
      dominantPlatform:
        "Platform where this artist has the largest follower base.",
      fastestGrowingPlatform:
        "Platform with the highest 7-day % growth among the four tracked.",
      loyaltyRatio:
        "Spotify followers ÷ monthly listeners. Above ~25% indicates a committed fan base.",
    },
    touring: {
      section:
        "Live touring activity sourced from Ticketmaster and other event aggregators.",
      status:
        "Heavy / Active / Selective / Minimal / None — touring intensity from confirmed event count and cadence.",
      upcomingEvents: "Total confirmed upcoming events across all sources.",
      ticketmasterEvents:
        "Confirmed events sourced specifically from Ticketmaster.",
      newThisWeek: "New events added or announced in the last 7 days.",
    },
    rosterRank: {
      section:
        "Where this artist sits within their label's roster, ranked by Artist Score.",
      rank: "Position within roster by Artist Score (1 = highest). Top 3 highlighted in orange.",
      totalRoster: "Total artists on this label's roster.",
      percentile: "Top X% of the roster by Artist Score (lower is better).",
      distribution:
        "Histogram of Artist Scores across the roster, in 10-bucket bins. The current artist's bucket is highlighted in orange.",
      vsRosterAvg:
        "Artist Score minus the roster's mean Artist Score. Positive = above average.",
    },
    markets: {
      section:
        "Geographic markets where this artist has chart presence or growth potential. Sourced from cross-platform chart data.",
      opportunityScore:
        "0–100 server-computed score for this market — blends market size, current chart presence, and trend velocity.",
      urgency:
        "Act now / Plan / Monitor — recommended timing of any market push, based on opportunity score and trend slope.",
      recommendedAction:
        "Suggested move (Expand / Grow / Push / Maintain / Monitor) given current presence and trend.",
      windowConfidence:
        "How confident the model is that the recommended action lands in the right time window.",
      entrySong:
        "Catalog song most likely to convert in this market based on current chart-adjacent placements.",
      monthlyRevenue:
        "Estimated monthly streaming revenue ($) opportunity if the market is activated. Modelled from local DSP rates × projected adds.",
      platformToActivate:
        "Platform with the highest current traction in this market — best place to start any push.",
    },
  },

  // ── Marketing V2 Briefing ───────────────────────────────────────────────────
  briefing: {
    hero: {
      section:
        "Top-line composite scorecard. Same Artist Score model as the standard view, with sub-score bars and 7- and 30-day deltas.",
      artistScore:
        "Composite 0–100 score combining health (streaming + social), momentum (growth trends), discovery (platform coverage), and catalog (streaming depth). Rebuilt nightly.",
      delta7d: "Change in Artist Score over the last 7 days.",
      delta30d: "Change in Artist Score over the last 30 days.",
      tier: "Tier label derived from the Artist Score (New / Rising / Established / etc.).",
      globalRank:
        "Global ranking among tracked artists. Lower number = higher position.",
      momentum:
        "7-day momentum acceleration value. Positive = accelerating, negative = decelerating.",
      listenersPeakRatio:
        "Current Spotify monthly listeners ÷ all-time peak listeners. ≥90% = near peak.",
    },
    signalMap: {
      section:
        "Cross-platform 7-day signal map. Same source as Platform Trends — Spotify, TikTok, YouTube, Shazam — surfaced together with cross-platform classification.",
      crossPlatformBadge:
        "Breakout / Surging / Rising / Stable / Dipping / Cooling / Watch list — overall cross-platform status. Set by combining all platform trends.",
      platformsGrowing: "Number of platforms showing positive 7-day momentum.",
      platformsDeclining:
        "Number of platforms showing negative 7-day momentum.",
      platformsTracked:
        "Number of platforms with enough recent data to compute a trend.",
    },
    opportunityEngine: {
      section:
        "AI-prioritised list of action windows for this artist. Each card is a specific recommended move with timing and rationale.",
      score:
        "0–100 priority score for the opportunity. Blends impact and urgency.",
      window:
        "Time window in which the opportunity is open — act now, this week, this month, etc.",
      confidence:
        "How confident the model is that the recommended action lands in the right window.",
    },
    competitiveLens: {
      section:
        "How this artist compares to the rest of the label's roster on key dimensions.",
      vsRoster:
        "Artist's value minus the roster median for this metric. Positive = above the roster's middle.",
      percentile:
        "Percentile of this artist within the roster on this metric (higher = better).",
    },
    outlook: {
      section:
        "Forward-looking projection — where the artist is likely to land in the next 30 days at current trajectory.",
      projectedScore:
        "Modelled Artist Score 30 days out at current trajectory. Confidence band shown if available.",
      projectedDelta:
        "Projected change in Artist Score over the next 30 days at current trajectory.",
    },
    aiFocus: {
      section:
        "Editorial AI narrative summarising what changed and what to do about it.",
      generatedAt:
        "When this AI-written narrative was last produced. Refreshed weekly.",
      narrative:
        "Claude-written summary of the last 7 days of metrics, with editorial commentary on what to do next.",
    },
  },

  // ── Legacy IntelligenceTab — already partly tooltipped, fill out per-stat ──
  intel: {
    artistScore:
      "Composite 0–100 score combining health (streaming + social), momentum (growth trends), discovery (platform coverage), and catalog (streaming depth). Rebuilt nightly from cross-platform chart data.",
    healthSubScore:
      "0–100. Strength of streaming and social baselines: monthly listeners, follower counts, engagement levels, and chart presence relative to peak.",
    momentumSubScore:
      "0–100. 7- and 30-day acceleration in streams, follower growth, and post engagement. Higher = trending up faster.",
    discoverySubScore:
      "0–100. Breadth of presence across streaming, social, live, and chart sources. Penalised for missing platform links.",
    catalogSubScore:
      "0–100. Depth of catalog performance — how many songs are streaming, not just the top hit. Higher = less hit-dependent.",
    globalRank:
      "Global ranking among tracked artists. Lower number = higher position.",
    momentumDelta:
      "7-day momentum value with direction. Positive = accelerating, negative = decelerating. 'Negative zone' = sustained downward trajectory.",
    listenersPeakRatio:
      "Current Spotify monthly listeners as a % of the all-time peak. ≥90% = at or near all-time high.",

    platformSignals:
      "7-day % change in key metrics per platform. Source: Spotify listeners, TikTok sound usage, YouTube views, Shazam counts. Bars show direction and magnitude. Requires 7+ days of data to compute trends.",
    platformSpotifyTrend: "7-day % change in Spotify monthly listeners.",
    platformTiktokTrend: "7-day % change in TikTok sound usage and views.",
    platformYoutubeTrend: "7-day % change in YouTube video views.",
    platformShazamTrend: "7-day % change in Shazam tag counts.",
    platformsGrowing: "Number of platforms showing positive 7-day momentum.",
    platformsDeclining: "Number of platforms showing negative 7-day momentum.",
    platformsTracked:
      "Number of platforms with enough recent data to compute a trend.",
    crossPlatformBadge:
      "Breakout / Surging / Rising / Stable / Dipping / Cooling / Watch list — overall cross-platform status from combining all platform trends.",

    tiktokProfile:
      "Grade (A–F) based on posting frequency, engagement rate, and content quality. Scraped from artist's TikTok account. Engagement = (likes + comments + shares) / plays. Original Sound % = videos using their own audio vs trending sounds.",
    tiktokGrade:
      "A–F overall account grade. Composite of posting consistency, engagement rate, and content-quality scores.",
    tiktokConsistency:
      "Daily / Regular / Sporadic / Inactive / Dormant — set by post-frequency thresholds across the trailing 30 days.",
    tiktokAvgPlays:
      "Average view count per video. Trend % shows 30-day change.",
    tiktokEngagement:
      "Average (likes + comments + shares) ÷ plays across all videos.",
    tiktokOriginalSound:
      "% of videos using the artist's own original audio vs trending external sounds. Higher = stronger sonic identity.",
    tiktokPostsPerWeek:
      "Average number of TikTok posts per week. Subtext: days since most recent post.",
    tiktokTotalVideos: "Lifetime video count on the account.",
    tiktokVideos30d: "Videos posted in the last 30 days.",
    tiktokBestVideoPlays:
      "Highest view count achieved by any single video on the account.",

    catalogStatus:
      "Streaming health across the full catalog. Daily streams and 7-day growth from Spotify/Apple Music chart data. 'Viral' = songs with explosive short-term growth. 'Conversion opportunities' = songs trending on TikTok but underperforming on Spotify.",
    catalogDailyStreams:
      "Average daily streams across the entire catalog from Spotify/Apple Music. Updated nightly.",
    catalogGrowth7d:
      "7-day % change in daily streams. Positive = growing catalog momentum.",
    catalogTotalSongs:
      "Total number of songs/tracks in the artist's released catalog.",
    catalogDepthScore:
      "0–100. Higher = streams more evenly distributed across catalog. Lower = dependent on 1–2 hit songs.",
    catalogViralAccel:
      "Viral count / accelerating count. Viral = explosive short-term growth, accelerating = sustained positive momentum.",
    catalogPlaylists:
      "Number of catalog songs currently featured in major streaming playlists (editorial & algorithmic).",
    catalogTopSong:
      "Highest-streaming song in the catalog. Streams/day shown next to it.",
    catalogTopSongVelocity:
      "Current momentum of the top song. Accelerating = growing faster; declining = losing momentum.",
    catalogFastestSong:
      "Song with the fastest percentage growth (not absolute streams).",
    catalogConversionOpportunities:
      "Songs trending on TikTok but underperforming on Spotify. These have conversion opportunity — consider targeted DSP push.",

    fanSentiment:
      "Sentiment (0–100) and energy (0–100) from AI analysis of TikTok comments on the artist's videos. Themes are the most common topics fans discuss. Updated daily via LLM classification.",
    fanSentimentScore:
      "0–100 average sentiment of fan comments. >70 = positive, 40–70 = mixed, <40 = critical.",
    fanEnergyScore:
      "0–100 emotional intensity of fan comments. Higher = more passionate (positive or negative); lower = passive.",
    fanAudienceVibe:
      "Rabid / Engaged / Casual / Mixed / Cold — overall fan engagement quality from comment patterns.",
    fanThemes:
      "Most common topics fans discuss. Hover a chip for an example quote; the small number is occurrence count.",
    fanIntentBreakdown:
      "Share of comments by intent: Praise, Hype, Lyric quotes, Trend refs, Questions, Collab requests, Complaints.",
    fanCommentsAnalyzed:
      "Total number of TikTok comments processed for this analysis. Higher count = more reliable signal.",
    fanContentIdeas:
      "AI-extracted content suggestions based on what fans are asking for in the comments.",
    fanRequests:
      "Most-repeated explicit asks from fans (e.g. 'release the snippet', 'tour Australia').",

    coverage:
      "How many major platforms have this artist's identity linked. Missing platforms = missed discovery and attribution. Score reflects breadth of presence across streaming, social, live, and discovery platforms.",
    coverageMissing:
      "Platforms where the artist profile is not linked. Linking fills gaps and improves attribution.",

    geoMarket:
      "Market presence from cross-platform chart positions (Spotify, Apple Music, Shazam, YouTube). Strength = charting performance in each country. Opportunity score combines market size, current presence, and growth potential. 'Expand' = not present in a high-value market.",
    geoTotalMarkets:
      "Total number of geographic markets being tracked for this artist.",
    geoDominantMarkets:
      "Markets where the artist has the strongest charting position.",
    geoPresent: "Markets where the artist charted in recent data.",
    geoMarketStrength:
      "Relative strength in this market — Dominant / Strong / Medium / Fringe.",
    geoBestPosition: "Highest (best) chart position achieved in this market.",
    geoOpportunityScore:
      "0–100 server-computed opportunity score for this market. Blends market size, current presence, and trend velocity.",
    geoOpportunityTier:
      "High / Medium / Low / Minimal — opportunity classification derived from the opportunity score.",
    geoRecommendedAction:
      "Suggested action — Expand (new entry), Grow (scale presence), Push (increase investment), Maintain (sustain), Monitor (watch).",
  },

  // ── Legacy LabelArtistDetail.tsx header ─────────────────────────────────────
  legacyHeader: {
    tiktokFollowers:
      "Current follower count on the artist's TikTok account. Scraped daily.",
    spotifyScore:
      "Spotify's proprietary popularity score (0–100). Higher = more recent listener activity and streams.",
    postFrequency:
      "Average days between TikTok posts over the last 30 days. Lower = more active.",
    lastPost: "Time since the artist's most recent TikTok post.",
    reportGenerated:
      "Timestamp of when this intelligence report was last generated.",
  },
} as const;
