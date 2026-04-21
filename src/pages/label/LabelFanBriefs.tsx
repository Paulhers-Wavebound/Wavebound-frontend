import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import BriefCard from "@/components/fan-briefs/BriefCard";
import BriefDetail from "@/components/fan-briefs/BriefDetail";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import type { FanBrief } from "@/types/fanBriefs";

type Tab = "content" | "clips";

const FAN_BRIEFS_BUCKET = "fan-brief-clips";

function getStoragePath(renderedUrl: string): string | null {
  const match = renderedUrl.match(new RegExp(`/${FAN_BRIEFS_BUCKET}/([^?]+)`));
  return match ? match[1] : null;
}

const contentQueryKey = (labelId: string | null) => [
  "fan-briefs",
  labelId,
  "content",
];
const clipsQueryKey = (labelId: string | null) => [
  "fan-briefs",
  labelId,
  "clips",
];

export default function LabelFanBriefs() {
  const { labelId } = useUserProfile();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Clear selection when leaving the Content tab or when labelId changes
  useEffect(() => {
    if (activeTab !== "content") setSelectedIds(new Set());
  }, [activeTab]);
  useEffect(() => {
    setSelectedIds(new Set());
  }, [labelId]);

  const contentQuery = useQuery({
    queryKey: contentQueryKey(labelId),
    enabled: !!labelId,
    refetchInterval: 30_000,
    staleTime: 15_000,
    queryFn: async (): Promise<FanBrief[]> => {
      const { data, error } = await supabase
        .from("fan_briefs")
        .select("*")
        .eq("label_id", labelId!)
        .eq("status", "pending")
        .is("rendered_clip_url", null)
        .order("confidence_score", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as FanBrief[];
    },
  });

  const clipsQuery = useQuery({
    queryKey: clipsQueryKey(labelId),
    enabled: !!labelId,
    refetchInterval: 30_000,
    staleTime: 15_000,
    queryFn: async (): Promise<FanBrief[]> => {
      const { data, error } = await supabase
        .from("fan_briefs")
        .select("*")
        .eq("label_id", labelId!)
        .eq("status", "approved")
        .order("approved_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as FanBrief[];
    },
  });

  const contentBriefs = contentQuery.data ?? [];
  const clipsBriefs = clipsQuery.data ?? [];
  const isLoading = !labelId || contentQuery.isLoading || clipsQuery.isLoading;

  const handleApprove = async (briefId: string) => {
    const approvedAt = new Date().toISOString();
    const { error } = await supabase
      .from("fan_briefs")
      .update({ status: "approved", approved_at: approvedAt })
      .eq("id", briefId);

    if (error) {
      toast({
        title: "Failed to approve",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Optimistic: move from content → clips
    const brief = contentBriefs.find((b) => b.id === briefId);
    if (brief) {
      const approved: FanBrief = {
        ...brief,
        status: "approved",
        approved_at: approvedAt,
      };
      queryClient.setQueryData<FanBrief[]>(contentQueryKey(labelId), (prev) =>
        (prev ?? []).filter((b) => b.id !== briefId),
      );
      queryClient.setQueryData<FanBrief[]>(clipsQueryKey(labelId), (prev) => [
        approved,
        ...(prev ?? []),
      ]);
    }
    toast({ title: "Brief approved — rendering..." });
  };

  const handleSkip = async (briefId: string) => {
    const { error } = await supabase
      .from("fan_briefs")
      .update({ status: "skipped" })
      .eq("id", briefId);

    if (error) {
      toast({
        title: "Failed to skip",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    queryClient.setQueryData<FanBrief[]>(contentQueryKey(labelId), (prev) =>
      (prev ?? []).filter((b) => b.id !== briefId),
    );
  };

  const handleModifyHook = async (briefId: string, newHook: string) => {
    const { error } = await supabase
      .from("fan_briefs")
      .update({ modified_hook: newHook })
      .eq("id", briefId);

    if (error) {
      toast({
        title: "Failed to save hook",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    queryClient.setQueryData<FanBrief[]>(contentQueryKey(labelId), (prev) =>
      (prev ?? []).map((b) =>
        b.id === briefId ? { ...b, modified_hook: newHook } : b,
      ),
    );
    toast({ title: "Hook saved" });
  };

  const handleDelete = async (briefId: string) => {
    const brief = clipsBriefs.find((b) => b.id === briefId);

    const { error } = await supabase
      .from("fan_briefs")
      .update({ status: "archived" })
      .eq("id", briefId);

    if (error) {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Delete rendered clip from storage — derive path from the URL itself
    if (brief?.rendered_clip_url) {
      const storagePath = getStoragePath(brief.rendered_clip_url);
      if (storagePath) {
        const { error: storageErr } = await supabase.storage
          .from(FAN_BRIEFS_BUCKET)
          .remove([storagePath]);
        if (storageErr) {
          console.warn("Storage cleanup failed:", storageErr.message);
        }
      } else {
        console.warn(
          "Could not parse storage path from rendered_clip_url:",
          brief.rendered_clip_url,
        );
      }
    }

    queryClient.setQueryData<FanBrief[]>(clipsQueryKey(labelId), (prev) =>
      (prev ?? []).filter((b) => b.id !== briefId),
    );
    toast({ title: "Clip removed" });
  };

  const toggleSelect = (briefId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(briefId)) next.delete(briefId);
      else next.add(briefId);
      return next;
    });
  };

  const handleBatchApprove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const approvedAt = new Date().toISOString();

    const { error } = await supabase
      .from("fan_briefs")
      .update({ status: "approved", approved_at: approvedAt })
      .in("id", ids);

    if (error) {
      toast({
        title: "Failed to approve",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const approvedBriefs: FanBrief[] = contentBriefs
      .filter((b) => selectedIds.has(b.id))
      .map((b) => ({
        ...b,
        status: "approved" as const,
        approved_at: approvedAt,
      }));

    queryClient.setQueryData<FanBrief[]>(contentQueryKey(labelId), (prev) =>
      (prev ?? []).filter((b) => !selectedIds.has(b.id)),
    );
    queryClient.setQueryData<FanBrief[]>(clipsQueryKey(labelId), (prev) => [
      ...approvedBriefs,
      ...(prev ?? []),
    ]);

    setSelectedIds(new Set());
    toast({
      title: `${ids.length} brief${ids.length === 1 ? "" : "s"} approved — rendering...`,
    });
  };

  const handleBatchSkip = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const { error } = await supabase
      .from("fan_briefs")
      .update({ status: "skipped" })
      .in("id", ids);

    if (error) {
      toast({
        title: "Failed to skip",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    queryClient.setQueryData<FanBrief[]>(contentQueryKey(labelId), (prev) =>
      (prev ?? []).filter((b) => !selectedIds.has(b.id)),
    );

    setSelectedIds(new Set());
    toast({
      title: `${ids.length} brief${ids.length === 1 ? "" : "s"} skipped`,
    });
  };

  const activeBriefs = activeTab === "content" ? contentBriefs : clipsBriefs;
  const selectionCount = selectedIds.size;

  return (
    <div className="mx-auto px-6 pt-8 pb-20" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <Sparkles size={24} color="var(--accent)" className="shrink-0" />
          <h1
            className="text-[28px] font-bold font-['DM_Sans',sans-serif]"
            style={{ color: "var(--ink)" }}
          >
            Fan Briefs
          </h1>
        </div>
        <p
          className="text-[15px] leading-snug font-['DM_Sans',sans-serif]"
          style={{ color: "var(--ink-tertiary)" }}
        >
          Review content ideas, edit hooks, approve to render.
        </p>
      </div>

      {/* Content / Clips tabs */}
      <div
        className="flex mb-7"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {(["content", "clips"] as const).map((tab) => {
          const active = activeTab === tab;
          const count =
            tab === "content" ? contentBriefs.length : clipsBriefs.length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 bg-transparent cursor-pointer transition-all flex items-center gap-2 text-[15px] font-['DM_Sans',sans-serif] ${
                active ? "font-semibold" : "font-medium"
              }`}
              style={{
                border: "none",
                borderBottom: active
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
                color: active ? "var(--ink)" : "var(--ink-tertiary)",
              }}
            >
              {tab === "content" ? "Content" : "Clips"}
              {!isLoading && count > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-semibold font-['JetBrains_Mono',monospace]"
                  style={{
                    background:
                      tab === "content"
                        ? "rgba(255,159,10,0.12)"
                        : "rgba(48,209,88,0.12)",
                    color: tab === "content" ? "#FF9F0A" : "#30D158",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {isLoading && (
        <div className="text-center py-20">
          <Loader2
            size={32}
            color="var(--ink-tertiary)"
            className="animate-spin inline-block"
          />
        </div>
      )}

      {!isLoading && activeBriefs.length === 0 && (
        <div className="text-center py-20">
          <Sparkles
            size={48}
            color="var(--ink-faint)"
            className="mb-4 inline-block"
          />
          <div
            className="text-base mx-auto leading-relaxed font-['DM_Sans',sans-serif]"
            style={{ color: "var(--ink-secondary)", maxWidth: 400 }}
          >
            {activeTab === "content"
              ? "No content to review. New briefs will appear here when the pipeline runs."
              : "No clips yet. Approve content to start rendering."}
          </div>
        </div>
      )}

      {!isLoading && activeBriefs.length > 0 && (
        <div
          className="flex flex-col gap-5"
          style={{ paddingBottom: selectionCount > 0 ? 80 : 0 }}
        >
          {activeBriefs.map((brief) => (
            <BriefCard
              key={brief.id}
              brief={brief}
              mode={activeTab}
              onApprove={handleApprove}
              onSkip={handleSkip}
              onModifyHook={handleModifyHook}
              onDelete={activeTab === "clips" ? handleDelete : undefined}
              selected={selectedIds.has(brief.id)}
              onToggleSelect={
                activeTab === "content" ? toggleSelect : undefined
              }
              onExpand={setExpandedId}
            />
          ))}
        </div>
      )}

      {/* Batch action bar — appears when at least one brief is selected */}
      {activeTab === "content" && selectionCount > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-3 rounded-2xl font-['DM_Sans',sans-serif]"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <span
            className="text-[13px] font-medium tabular-nums"
            style={{ color: "var(--ink-secondary)" }}
          >
            {selectionCount} selected
          </span>
          <div className="h-5 w-px" style={{ background: "var(--border)" }} />
          <button
            onClick={handleBatchApprove}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold text-white border-0 cursor-pointer"
            style={{ background: "#30D158" }}
          >
            <Check size={14} />
            Approve {selectionCount}
          </button>
          <button
            onClick={handleBatchSkip}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-medium cursor-pointer bg-transparent"
            style={{
              border: "1px solid var(--border)",
              color: "var(--ink-secondary)",
            }}
          >
            <X size={14} />
            Skip {selectionCount}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-[13px] font-medium cursor-pointer bg-transparent border-0 px-2"
            style={{ color: "var(--ink-tertiary)" }}
          >
            Clear
          </button>
        </div>
      )}

      <BriefDetail
        brief={
          expandedId
            ? (contentBriefs.find((b) => b.id === expandedId) ??
              clipsBriefs.find((b) => b.id === expandedId) ??
              null)
            : null
        }
        open={!!expandedId}
        onOpenChange={(o) => {
          if (!o) setExpandedId(null);
        }}
        onApprove={handleApprove}
        onSkip={handleSkip}
        onModifyHook={handleModifyHook}
      />
    </div>
  );
}
