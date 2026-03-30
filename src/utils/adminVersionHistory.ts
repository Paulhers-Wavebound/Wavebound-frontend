import { supabase } from '@/integrations/supabase/client';

const BASE_URL = 'https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dmdib3dya21vd3V5ZXpvZWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjUzMjUsImV4cCI6MjA3MjM0MTMyNX0.jyd5K06zFJv9yK2tj8Pj2oATohbKnMD6hXwit6T50DY';

async function getAuthHeaders() {
  const { data: { session }, error } = await supabase.auth.refreshSession();
  if (!session?.access_token || error) throw new Error('Not authenticated');
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': ANON_KEY,
    'Content-Type': 'application/json',
  };
}

export type DeliverableType =
  | 'content_plan_7day'
  | 'content_plan_7day_html'
  | 'content_plan_30day'
  | 'intelligence_report'
  | 'artist_brief';

export interface DeliverableVersion {
  id: number;
  artist_handle: string;
  deliverable_type: DeliverableType;
  version_number: number;
  content: Record<string, unknown> | null;
  content_html: string | null;
  created_at: string;
  created_by: 'pipeline' | 'pipeline_render' | 'human_swap' | 'revert';
  week_of: string | null;
  job_id: string | null;
  notes: string | null;
}

export interface CurrentDeliverable {
  has_content: boolean;
  has_html: boolean;
  content_size: number | null;
  html_size: number | null;
}

export interface VersionListResponse {
  versions: DeliverableVersion[];
  current: Record<string, CurrentDeliverable>;
}

export interface RevertResponse {
  status: 'reverted';
  deliverable_type: string;
  restored_version: number;
  artist_handle: string;
  re_render_triggered: boolean;
}

export async function fetchVersions(
  artistHandle: string,
  deliverableType?: DeliverableType
): Promise<VersionListResponse> {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams({ artist_handle: artistHandle });
  if (deliverableType) params.set('deliverable_type', deliverableType);

  const res = await fetch(`${BASE_URL}/get-deliverable-versions?${params}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Failed to fetch versions');
  }
  return res.json();
}

export async function fetchVersionDetail(versionId: number): Promise<DeliverableVersion> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/get-deliverable-versions?version_id=${versionId}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Failed to fetch version detail');
  }
  const data = await res.json();
  return data.version;
}

export async function revertVersion(
  versionId: number,
  artistHandle: string,
  reRender = false
): Promise<RevertResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/revert-deliverable-version`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ version_id: versionId, artist_handle: artistHandle, re_render: reRender }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Revert failed');
  }
  return res.json();
}

export const DELIVERABLE_TYPE_CONFIG: Record<DeliverableType, { label: string; color: string }> = {
  content_plan_7day: { label: '7-Day Plan', color: '#3b82f6' },
  content_plan_7day_html: { label: '7-Day HTML', color: '#6366f1' },
  content_plan_30day: { label: '30-Day Plan', color: '#8b5cf6' },
  intelligence_report: { label: 'Intel Report', color: '#14b8a6' },
  artist_brief: { label: 'Artist Brief', color: '#f59e0b' },
};

export const CREATED_BY_CONFIG: Record<string, { label: string; className: string }> = {
  pipeline: { label: 'Pipeline', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  pipeline_render: { label: 'Render Pipeline', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  human_swap: { label: 'Manual Swap', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  revert: { label: 'Reverted', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
};

export function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
