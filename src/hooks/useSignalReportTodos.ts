import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";
import type { SignalReportTodo } from "@/data/contentDashboardHelpers";

export interface SignalReportTodoStateRow {
  id: string;
  user_id: string;
  label_id: string;
  brief_date: string;
  todo_key: string;
  todo_snapshot: SignalReportTodo;
  checked_at: string;
}

/**
 * Synthesize a stable per-brief_date key for a TODO item. TODOs regenerate
 * daily into the brief with no backend-assigned ID; we key on the tuple of
 * (brief_date, artist_name, first 80 chars of text) which survives minor
 * AI wording changes while keeping distinct TODOs distinct.
 */
export function todoKey(todo: SignalReportTodo, briefDate: string): string {
  const textSlug = todo.text.slice(0, 80);
  return `${briefDate}:${todo.artist_name}:${textSlug}`;
}

export function useSignalReportTodos(briefDate: string) {
  const { labelId } = useUserProfile();
  const queryClient = useQueryClient();
  const queryKey = ["signal-report-todos", labelId, briefDate];

  const { data: rows = [] } = useQuery<SignalReportTodoStateRow[]>({
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
        .from("signal_report_todo_state" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("label_id", labelId)
        .eq("brief_date", briefDate);
      if (error) throw error;
      return (data ?? []) as unknown as SignalReportTodoStateRow[];
    },
  });

  const checkedKeys = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) s.add(r.todo_key);
    return s;
  }, [rows]);

  const check = useMutation({
    mutationFn: async (todo: SignalReportTodo) => {
      if (!labelId) throw new Error("No active label");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const key = todoKey(todo, briefDate);

      const { error } = await supabase
        .from("signal_report_todo_state" as any)
        .upsert(
          {
            user_id: user.id,
            label_id: labelId,
            brief_date: briefDate,
            todo_key: key,
            todo_snapshot: todo,
          },
          {
            onConflict: "user_id,label_id,brief_date,todo_key",
            ignoreDuplicates: false,
          },
        );
      if (error) throw error;
      return key;
    },
    onMutate: async (todo) => {
      await queryClient.cancelQueries({ queryKey });
      const prev =
        queryClient.getQueryData<SignalReportTodoStateRow[]>(queryKey);
      const key = todoKey(todo, briefDate);
      queryClient.setQueryData<SignalReportTodoStateRow[]>(queryKey, (old) => {
        const base = old ?? [];
        if (base.some((r) => r.todo_key === key)) return base;
        return [
          ...base,
          {
            id: `optimistic-${key}`,
            user_id: "",
            label_id: labelId ?? "",
            brief_date: briefDate,
            todo_key: key,
            todo_snapshot: todo,
            checked_at: new Date().toISOString(),
          },
        ];
      });
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
      toast.error(`Couldn't save: ${(err as Error).message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const uncheck = useMutation({
    mutationFn: async (todo: SignalReportTodo) => {
      if (!labelId) throw new Error("No active label");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const key = todoKey(todo, briefDate);

      const { error } = await supabase
        .from("signal_report_todo_state" as any)
        .delete()
        .eq("user_id", user.id)
        .eq("label_id", labelId)
        .eq("brief_date", briefDate)
        .eq("todo_key", key);
      if (error) throw error;
      return key;
    },
    onMutate: async (todo) => {
      await queryClient.cancelQueries({ queryKey });
      const prev =
        queryClient.getQueryData<SignalReportTodoStateRow[]>(queryKey);
      const key = todoKey(todo, briefDate);
      queryClient.setQueryData<SignalReportTodoStateRow[]>(queryKey, (old) =>
        (old ?? []).filter((r) => r.todo_key !== key),
      );
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
      toast.error(`Couldn't save: ${(err as Error).message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggle = (todo: SignalReportTodo) => {
    const key = todoKey(todo, briefDate);
    if (checkedKeys.has(key)) {
      uncheck.mutate(todo);
    } else {
      check.mutate(todo);
    }
  };

  return { checkedKeys, toggle };
}
