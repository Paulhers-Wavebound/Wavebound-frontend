import { useState, useEffect, useCallback } from "react";
import LabelLayout from "@/pages/label/LabelLayout";
import BriefCard from "@/components/fan-briefs/BriefCard";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import type { FanBrief } from "@/types/fanBriefs";

type Tab = "content" | "clips";

export default function LabelFanBriefs() {
  const { labelId } = useUserProfile();
  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [contentBriefs, setContentBriefs] = useState<FanBrief[]>([]);
  const [clipsBriefs, setClipsBriefs] = useState<FanBrief[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBriefs = useCallback(async () => {
    if (!labelId) return;
    try {
      // Content: pending briefs without a render
      const contentQuery = supabase.from("fan_briefs")
        .select("*")
        .eq("label_id", labelId)
        .eq("status", "pending")
        .is("rendered_clip_url", null)
        .order("confidence_score", { ascending: false })
        .limit(50);

      // Clips: approved briefs (rendered or rendering)
      const clipsQuery = supabase.from("fan_briefs")
        .select("*")
        .eq("label_id", labelId)
        .eq("status", "approved")
        .order("approved_at", { ascending: false })
        .limit(50);

      const [contentRes, clipsRes] = await Promise.all([
        contentQuery,
        clipsQuery,
      ]);

      setContentBriefs(contentRes.data ?? []);
      setClipsBriefs(clipsRes.data ?? []);
    } catch {
      // Error handled by empty state UI
    } finally {
      setIsLoading(false);
    }
  }, [labelId]);

  useEffect(() => {
    if (!labelId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetchBriefs();
  }, [labelId, fetchBriefs]);

  const handleApprove = async (briefId: string) => {
    const { error } = await supabase.from("fan_briefs")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
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
      const approved = {
        ...brief,
        status: "approved" as const,
        approved_at: new Date().toISOString(),
      };
      setContentBriefs((prev) => prev.filter((b) => b.id !== briefId));
      setClipsBriefs((prev) => [approved, ...prev]);
    }
    toast({ title: "Brief approved — rendering..." });
  };

  const handleSkip = async (briefId: string) => {
    const { error } = await supabase.from("fan_briefs")
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
    setContentBriefs((prev) => prev.filter((b) => b.id !== briefId));
  };

  const handleModifyHook = async (briefId: string, newHook: string) => {
    // Save modified hook but keep status as pending
    const { error } = await supabase.from("fan_briefs")
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
    setContentBriefs((prev) =>
      prev.map((b) =>
        b.id === briefId ? { ...b, modified_hook: newHook } : b,
      ),
    );
    toast({ title: "Hook saved" });
  };

  const activeBriefs = activeTab === "content" ? contentBriefs : clipsBriefs;

  return (
    <LabelLayout>
      <div
        style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px" }}
      >
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <Sparkles
              size={24}
              color="var(--accent)"
              style={{ flexShrink: 0 }}
            />
            <h1
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 28,
                fontWeight: 700,
                color: "var(--ink)",
              }}
            >
              Fan Briefs
            </h1>
          </div>
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 15,
              color: "var(--ink-tertiary)",
              lineHeight: 1.5,
            }}
          >
            Review content ideas, edit hooks, approve to render.
          </p>
        </div>

        {/* Content / Clips tabs */}
        <div
          style={{
            display: "flex",
            gap: 0,
            marginBottom: 28,
            borderBottom: "1px solid var(--border)",
          }}
        >
          {(["content", "clips"] as const).map((tab) => {
            const active = activeTab === tab;
            const count =
              tab === "content" ? contentBriefs.length : clipsBriefs.length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "12px 24px",
                  border: "none",
                  borderBottom: active
                    ? "2px solid var(--accent)"
                    : "2px solid transparent",
                  background: "none",
                  color: active ? "var(--ink)" : "var(--ink-tertiary)",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 15,
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 150ms",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {tab === "content" ? "Content" : "Clips"}
                {!isLoading && count > 0 && (
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 20,
                      background:
                        tab === "content"
                          ? "rgba(255,159,10,0.12)"
                          : "rgba(48,209,88,0.12)",
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      fontWeight: 600,
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
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Loader2
              size={32}
              color="var(--ink-tertiary)"
              style={{ animation: "spin 1s linear infinite" }}
            />
          </div>
        )}

        {!isLoading && activeBriefs.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Sparkles
              size={48}
              color="var(--ink-faint)"
              style={{ marginBottom: 16 }}
            />
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 16,
                color: "var(--ink-secondary)",
                maxWidth: 400,
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              {activeTab === "content"
                ? "No content to review. New briefs will appear here when the pipeline runs."
                : "No clips yet. Approve content to start rendering."}
            </div>
          </div>
        )}

        {!isLoading && activeBriefs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {activeBriefs.map((brief) => (
              <BriefCard
                key={brief.id}
                brief={brief}
                mode={activeTab}
                onApprove={handleApprove}
                onSkip={handleSkip}
                onModifyHook={handleModifyHook}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </LabelLayout>
  );
}
