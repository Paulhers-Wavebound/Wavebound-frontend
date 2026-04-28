export type LeadHunterJobStatus = "pending" | "running" | "complete" | "failed";

export interface LeadHunterProgress {
  phase?: string;
  tool_call_counts?: Record<string, number>;
  current_focus?: string;
  leads_found?: number;
  web_search_capped?: boolean;
  elapsed_seconds?: number;
}

export interface LeadHunterSourceBreadcrumb {
  source_type:
    | "wavebound_dossier"
    | "roster_data"
    | "web"
    | "interview"
    | "reddit"
    | "fan_comment"
    | "social"
    | "lyrics"
    | "chart_data"
    | "video_analysis"
    | string;
  source_name: string;
  source_url: string | null;
  what_it_suggests: string;
  proof_status:
    | "verified"
    | "likely"
    | "fan_signal"
    | "unverified_signal"
    | "needs_checking"
    | string;
}

export interface LeadHunterLead {
  lead_id: string;
  working_title: string;
  one_sentence_angle: string;
  raw_story_arc: string;
  why_fans_would_care: string;
  artist_positive_frame: string;
  tension_source: string;
  curiosity_engine: string;
  possible_hook_energy: string;
  known_or_suspected_facts: string[];
  source_breadcrumbs: LeadHunterSourceBreadcrumb[];
  verification_questions: string[];
  risk_notes: string;
  scores: {
    curiosity: number;
    artist_positive: number;
    specificity: number;
    verification_likelihood: number;
    visual_potential: number;
    overall_promise: number;
  };
}

export interface LeadHunterRecommendation {
  lead_id: string;
  reason: string;
}

export interface LeadHunterResult {
  lead_hunter_version: string;
  artist_name: string;
  lead_hunter_summary: string;
  leads: LeadHunterLead[];
  top_3_recommended_for_angle_board: LeadHunterRecommendation[];
  discarded_patterns: string[];
}

export interface CreateLeadHunterJobInput {
  artist_name: string;
  artist_handle?: string;
  user_notes?: string;
  source_chat_job_id?: string;
}

export interface CreateLeadHunterJobResponse {
  job_id: string;
  status: LeadHunterJobStatus;
  created_at?: string;
}

export interface LeadHunterJobResponse {
  job_id: string;
  status: LeadHunterJobStatus;
  progress: LeadHunterProgress;
  result_json: LeadHunterResult | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// Compact projection used to render the "Recent runs" picker. Only the columns
// the popover actually needs — the full result_json is fetched lazily when the
// user clicks an entry (and then cached in React Query under the same job_id).
export interface LeadHunterJobSummary {
  id: string;
  artist_name: string | null;
  artist_handle: string | null;
  status: LeadHunterJobStatus;
  completed_at: string | null;
  created_at: string;
  lead_hunter_summary: string | null;
}
