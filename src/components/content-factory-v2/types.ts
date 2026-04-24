export type AngleFamily =
  | "sensational"
  | "self_help"
  | "tour_recap"
  | "bts"
  | "mini_doc";

export type RiskLevel = "low" | "medium" | "flagged";
export type QueueSource = "autopilot" | "human" | "fan_brief";
export type OutputType =
  | "short_form"
  | "mini_doc"
  | "sensational"
  | "self_help"
  | "tour_recap"
  | "fan_brief"
  | "link_video";

export interface Artist {
  id: string;
  name: string;
  handle: string;
  labelName: string;
  market: string;
  chartPosition: string | null;
  monthlyListeners: string;
  unshippedAngles: number;
  scheduled: number;
  publishedThisWeek: number;
  isExample?: boolean;
}

export type AngleSourceKind =
  | "article"
  | "transcript"
  | "social"
  | "podcast"
  | "forum"
  | "other";

export interface AngleSource {
  label: string;
  kind: AngleSourceKind;
  date: string;
  url?: string;
}

export interface Angle {
  id: string;
  artistId: string;
  title: string;
  summary: string;
  family: AngleFamily;
  sourceCount: number;
  mostRecentSourceMonth: string | null;
  speculative: boolean;
  sources?: AngleSource[];
  favorited?: boolean;
  killed?: boolean;
}

export type QueueStatus = "pending" | "scheduled";

export interface QueueItem {
  id: string;
  artistId: string;
  title: string;
  outputType: OutputType;
  source: QueueSource;
  status: QueueStatus;
  risk: RiskLevel;
  riskNotes: string[];
  thumbKind: "video" | "brief" | "link";
  createdAt: string;
  scheduledFor?: string;
  angleId?: string;
}

export type AngleFamilyFilter = "all" | AngleFamily;

export type KillReason = "angle_wrong" | "tone_off" | "factual_issue" | "other";
