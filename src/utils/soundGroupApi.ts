import { supabase } from "@/integrations/supabase/client";
import type {
  SoundCanonicalGroup,
  SoundCanonicalGroupMember,
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

function soundGroupsTable() {
  return (supabase as any).from("sound_canonical_groups");
}

function soundGroupMembersTable() {
  return (supabase as any).from("sound_canonical_group_members");
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

export function getGroupedJobIds(groups: SoundCanonicalGroup[]): Set<string> {
  return new Set(
    groups.flatMap((group) => group.members.map((member) => member.job_id)),
  );
}
