import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";
import type { DecisionPoint } from "@/data/contentDashboardHelpers";
import { decisionPointKey } from "@/utils/decisionPointKey";

const SUPABASE_URL = "https://kxvgbowrkmowuyezoeke.supabase.co";

export type ForwardTarget = "user" | "email" | "slack";

export interface DecisionPointActionRow {
  id: string;
  user_id: string;
  label_id: string;
  brief_date: string;
  decision_point_key: string;
  decision_point_snapshot: DecisionPoint;
  action_type: "acknowledged" | "snoozed" | "forwarded";
  snooze_until: string | null;
  forwarded_to_user_id: string | null;
  forwarded_to_email: string | null;
  forwarded_to_slack_channel: string | null;
  forward_note: string | null;
  created_at: string;
}

export interface RevisitingEntry {
  key: string;
  decisionPoint: DecisionPoint;
  reason: "snoozed" | "forwarded_to_me";
  /** For snoozed: the original brief_date the DP came from. For forwarded_to_me: the sender's brief_date. */
  originalBriefDate: string;
  /** For forwarded_to_me only: the sender's note, if any */
  note?: string | null;
  /** For forwarded_to_me only: the sender's user_id (resolve to a display name via useLabelTeammates) */
  senderUserId?: string;
}

function isSameDay(iso: string, ymd: string): boolean {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}` === ymd;
}

function todayYmd(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function useDecisionPointActions(briefDate: string) {
  const { labelId } = useUserProfile();
  const queryClient = useQueryClient();
  const queryKey = ["decision-point-actions", labelId];

  const { data: rows = [], isLoading } = useQuery<DecisionPointActionRow[]>({
    queryKey,
    enabled: !!labelId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!labelId) return [];
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("decision_point_actions" as any)
        .select("*")
        .or(`user_id.eq.${user.id},forwarded_to_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DecisionPointActionRow[];
    },
  });

  const today = todayYmd();

  /** Keys the current user has acknowledged on this brief_date */
  const acknowledgedKeys = useMemo(() => {
    const s = new Set<string>();
    for (const row of rows) {
      if (
        row.action_type === "acknowledged" &&
        row.brief_date === briefDate &&
        row.label_id === labelId
      ) {
        s.add(row.decision_point_key);
      }
    }
    return s;
  }, [rows, briefDate, labelId]);

  /** Keys snoozed to a future time on this brief_date (should be hidden) */
  const futureSnoozedKeys = useMemo(() => {
    const now = Date.now();
    const s = new Set<string>();
    for (const row of rows) {
      if (
        row.action_type === "snoozed" &&
        row.brief_date === briefDate &&
        row.label_id === labelId &&
        row.snooze_until &&
        new Date(row.snooze_until).getTime() > now
      ) {
        s.add(row.decision_point_key);
      }
    }
    return s;
  }, [rows, briefDate, labelId]);

  /**
   * Decision points that should re-surface today:
   *  - snoozed by me with snooze_until::date = today (from ANY brief_date)
   *  - forwarded to me by a teammate (any brief_date, not yet acknowledged)
   * Deduplicated by key, preferring the most recent row.
   */
  const revisiting = useMemo<RevisitingEntry[]>(() => {
    const seen = new Set<string>();
    const out: RevisitingEntry[] = [];

    for (const row of rows) {
      if (row.label_id !== labelId) continue;

      if (
        row.action_type === "snoozed" &&
        row.snooze_until &&
        isSameDay(row.snooze_until, today)
      ) {
        if (seen.has(row.decision_point_key)) continue;
        // Skip if I've since acknowledged it
        if (
          rows.some(
            (r) =>
              r.decision_point_key === row.decision_point_key &&
              r.action_type === "acknowledged" &&
              new Date(r.created_at).getTime() >
                new Date(row.created_at).getTime(),
          )
        ) {
          continue;
        }
        seen.add(row.decision_point_key);
        out.push({
          key: row.decision_point_key,
          decisionPoint: row.decision_point_snapshot,
          reason: "snoozed",
          originalBriefDate: row.brief_date,
        });
      } else if (row.action_type === "forwarded" && row.forwarded_to_user_id) {
        // This row shows up here only if it was forwarded TO the current user
        // (RLS already filtered — we just need to confirm it's not our own outgoing forward)
        if (seen.has(row.decision_point_key)) continue;
        if (row.user_id === row.forwarded_to_user_id) continue;
        // Skip if the recipient (me) already acknowledged it
        if (
          rows.some(
            (r) =>
              r.decision_point_key === row.decision_point_key &&
              r.action_type === "acknowledged" &&
              r.user_id !== row.user_id,
          )
        ) {
          continue;
        }
        seen.add(row.decision_point_key);
        out.push({
          key: row.decision_point_key,
          decisionPoint: row.decision_point_snapshot,
          reason: "forwarded_to_me",
          originalBriefDate: row.brief_date,
          note: row.forward_note,
          senderUserId: row.user_id,
        });
      }
    }
    return out;
  }, [rows, labelId, today]);

  const unacknowledge = useMutation({
    mutationFn: async (dp: DecisionPoint) => {
      if (!labelId) throw new Error("No active label");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const key = decisionPointKey(dp, briefDate);

      const { error } = await supabase
        .from("decision_point_actions" as any)
        .delete()
        .eq("user_id", user.id)
        .eq("label_id", labelId)
        .eq("brief_date", briefDate)
        .eq("decision_point_key", key)
        .eq("action_type", "acknowledged");
      if (error) throw error;
      return key;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      toast.error(`Couldn't undo: ${(err as Error).message}`);
    },
  });

  const acknowledge = useMutation({
    mutationFn: async (dp: DecisionPoint) => {
      if (!labelId) throw new Error("No active label");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const key = decisionPointKey(dp, briefDate);

      const { error } = await supabase
        .from("decision_point_actions" as any)
        .upsert(
          {
            user_id: user.id,
            label_id: labelId,
            brief_date: briefDate,
            decision_point_key: key,
            decision_point_snapshot: dp,
            action_type: "acknowledged",
          },
          {
            onConflict: "user_id,label_id,brief_date,decision_point_key",
            ignoreDuplicates: false,
          },
        );
      if (error) throw error;
      return key;
    },
    onSuccess: (_key, dp) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Got it — removed from today's brief", {
        action: {
          label: "Undo",
          onClick: () => unacknowledge.mutate(dp),
        },
        duration: 5000,
      });
    },
    onError: (err) => {
      toast.error(`Couldn't dismiss: ${(err as Error).message}`);
    },
  });

  const snooze = useMutation({
    mutationFn: async ({
      dp,
      snoozeUntilIso,
    }: {
      dp: DecisionPoint;
      snoozeUntilIso: string;
    }) => {
      if (!labelId) throw new Error("No active label");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const key = decisionPointKey(dp, briefDate);

      const { error } = await supabase
        .from("decision_point_actions" as any)
        .insert({
          user_id: user.id,
          label_id: labelId,
          brief_date: briefDate,
          decision_point_key: key,
          decision_point_snapshot: dp,
          action_type: "snoozed",
          snooze_until: snoozeUntilIso,
        });
      if (error) throw error;
      return { key, snoozeUntilIso };
    },
    onSuccess: ({ snoozeUntilIso }) => {
      queryClient.invalidateQueries({ queryKey });
      const when = new Date(snoozeUntilIso).toLocaleString(undefined, {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
      });
      toast.success(`Snoozed until ${when}`);
    },
    onError: (err) => {
      toast.error(`Couldn't snooze: ${(err as Error).message}`);
    },
  });

  const forward = useMutation({
    mutationFn: async ({
      dp,
      target,
      targetValue,
      note,
    }: {
      dp: DecisionPoint;
      target: ForwardTarget;
      targetValue: string;
      note?: string;
    }) => {
      if (!labelId) throw new Error("No active label");
      const key = decisionPointKey(dp, briefDate);
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/forward-decision-point`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target,
            target_value: targetValue,
            label_id: labelId,
            brief_date: briefDate,
            decision_point_key: key,
            decision_point_snapshot: dp,
            note: note ?? null,
          }),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error || `Forward failed (${res.status})`);
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey });
      const label =
        vars.target === "email"
          ? `email to ${vars.targetValue}`
          : vars.target === "slack"
            ? `Slack ${vars.targetValue}`
            : "teammate";
      toast.success(`Forwarded to ${label}`);
    },
    onError: (err) => {
      toast.error(`Forward failed: ${(err as Error).message}`);
    },
  });

  return {
    isLoading,
    acknowledgedKeys,
    futureSnoozedKeys,
    revisiting,
    acknowledge,
    unacknowledge,
    snooze,
    forward,
    rows,
  };
}

/**
 * Fetch the current user's teammates on a given label via SECURITY DEFINER RPC.
 * Used by the Forward dialog's "Wavebound teammate" tab.
 */
export function useLabelTeammates(labelId: string | null) {
  return useQuery({
    queryKey: ["label-teammates", labelId],
    enabled: !!labelId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!labelId) return [];
      const { data, error } = await supabase.rpc(
        "get_label_teammates" as any,
        { p_label_id: labelId } as any,
      );
      if (error) throw error;
      return (data ?? []) as Array<{
        user_id: string;
        email: string | null;
        artist_handle: string | null;
        label_role: string | null;
      }>;
    },
  });
}
