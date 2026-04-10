export interface Machine {
  hostname: string;
  ip: string;
  role: string;
  scrapers: string[];
  temp?: boolean;
  note?: string;
}

export const MACHINES: Machine[] = [
  {
    hostname: "Main Hetzner",
    ip: "46.225.104.247",
    role: "Production — all daily crons, HITL pipeline, SC scrapers, n8n",
    scrapers: [
      "kworb_listeners",
      "kworb_global_ranking",
      "kworb_country_charts",
      "kworb_artist_charts",
      "kworb_youtube",
      "kworb_youtube_artists",
      "kworb_apple_charts",
      "kworb_radio",
      "kworb_shazam",
      "kworb_tiktok",
      "kworb_platform_charts",
      "tiktok_profiles",
      "tiktok_trending_sounds",
      "tiktok_trending_hashtags",
      "tiktok_comments",
      "tiktok_audience_geo",
      "tiktok_sound_details",
      "tiktok_sound_videos",
      "carl_tiktok",
      "carl_reels",
      "oscar_tiktok",
      "oscar_reels",
      "ruben_tiktok",
      "ruben_reels",
    ],
  },
  {
    hostname: "Mac (Paul's)",
    ip: "local",
    role: "Dev + overflow — kworb shard 0, playlist scraper, MB resolver, TM key 1",
    scrapers: ["kworb_artist_detail", "playlist_scraper", "free_ticketmaster"],
  },
  {
    hostname: "Crawler-1",
    ip: "46.224.111.44",
    role: "Temp crawler — kworb shard 2",
    scrapers: ["kworb_artist_detail"],
    temp: true,
    note: "Delete after bootstrap finishes",
  },
  {
    hostname: "Crawler-2",
    ip: "46.224.100.98",
    role: "Temp crawler — kworb shard 3",
    scrapers: ["kworb_artist_detail"],
    temp: true,
    note: "Delete after bootstrap finishes",
  },
  {
    hostname: "Crawler-3",
    ip: "46.224.97.52",
    role: "Temp crawler — kworb shard 4",
    scrapers: ["kworb_artist_detail"],
    temp: true,
    note: "Delete after bootstrap finishes",
  },
  {
    hostname: "Disco-1",
    ip: "188.245.237.231",
    role: "Temp crawler — kworb shard 5, discography harvester",
    scrapers: ["kworb_artist_detail", "harvest_discography"],
    temp: true,
    note: "Discography harvester died during Supabase restart — relaunch needed",
  },
];
