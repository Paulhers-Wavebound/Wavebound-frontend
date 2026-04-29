import { supabase } from "@/integrations/supabase/client";
import type {
  MonitoringHistorySummary,
  MonitoringSnapshot,
  SoundAnalysis,
  SoundCanonicalGroup,
  SoundCanonicalGroupMember,
  SoundDuplicateAutoMergeResult,
  SoundDuplicateCandidate,
  SoundMonitoring,
} from "@/types/soundIntelligence";
import {
  extractSoundId,
  ListAnalysisEntry,
  triggerSoundAnalysis,
  validateSoundUrl,
} from "@/utils/soundIntelligenceApi";

const GROUP_COLUMNS =
  "id,label_id,name,artist_name,cover_url,primary_job_id,created_by,created_at,updated_at";
const MEMBER_COLUMNS =
  "id,group_id,label_id,job_id,sound_id,sound_url,alias_label,added_by,created_at";

export interface ResolvedSoundJob {
  jobId: string;
  soundId: string;
  soundUrl: string;
  entry: ListAnalysisEntry | null;
}

export interface SoundGroupBundleMember {
  member: SoundCanonicalGroupMember;
  entry: ListAnalysisEntry | null;
  analysis: SoundAnalysis | null;
  monitoring: SoundMonitoring | null;
}

export interface SoundGroupBundle {
  group: SoundCanonicalGroup;
  members: SoundGroupBundleMember[];
}

type RawSoundGroup = Omit<SoundCanonicalGroup, "members"> & {
  members?: SoundCanonicalGroupMember[];
};

type RawSoundGroupBundle = {
  group?: RawSoundGroup;
  members?: SoundGroupBundleMember[];
};

type GroupMonitoringHistoryResponse = {
  snapshots?: MonitoringSnapshot[];
  summary?: MonitoringHistorySummary;
};

function soundGroupsTable() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generated Supabase types do not include this local migration table yet.
  return (supabase as any).from("sound_canonical_groups");
}

function soundGroupMembersTable() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generated Supabase types do not include this local migration table yet.
  return (supabase as any).from("sound_canonical_group_members");
}

function rpc<T>(name: string, args: Record<string, unknown>): Promise<{
  data: T | null;
  error: { message: string; code?: string } | null;
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generated Supabase types do not include these RPCs yet.
  return (supabase as any).rpc(name, args);
}

export function extractSoundUrls(input: string): string[] {
  const urlMatches = input.match(/https?:\/\/[^\s,]+/g) ?? [];
  const candidates = urlMatches.length > 0 ? urlMatches : input.split(/[\s,]+/);
  const seen = new Set<string>();

  return candidates
    .map((candidate) => candidate.trim().replace(/[),.;]+$/, ""))
    .filter((candidate) => candidate.includes("tiktok.com"))
    .filter((candidate) => {
      const soundId = extractSoundId(candidate);
      if (!soundId || seen.has(soundId)) return false;
      seen.add(soundId);
      return true;
    });
}

export function validateSoundUrls(urls: string[]): string | null {
  if (urls.length === 0) return "Paste at least one TikTok sound URL.";

  for (const url of urls) {
    const validation = validateSoundUrl(url);
    if (!validation.valid) return validation.reason ?? "Invalid TikTok sound URL.";
  }

  return null;
}

function attachMembers(
  groups: Omit<SoundCanonicalGroup, "members">[],
  members: SoundCanonicalGroupMember[],
): SoundCanonicalGroup[] {
  const membersByGroup = new Map<string, SoundCanonicalGroupMember[]>();

  for (const member of members) {
    const list = membersByGroup.get(member.group_id) ?? [];
    list.push(member);
    membersByGroup.set(member.group_id, list);
  }

  return groups.map((group) => ({
    ...group,
    members: membersByGroup.get(group.id) ?? [],
  }));
}

export async function listSoundGroups(
  labelId: string,
): Promise<SoundCanonicalGroup[]> {
  const { data: rpcGroups, error: rpcError } = await rpc<RawSoundGroup[]>(
    "get_sound_canonical_groups",
    { p_label_id: labelId },
  );

  if (!rpcError && Array.isArray(rpcGroups)) {
    return rpcGroups.map((group) => ({
      id: group.id,
      label_id: group.label_id,
      name: group.name,
      artist_name: group.artist_name,
      cover_url: group.cover_url,
      primary_job_id: group.primary_job_id,
      created_by: group.created_by,
      created_at: group.created_at,
      updated_at: group.updated_at,
      members: group.members ?? [],
    }));
  }

  const { data: groups, error: groupsError } = await soundGroupsTable()
    .select(GROUP_COLUMNS)
    .eq("label_id", labelId)
    .order("updated_at", { ascending: false });

  if (groupsError) throw new Error(groupsError.message);
  if (!groups || groups.length === 0) return [];

  const groupIds = groups.map((group: SoundCanonicalGroup) => group.id);
  const { data: members, error: membersError } = await soundGroupMembersTable()
    .select(MEMBER_COLUMNS)
    .eq("label_id", labelId)
    .in("group_id", groupIds)
    .order("created_at", { ascending: true });

  if (membersError) throw new Error(membersError.message);
  return attachMembers(groups, members ?? []);
}

export async function getSoundGroup(
  groupId: string,
  labelId: string,
): Promise<SoundCanonicalGroup | null> {
  const { data: group, error: groupError } = await soundGroupsTable()
    .select(GROUP_COLUMNS)
    .eq("id", groupId)
    .eq("label_id", labelId)
    .maybeSingle();

  if (groupError) throw new Error(groupError.message);
  if (!group) return null;

  const { data: members, error: membersError } = await soundGroupMembersTable()
    .select(MEMBER_COLUMNS)
    .eq("group_id", groupId)
    .eq("label_id", labelId)
    .order("created_at", { ascending: true });

  if (membersError) throw new Error(membersError.message);
  return { ...group, members: members ?? [] };
}

export async function getSoundGroupForJob(
  jobId: string,
  labelId: string,
): Promise<SoundCanonicalGroup | null> {
  const { data: member, error } = await soundGroupMembersTable()
    .select("group_id")
    .eq("job_id", jobId)
    .eq("label_id", labelId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!member?.group_id) return null;
  return getSoundGroup(member.group_id, labelId);
}

function coerceBundleMember(raw: unknown): SoundGroupBundleMember {
  const member = raw as Partial<SoundGroupBundleMember>;
  return {
    member: member.member as SoundCanonicalGroupMember,
    entry: member.entry ?? null,
    analysis: member.analysis ?? null,
    monitoring: member.monitoring ?? null,
  };
}

export async function getSoundGroupBundle(
  groupId: string,
  labelId: string,
): Promise<SoundGroupBundle | null> {
  const { data, error } = await rpc<RawSoundGroupBundle>(
    "get_sound_group_detail",
    {
      p_group_id: groupId,
      p_label_id: labelId,
    },
  );

  if (error) throw new Error(error.message);
  if (!data?.group) return null;

  const members = (data.members ?? []).map(coerceBundleMember);
  return {
    group: {
      ...data.group,
      members: members.map((member) => member.member),
    },
    members,
  };
}

export async function getSoundGroupMonitoringHistory(
  groupId: string,
  labelId: string,
  hours?: number,
): Promise<{
  snapshots: MonitoringSnapshot[];
  summary: MonitoringHistorySummary;
}> {
  const { data, error } = await rpc<GroupMonitoringHistoryResponse>(
    "get_sound_group_monitoring_history",
    {
      p_group_id: groupId,
      p_label_id: labelId,
      p_hours: hours ?? 24,
    },
  );

  if (error) throw new Error(error.message);
  return {
    snapshots: data?.snapshots ?? [],
    summary:
      data?.summary ?? {
        snapshot_count: 0,
        hours_span: 0,
        total_view_growth: 0,
        total_video_growth: 0,
        format_growth: {},
      },
  };
}

export async function listSoundDuplicateCandidates(
  labelId: string,
): Promise<SoundDuplicateCandidate[]> {
  const { data, error } = await rpc<SoundDuplicateCandidate[]>(
    "get_sound_duplicate_candidates",
    { p_label_id: labelId },
  );

  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data : [];
}

export async function setSoundDuplicateCandidateDecision(params: {
  labelId: string;
  matchType: SoundDuplicateCandidate["match_type"];
  matchKey: string;
  status: "dismissed" | "snoozed";
  snoozedUntil?: string | null;
}): Promise<void> {
  const { error } = await rpc("upsert_sound_duplicate_candidate_decision", {
    p_label_id: params.labelId,
    p_match_type: params.matchType,
    p_match_key: params.matchKey,
    p_status: params.status,
    p_snoozed_until: params.snoozedUntil ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function autoMergeHighConfidenceSoundDuplicates(
  labelId: string,
): Promise<SoundDuplicateAutoMergeResult> {
  const { data, error } = await rpc<SoundDuplicateAutoMergeResult>(
    "auto_merge_high_confidence_sound_duplicates",
    { p_label_id: labelId },
  );

  if (error) throw new Error(error.message);
  return data ?? { created_count: 0, groups: [] };
}

async function resolveSoundJobsForUrls(
  labelId: string,
  urls: string[],
  existingEntries: ListAnalysisEntry[],
): Promise<ResolvedSoundJob[]> {
  const resolved: ResolvedSoundJob[] = [];

  for (const soundUrl of urls) {
    const soundId = extractSoundId(soundUrl);
    if (!soundId) throw new Error("Could not extract sound ID from one URL.");

    const existing =
      existingEntries.find(
        (entry) => entry.sound_id === soundId && entry.status === "completed",
      ) ?? existingEntries.find((entry) => entry.sound_id === soundId);

    if (existing) {
      resolved.push({
        jobId: existing.job_id,
        soundId,
        soundUrl,
        entry: existing,
      });
      continue;
    }

    const triggered = await triggerSoundAnalysis(soundUrl, labelId);
    resolved.push({
      jobId: triggered.job_id,
      soundId,
      soundUrl,
      entry: null,
    });
  }

  return resolved;
}

function inferGroupName(
  explicitName: string | null | undefined,
  resolved: ResolvedSoundJob[],
): string {
  const trimmed = explicitName?.trim();
  if (trimmed) return trimmed;

  const primaryEntry = resolved.find((item) => item.entry?.track_name)?.entry;
  if (primaryEntry?.track_name && primaryEntry.artist_name) {
    return `${primaryEntry.track_name} — ${primaryEntry.artist_name}`;
  }
  if (primaryEntry?.track_name) return primaryEntry.track_name;
  return "Merged TikTok sound";
}

export async function createSoundGroupFromUrls(params: {
  labelId: string;
  urls: string[];
  name?: string;
  existingEntries: ListAnalysisEntry[];
}): Promise<SoundCanonicalGroup> {
  const validationError = validateSoundUrls(params.urls);
  if (validationError) throw new Error(validationError);

  const resolved = await resolveSoundJobsForUrls(
    params.labelId,
    params.urls,
    params.existingEntries,
  );
  if (resolved.length < 2) {
    throw new Error("Add at least two distinct sound IDs to create a merge.");
  }

  const primary = resolved[0];
  const primaryEntry = primary.entry;
  const name = inferGroupName(params.name, resolved);

  const { data: group, error: groupError } = await soundGroupsTable()
    .insert({
      label_id: params.labelId,
      name,
      artist_name: primaryEntry?.artist_name ?? null,
      cover_url: primaryEntry?.cover_url ?? null,
      primary_job_id: primary.jobId,
    })
    .select(GROUP_COLUMNS)
    .single();

  if (groupError) throw new Error(groupError.message);

  const rows = resolved.map((item) => ({
    group_id: group.id,
    label_id: params.labelId,
    job_id: item.jobId,
    sound_id: item.soundId,
    sound_url: item.soundUrl,
    alias_label: item.entry?.track_name || null,
  }));

  const { error: memberError } = await soundGroupMembersTable().insert(rows);
  if (memberError) {
    await soundGroupsTable().delete().eq("id", group.id);
    if (memberError.code === "23505") {
      throw new Error("One of those sound IDs already belongs to a merged sound.");
    }
    throw new Error(memberError.message);
  }

  return {
    ...group,
    members: rows.map((row, index) => ({
      id: `${group.id}:${row.sound_id}:${index}`,
      added_by: null,
      created_at: new Date().toISOString(),
      ...row,
    })),
  };
}

export async function addSoundGroupMembers(params: {
  group: SoundCanonicalGroup;
  labelId: string;
  urls: string[];
  existingEntries: ListAnalysisEntry[];
}): Promise<void> {
  const validationError = validateSoundUrls(params.urls);
  if (validationError) throw new Error(validationError);

  const existingSoundIds = new Set(
    params.group.members.map((member) => member.sound_id),
  );
  const newUrls = params.urls.filter((url) => {
    const soundId = extractSoundId(url);
    return soundId && !existingSoundIds.has(soundId);
  });

  if (newUrls.length === 0) {
    throw new Error("Those sound IDs are already attached to this merged sound.");
  }

  const resolved = await resolveSoundJobsForUrls(
    params.labelId,
    newUrls,
    params.existingEntries,
  );

  const { error } = await soundGroupMembersTable().insert(
    resolved.map((item) => ({
      group_id: params.group.id,
      label_id: params.labelId,
      job_id: item.jobId,
      sound_id: item.soundId,
      sound_url: item.soundUrl,
      alias_label: item.entry?.track_name || null,
    })),
  );

  if (error) {
    if (error.code === "23505") {
      throw new Error("One of those sound IDs already belongs to a merged sound.");
    }
    throw new Error(error.message);
  }
}

export async function addExistingJobToSoundGroup(params: {
  groupId: string;
  labelId: string;
  jobId: string;
  soundId: string;
  soundUrl: string;
  aliasLabel?: string | null;
}): Promise<void> {
  const { error } = await soundGroupMembersTable().insert({
    group_id: params.groupId,
    label_id: params.labelId,
    job_id: params.jobId,
    sound_id: params.soundId,
    sound_url: params.soundUrl,
    alias_label: params.aliasLabel ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("This sound ID already belongs to a merged sound.");
    }
    throw new Error(error.message);
  }
}

export function soundCandidateToUrls(
  candidate: SoundDuplicateCandidate,
): string[] {
  return candidate.sound_urls.filter(Boolean);
}

export function soundCandidateName(candidate: SoundDuplicateCandidate): string {
  if (candidate.track_name && candidate.artist_name) {
    return `${candidate.track_name} — ${candidate.artist_name}`;
  }
  return candidate.track_name || "Merged TikTok sound";
}

export function getGroupedJobIds(groups: SoundCanonicalGroup[]): Set<string> {
  return new Set(
    groups.flatMap((group) => group.members.map((member) => member.job_id)),
  );
}
