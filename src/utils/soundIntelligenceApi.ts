import { supabase } from '@/integrations/supabase/client';

const BASE_URL = 'https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dmdib3dya21vd3V5ZXpvZWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjUzMjUsImV4cCI6MjA3MjM0MTMyNX0.jyd5K06zFJv9yK2tj8Pj2oATohbKnMD6hXwit6T50DY';

async function getAuthHeaders() {
  const { data: { session }, error } = await supabase.auth.refreshSession();
  const token = session?.access_token;
  if (!token || error) throw new Error('Not authenticated');
  return {
    'Authorization': `Bearer ${token}`,
    'apikey': ANON_KEY,
    'Content-Type': 'application/json',
  };
}

/** Extract the numeric sound_id from a TikTok music URL */
export function extractSoundId(input: string): string | null {
  const match = input.match(/\/music\/[^/]+-(\d+)/);
  return match ? match[1] : null;
}

export async function triggerSoundAnalysis(soundUrl: string, labelId: string | null) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/trigger-sound-analysis`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sound_url: soundUrl, label_id: labelId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json() as Promise<{ success: boolean; job_id: string; cached: boolean }>;
}

export async function getSoundAnalysis(params: { job_id?: string; sound_id?: string; label_id?: string }) {
  const query = new URLSearchParams();
  if (params.job_id) query.set('job_id', params.job_id);
  if (params.sound_id) query.set('sound_id', params.sound_id);
  if (params.label_id) query.set('label_id', params.label_id);

  const res = await fetch(`${BASE_URL}/get-sound-analysis?${query}`, {
    headers: { 'apikey': ANON_KEY },
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export interface ListAnalysisEntry {
  job_id: string;
  sound_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  status: 'pending' | 'scraping' | 'classifying' | 'synthesizing' | 'completed' | 'failed';
  videos_scraped: number;
  videos_analyzed: number;
  created_at: string;
  completed_at: string | null;
  summary: {
    engagement_rate: number;
    winner_format: string;
    winner_multiplier: number;
    total_views: number;
    velocity_status: string;
    peak_day: string;
    format_count: number;
    videos_analyzed: number;
  } | null;
}

export async function listSoundAnalyses(labelId: string): Promise<ListAnalysisEntry[]> {
  const res = await fetch(`${BASE_URL}/list-sound-analyses?label_id=${labelId}`, {
    headers: { 'apikey': ANON_KEY },
  });
  if (!res.ok) throw new Error('Failed to list analyses');
  const data = await res.json();
  return data.analyses || [];
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 10_000) return (n / 1_000).toFixed(0) + 'K';
  if (n >= 1_000) return n.toLocaleString();
  return String(n);
}
