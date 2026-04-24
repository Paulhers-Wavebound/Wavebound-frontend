import type {
  Angle,
  AngleFamily,
  Artist,
  OutputType,
  QueueItem,
  QueueSource,
  RiskLevel,
} from "./types";

export const MOCK_ARTISTS: Artist[] = [
  {
    id: "art-papi",
    name: "El Papi",
    handle: "@elpapi",
    labelName: "Columbia NO",
    market: "Norway",
    chartPosition: "#35",
    monthlyListeners: "1.4M",
    unshippedAngles: 8,
    scheduled: 3,
    publishedThisWeek: 2,
  },
  {
    id: "art-maren",
    name: "Maren Lysne",
    handle: "@marenlysne",
    labelName: "Columbia NO",
    market: "Norway",
    chartPosition: null,
    monthlyListeners: "230K",
    unshippedAngles: 12,
    scheduled: 4,
    publishedThisWeek: 1,
  },
  {
    id: "art-dre",
    name: "Dre Folami",
    handle: "@drefolami",
    labelName: "Columbia UK",
    market: "UK",
    chartPosition: null,
    monthlyListeners: "890K",
    unshippedAngles: 5,
    scheduled: 1,
    publishedThisWeek: 3,
  },
  {
    id: "art-kit",
    name: "Kit Harlow",
    handle: "@kitharlow",
    labelName: "Columbia US",
    market: "US",
    chartPosition: null,
    monthlyListeners: "640K",
    unshippedAngles: 14,
    scheduled: 6,
    publishedThisWeek: 4,
  },
  {
    id: "art-june",
    name: "Junebug Lane",
    handle: "@junebuglane",
    labelName: "Columbia US",
    market: "US",
    chartPosition: null,
    monthlyListeners: "410K",
    unshippedAngles: 7,
    scheduled: 2,
    publishedThisWeek: 0,
  },
  {
    id: "art-gracie",
    name: "Gracie Abrams",
    handle: "@gracieabrams",
    labelName: "Columbia US",
    market: "US",
    chartPosition: "#12",
    monthlyListeners: "38.2M",
    unshippedAngles: 9,
    scheduled: 5,
    publishedThisWeek: 6,
    isExample: true,
  },
  {
    id: "art-noah",
    name: "Noah Kahan",
    handle: "@noahkahan",
    labelName: "Republic (example)",
    market: "US",
    chartPosition: "#18",
    monthlyListeners: "42.8M",
    unshippedAngles: 11,
    scheduled: 4,
    publishedThisWeek: 3,
    isExample: true,
  },
];

export const MOCK_ANGLES: Angle[] = [
  // Sensational — fictional artists only
  {
    id: "ang-1",
    artistId: "art-kit",
    title: "The show that almost ruined Kit Harlow",
    summary:
      "A 40-min Q&A transcript from Harlow's Hot 97 appearance where she walks back the 'my label hates me' line from January.",
    family: "sensational",
    sourceCount: 3,
    mostRecentSourceMonth: "Mar 2026",
    speculative: false,
  },
  {
    id: "ang-2",
    artistId: "art-dre",
    title: "The unfollow that changed Dre Folami's career",
    summary:
      "Reddit thread speculating on the Central Cee / Folami feud after a mutual unfollow last Thursday. No on-record confirmation from either side.",
    family: "sensational",
    sourceCount: 1,
    mostRecentSourceMonth: "Feb 2026",
    speculative: true,
    sources: [
      {
        label: "r/UKHipHop — 'CC unfollowed Folami' thread (18 upvotes)",
        kind: "forum",
        date: "Feb 12, 2026",
        url: "https://www.reddit.com/r/UKHipHop/",
      },
    ],
  },
  {
    id: "ang-3",
    artistId: "art-maren",
    title: "Inside the contract dispute that delayed Maren Lysne's debut",
    summary:
      "VG article + Dagbladet follow-up on the renegotiation that pushed the album from Feb to May.",
    family: "sensational",
    sourceCount: 2,
    mostRecentSourceMonth: "Jan 2026",
    speculative: false,
  },
  {
    id: "ang-4",
    artistId: "art-june",
    title: "Why Junebug Lane walked off stage in Austin",
    summary:
      "Fan-shot clip circulating TikTok shows Lane leaving mid-song at Stubb's. Framing it as anxiety vs sound-issue is up in the air.",
    family: "sensational",
    sourceCount: 0,
    mostRecentSourceMonth: null,
    speculative: true,
    sources: [],
  },
  {
    id: "ang-5",
    artistId: "art-papi",
    title: "El Papi's backup dancer lawsuit — what actually happened",
    summary:
      "Dagbladet + NRK report. Suit settled out of court last week; both sides issued a joint statement.",
    family: "sensational",
    sourceCount: 2,
    mostRecentSourceMonth: "Apr 2026",
    speculative: false,
  },
  {
    id: "ang-6",
    artistId: "art-kit",
    title: "Kit Harlow's disappearing deal with Interscope",
    summary:
      "Billboard rumour mill — one unnamed A&R source. Harlow's publicist won't confirm. Worth flagging before using.",
    family: "sensational",
    sourceCount: 1,
    mostRecentSourceMonth: "Mar 2026",
    speculative: true,
    sources: [
      {
        label: "Billboard — unnamed A&R source (paraphrased)",
        kind: "article",
        date: "Mar 14, 2026",
        url: "https://www.billboard.com/",
      },
    ],
  },

  // Self-help
  {
    id: "ang-7",
    artistId: "art-noah",
    title: "What Noah Kahan teaches us about authenticity",
    summary:
      "Four long-form interviews where Kahan returns to the same 'don't perform your pain' line. Strong tie-in for a follow-friendly edit.",
    family: "self_help",
    sourceCount: 4,
    mostRecentSourceMonth: "Apr 2026",
    speculative: false,
  },
  {
    id: "ang-8",
    artistId: "art-gracie",
    title: "Gracie Abrams on protecting your creative window",
    summary:
      "NPR + Vulture + one podcast. Abrams describes a 90-minute morning block with phone off — threads well into a self-help preset.",
    family: "self_help",
    sourceCount: 3,
    mostRecentSourceMonth: "Mar 2026",
    speculative: false,
  },
  {
    id: "ang-9",
    artistId: "art-maren",
    title: "Maren Lysne's tour anxiety routine that actually works",
    summary:
      "Instagram Story carousel from the Paris leg — breathing drill, playlist, hotel window ritual. Generic enough to template.",
    family: "self_help",
    sourceCount: 2,
    mostRecentSourceMonth: "Feb 2026",
    speculative: false,
  },
  {
    id: "ang-10",
    artistId: "art-noah",
    title: "Why Noah Kahan stopped apologizing in his lyrics",
    summary:
      "Thematic shift between the 2023 and 2025 albums — Kahan's own framing in the Rolling Stone cover.",
    family: "self_help",
    sourceCount: 3,
    mostRecentSourceMonth: "Jan 2026",
    speculative: false,
  },
  {
    id: "ang-11",
    artistId: "art-papi",
    title: "El Papi's 4am journaling habit",
    summary:
      "Mentioned in passing on the NRK Lindmo interview. Only one source, worth surfacing with citation visible.",
    family: "self_help",
    sourceCount: 1,
    mostRecentSourceMonth: "Apr 2026",
    speculative: false,
  },

  // Tour recap
  {
    id: "ang-12",
    artistId: "art-noah",
    title: "What Noah Kahan's Dublin crowd did that broke the internet",
    summary:
      "Full-venue unison singalong of an unreleased song. 5 YouTube rips, multiple TikTok edits. Tour-recap goldmine.",
    family: "tour_recap",
    sourceCount: 5,
    mostRecentSourceMonth: "Mar 2026",
    speculative: false,
  },
  {
    id: "ang-13",
    artistId: "art-papi",
    title: "El Papi's first Oslo headline — night-by-night",
    summary:
      "Three-night Sentrum Scene run. Papi himself posted BTS; two Norwegian outlets reviewed.",
    family: "tour_recap",
    sourceCount: 3,
    mostRecentSourceMonth: "Apr 2026",
    speculative: false,
  },
  {
    id: "ang-14",
    artistId: "art-maren",
    title: "Maren Lysne's tour bus confessionals",
    summary:
      "A weekly IG video series from the road — intimate, low-stakes. Could edit down into a recap mini-series.",
    family: "tour_recap",
    sourceCount: 2,
    mostRecentSourceMonth: "Mar 2026",
    speculative: false,
  },
  {
    id: "ang-15",
    artistId: "art-june",
    title: "Junebug Lane's Red Rocks opener moment",
    summary:
      "Opened for Zach Bryan. Four festival reviews + Lane's own post-show livestream. Clearly pivotal.",
    family: "tour_recap",
    sourceCount: 4,
    mostRecentSourceMonth: "Apr 2026",
    speculative: false,
  },

  // BTS
  {
    id: "ang-16",
    artistId: "art-papi",
    title: "El Papi's hidden production technique",
    summary:
      "Two-part YouTube breakdown of the vocal-chop sampling method used on 'Natt'. Would cut cleanly into a 30s teaser.",
    family: "bts",
    sourceCount: 2,
    mostRecentSourceMonth: "Apr 2026",
    speculative: false,
  },
  {
    id: "ang-17",
    artistId: "art-june",
    title: "Inside the 3am writing session — Junebug Lane edition",
    summary:
      "Three separate IG Lives of Lane workshopping the same verse at 3am over three nights. Stitches into a process narrative.",
    family: "bts",
    sourceCount: 3,
    mostRecentSourceMonth: "Mar 2026",
    speculative: false,
  },
  {
    id: "ang-18",
    artistId: "art-gracie",
    title: "How Gracie Abrams builds demos on her phone",
    summary:
      "Four different interviews — Vogue, Billboard, Vulture, Apple Music — where she mentions Voice Memos → Logic migration.",
    family: "bts",
    sourceCount: 4,
    mostRecentSourceMonth: "Apr 2026",
    speculative: false,
  },
  {
    id: "ang-19",
    artistId: "art-dre",
    title: "Dre Folami's voice-memo archive",
    summary:
      "Folami tweeted a screenshot of 480 voice memos. Fan accounts are already dissecting timestamps — good pairing for a BTS cut.",
    family: "bts",
    sourceCount: 2,
    mostRecentSourceMonth: "Mar 2026",
    speculative: false,
  },
  {
    id: "ang-20",
    artistId: "art-kit",
    title: "Kit Harlow's drum pattern loop theory",
    summary:
      "One YouTube interview where Harlow breaks down why every chorus lands on a 7-bar loop instead of 8. Producer-focused audience.",
    family: "bts",
    sourceCount: 1,
    mostRecentSourceMonth: "Feb 2026",
    speculative: false,
  },

  // Mini-doc
  {
    id: "ang-21",
    artistId: "art-papi",
    title: "Making of El Papi's 'Natt' — 7 min",
    summary:
      "Six sources: studio logs, three interviews, BTS footage, label press release. Full 7-minute mini-doc ready.",
    family: "mini_doc",
    sourceCount: 6,
    mostRecentSourceMonth: "Apr 2026",
    speculative: false,
  },
  {
    id: "ang-22",
    artistId: "art-gracie",
    title: "Gracie Abrams' four-year path to the arena",
    summary:
      "Eight archival sources spanning 2021-2025. Arc is already clear — demo era → writer's room → first tour → arena.",
    family: "mini_doc",
    sourceCount: 8,
    mostRecentSourceMonth: "Apr 2026",
    speculative: false,
  },
  {
    id: "ang-23",
    artistId: "art-kit",
    title: "Kit Harlow: from TikTok to signed in 90 days",
    summary:
      "Three sources (Rolling Stone profile, TikTok analytics screenshots, Harlow's own signing announcement). Fast-turnaround mini-doc.",
    family: "mini_doc",
    sourceCount: 3,
    mostRecentSourceMonth: "Mar 2026",
    speculative: false,
  },
  {
    id: "ang-24",
    artistId: "art-noah",
    title: "The producers who shaped Noah Kahan's sound",
    summary:
      "Five sources: two long-form producer interviews, one Tape Notes episode, Kahan's GQ piece, one Reddit deep-dive.",
    family: "mini_doc",
    sourceCount: 5,
    mostRecentSourceMonth: "Mar 2026",
    speculative: false,
  },
];

export const INITIAL_QUEUE: QueueItem[] = [
  {
    id: "q-1",
    artistId: "art-papi",
    title: "30s cut — El Papi's hidden production technique",
    outputType: "short_form",
    source: "autopilot",
    status: "pending",
    risk: "low",
    riskNotes: [],
    thumbKind: "video",
    createdAt: "2h ago",
    angleId: "ang-16",
  },
  {
    id: "q-2",
    artistId: "art-kit",
    title: "Mini-doc: Kit Harlow — 90 days",
    outputType: "mini_doc",
    source: "human",
    status: "pending",
    risk: "low",
    riskNotes: [],
    thumbKind: "video",
    createdAt: "4h ago",
    angleId: "ang-23",
  },
  {
    id: "q-3",
    artistId: "art-maren",
    title: "Sensational cut: Contract dispute framing v2",
    outputType: "sensational",
    source: "autopilot",
    status: "pending",
    risk: "flagged",
    riskNotes: ["Legal review recommended", "Counterparty mention unsourced"],
    thumbKind: "video",
    createdAt: "6h ago",
    angleId: "ang-3",
  },
  {
    id: "q-4",
    artistId: "art-dre",
    title: "Fan brief edit — Folami voice-memo response",
    outputType: "fan_brief",
    source: "fan_brief",
    status: "pending",
    risk: "medium",
    riskNotes: ["Sensitive topic (mental health)"],
    thumbKind: "brief",
    createdAt: "1h ago",
  },
  {
    id: "q-5",
    artistId: "art-june",
    title: "45s tour recap — Red Rocks opener",
    outputType: "tour_recap",
    source: "autopilot",
    status: "scheduled",
    scheduledFor: "Fri · 9:00 am",
    risk: "low",
    riskNotes: [],
    thumbKind: "video",
    createdAt: "8h ago",
    angleId: "ang-15",
  },
  {
    id: "q-6",
    artistId: "art-papi",
    title: "Link → video · TikTok ref @elpapi/7594...",
    outputType: "link_video",
    source: "human",
    status: "pending",
    risk: "low",
    riskNotes: [],
    thumbKind: "link",
    createdAt: "1h ago",
  },
  {
    id: "q-7",
    artistId: "art-noah",
    title: "Self-help: authenticity edit (90s)",
    outputType: "self_help",
    source: "autopilot",
    status: "scheduled",
    scheduledFor: "Thu · 6:00 pm",
    risk: "low",
    riskNotes: [],
    thumbKind: "video",
    createdAt: "12h ago",
    angleId: "ang-7",
  },
  {
    id: "q-8",
    artistId: "art-kit",
    title: "Sensational: Interscope disappearance teaser",
    outputType: "sensational",
    source: "autopilot",
    status: "pending",
    risk: "flagged",
    riskNotes: [
      "Unsourced claim (1 rumor source)",
      "Legal: third-party label mention",
    ],
    thumbKind: "video",
    createdAt: "3h ago",
    angleId: "ang-6",
  },
  {
    id: "q-9",
    artistId: "art-maren",
    title: "Short-form: tour anxiety routine, vertical",
    outputType: "short_form",
    source: "autopilot",
    status: "pending",
    risk: "low",
    riskNotes: [],
    thumbKind: "video",
    createdAt: "5h ago",
    angleId: "ang-9",
  },
  {
    id: "q-10",
    artistId: "art-gracie",
    title: "BTS: phone demos — fan-clip retake",
    outputType: "short_form",
    source: "fan_brief",
    status: "pending",
    risk: "medium",
    riskNotes: ["Fan claim unverified in the first 8 sec"],
    thumbKind: "brief",
    createdAt: "2h ago",
    angleId: "ang-18",
  },
  {
    id: "q-11",
    artistId: "art-papi",
    title: "Mini-doc: 'Natt' making-of, 7 min",
    outputType: "mini_doc",
    source: "human",
    status: "scheduled",
    scheduledFor: "Sat · 10:00 am",
    risk: "low",
    riskNotes: [],
    thumbKind: "video",
    createdAt: "1d ago",
    angleId: "ang-21",
  },
  {
    id: "q-12",
    artistId: "art-june",
    title: "Sensational: Austin walk-off framing",
    outputType: "sensational",
    source: "autopilot",
    status: "pending",
    risk: "flagged",
    riskNotes: ["Zero sources — fan clip only", "Speculative framing"],
    thumbKind: "video",
    createdAt: "7h ago",
    angleId: "ang-4",
  },
  {
    id: "q-13",
    artistId: "art-dre",
    title: "Tour recap: Manchester crowd moment",
    outputType: "tour_recap",
    source: "autopilot",
    status: "pending",
    risk: "medium",
    riskNotes: ["Missing set-time timestamps in source"],
    thumbKind: "video",
    createdAt: "4h ago",
  },
  {
    id: "q-14",
    artistId: "art-maren",
    title: "Fan brief edit — Paris tour check-in",
    outputType: "fan_brief",
    source: "fan_brief",
    status: "pending",
    risk: "low",
    riskNotes: [],
    thumbKind: "brief",
    createdAt: "2h ago",
  },
];

export const ANGLE_FAMILY_LABEL: Record<AngleFamily, string> = {
  sensational: "Sensational",
  self_help: "Self-help",
  tour_recap: "Tour recap",
  bts: "Behind-the-scenes",
  mini_doc: "Mini-doc",
};

export const ANGLE_FAMILY_COLOR: Record<
  AngleFamily,
  { bg: string; fg: string }
> = {
  sensational: { bg: "rgba(232,67,10,0.12)", fg: "#e8430a" },
  self_help: { bg: "rgba(74,160,122,0.12)", fg: "#4aa07a" },
  tour_recap: { bg: "rgba(110,139,199,0.14)", fg: "#8ba4d4" },
  bts: { bg: "rgba(184,134,62,0.14)", fg: "#c49a5a" },
  mini_doc: { bg: "rgba(138,107,181,0.14)", fg: "#ac8fd1" },
};

export const OUTPUT_TYPE_LABEL: Record<OutputType, string> = {
  short_form: "Short-form clip",
  mini_doc: "Mini-doc",
  sensational: "Sensational angle",
  self_help: "Self-help tie-in",
  tour_recap: "Tour recap",
  fan_brief: "Fan brief edit",
  link_video: "Link → video",
};

export const QUEUE_SOURCE_LABEL: Record<QueueSource, string> = {
  autopilot: "Autopilot",
  human: "Human",
  fan_brief: "Fan brief",
};

export const RISK_COLOR: Record<
  RiskLevel,
  { dot: string; bg: string; fg: string; label: string }
> = {
  low: {
    dot: "#4aa07a",
    bg: "rgba(74,160,122,0.12)",
    fg: "#4aa07a",
    label: "LOW",
  },
  medium: {
    dot: "#d9a44a",
    bg: "rgba(217,164,74,0.14)",
    fg: "#d9a44a",
    label: "MEDIUM",
  },
  flagged: {
    dot: "#dc2626",
    bg: "rgba(220,38,38,0.14)",
    fg: "#dc2626",
    label: "FLAGGED",
  },
};

export function artistById(id: string): Artist | undefined {
  return MOCK_ARTISTS.find((a) => a.id === id);
}

export function angleById(id: string): Angle | undefined {
  return MOCK_ANGLES.find((a) => a.id === id);
}

export function artistInventory(
  artistId: string,
  angles: Angle[],
  queue: QueueItem[],
): { unshipped: number; scheduled: number; killedThisWeek: number } {
  const arr = angles.filter((a) => a.artistId === artistId);
  return {
    unshipped: arr.filter((a) => !a.killed).length,
    scheduled: queue.filter(
      (q) => q.artistId === artistId && q.status === "scheduled",
    ).length,
    killedThisWeek: arr.filter((a) => a.killed).length,
  };
}
