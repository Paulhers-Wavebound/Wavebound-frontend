import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Compass, Factory, Inbox } from "lucide-react";
import AnglesView from "@/components/content-factory-v2/AnglesView";
import CreateView from "@/components/content-factory-v2/CreateView";
import ReviewView from "@/components/content-factory-v2/ReviewView";
import {
  INITIAL_QUEUE,
  MOCK_ANGLES,
} from "@/components/content-factory-v2/mockData";
import type {
  Angle,
  KillReason,
  OutputType,
  QueueItem,
} from "@/components/content-factory-v2/types";
import { toast } from "@/hooks/use-toast";

type TabKey = "angles" | "create" | "review";

const TABS: {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}[] = [
  { key: "angles", label: "Angles", icon: Compass },
  { key: "create", label: "Create", icon: Factory },
  { key: "review", label: "Review", icon: Inbox },
];

function isTabKey(v: string | null): v is TabKey {
  return v === "angles" || v === "create" || v === "review";
}

// Map an angle family to the most natural Create preset so "Send to Create"
// pre-picks a sensible starting point. Editable in Create.
const FAMILY_TO_PRESET: Record<Angle["family"], OutputType> = {
  sensational: "sensational",
  self_help: "self_help",
  tour_recap: "tour_recap",
  bts: "short_form",
  mini_doc: "mini_doc",
};

export default function ContentFactoryV2() {
  const [params, setParams] = useSearchParams();
  const tabFromUrl = params.get("tab");
  const activeTab: TabKey = isTabKey(tabFromUrl) ? tabFromUrl : "review";

  const setActiveTab = useCallback(
    (tab: TabKey) => {
      const next = new URLSearchParams(params);
      next.set("tab", tab);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const [angles, setAngles] = useState<Angle[]>(MOCK_ANGLES);
  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE);

  // Handoff state — when user hits "Send to Create" in Angles, we switch to
  // the Create tab and pre-fill the preset + angle. Cleared after consume.
  const [draftAngleId, setDraftAngleId] = useState<string | null>(null);
  const [draftPreset, setDraftPreset] = useState<OutputType | null>(null);

  const pendingCount = queue.filter((q) => q.status === "pending").length;

  // Angles handlers
  const handleToggleFavorite = useCallback((angleId: string) => {
    setAngles((prev) =>
      prev.map((a) =>
        a.id === angleId ? { ...a, favorited: !a.favorited } : a,
      ),
    );
  }, []);

  const handleKillAngle = useCallback((angleId: string) => {
    setAngles((prev) =>
      prev.map((a) => (a.id === angleId ? { ...a, killed: true } : a)),
    );
    toast({
      title: "Angle killed",
      description: "Won't appear in this roster.",
    });
  }, []);

  const handleSendToCreate = useCallback(
    (angleId: string) => {
      const angle = angles.find((a) => a.id === angleId);
      if (!angle) return;
      setDraftAngleId(angleId);
      setDraftPreset(FAMILY_TO_PRESET[angle.family]);
      setActiveTab("create");
      toast({
        title: "Sent to Create",
        description: `Pre-filled with "${angle.title.slice(0, 48)}${angle.title.length > 48 ? "…" : ""}"`,
      });
    },
    [angles, setActiveTab],
  );

  const handleDraftConsumed = useCallback(() => {
    setDraftAngleId(null);
    setDraftPreset(null);
  }, []);

  // Create handler
  const handleGenerate = useCallback((item: QueueItem) => {
    setQueue((prev) => [item, ...prev]);
    toast({
      title: "Added to Review",
      description: item.title.slice(0, 72),
    });
  }, []);

  // Review handlers
  const handleApproveSchedule = useCallback((itemId: string) => {
    const when = mockScheduleSlot();
    setQueue((prev) =>
      prev.map((q) =>
        q.id === itemId ? { ...q, status: "scheduled", scheduledFor: when } : q,
      ),
    );
    toast({
      title: "Approved & scheduled",
      description: `Drops ${when} · find it under Scheduled.`,
    });
  }, []);

  const handleSendToTune = useCallback((_itemId: string) => {
    toast({
      title: "Send to Tune",
      description: "Would open Tune drawer in v1.",
    });
  }, []);

  const handleKillWithFeedback = useCallback(
    (itemId: string, reason: KillReason, note: string) => {
      // TODO: feeds back into artist's Autopilot priors
      setQueue((prev) => prev.filter((q) => q.id !== itemId));
      toast({
        title: "Killed with feedback",
        description: `Reason: ${reason.replace("_", " ")}${note ? ` · "${note.slice(0, 48)}"` : ""}`,
      });
    },
    [],
  );

  const tabTitle = useMemo(() => {
    switch (activeTab) {
      case "angles":
        return "Angles";
      case "create":
        return "Create";
      case "review":
        return "Review";
    }
  }, [activeTab]);

  return (
    <div
      className="min-h-[calc(100vh-64px)]"
      style={{ background: "var(--bg)" }}
    >
      <div className="mx-auto px-6 pt-6 pb-16" style={{ maxWidth: 1320 }}>
        {/* Page header */}
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div
              className="text-[11px] font-semibold uppercase tracking-wide mb-1 font-['DM_Sans',sans-serif]"
              style={{ color: "var(--ink-secondary)" }}
            >
              Content Factory v2 · prototype
            </div>
            <h1
              className="text-[28px] font-bold font-['DM_Sans',sans-serif]"
              style={{ color: "var(--ink)" }}
            >
              {tabTitle}
            </h1>
          </div>
          <div
            className="text-[12px] font-['JetBrains_Mono',monospace]"
            style={{ color: "var(--ink-tertiary)" }}
          >
            mock data · existing routes untouched
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex items-center gap-1 mb-6 p-1 rounded-[12px] font-['DM_Sans',sans-serif]"
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border)",
            width: "fit-content",
          }}
        >
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const badge = t.key === "review" ? pendingCount : null;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className="h-9 px-4 rounded-[9px] flex items-center gap-2 text-[13px] font-semibold transition-colors"
                style={{
                  background: active ? "var(--surface)" : "transparent",
                  color: active ? "var(--ink)" : "var(--ink-secondary)",
                  border: active
                    ? "1px solid var(--border)"
                    : "1px solid transparent",
                  boxShadow: active ? "0 1px 2px rgba(0,0,0,0.15)" : "none",
                }}
              >
                <t.icon
                  size={14}
                  color={active ? "var(--accent)" : "var(--ink-tertiary)"}
                />
                <span>{t.label}</span>
                {badge != null && badge > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-['JetBrains_Mono',monospace] tabular-nums"
                    style={{
                      background: active
                        ? "var(--accent-light)"
                        : "var(--surface)",
                      color: active ? "var(--accent)" : "var(--ink-secondary)",
                      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === "angles" && (
          <AnglesView
            angles={angles}
            queue={queue}
            onToggleFavorite={handleToggleFavorite}
            onKillAngle={handleKillAngle}
            onSendToCreate={handleSendToCreate}
          />
        )}

        {activeTab === "create" && (
          <CreateView
            angles={angles}
            draftAngleId={draftAngleId}
            draftPreset={draftPreset}
            onDraftConsumed={handleDraftConsumed}
            onGenerate={handleGenerate}
          />
        )}

        {activeTab === "review" && (
          <ReviewView
            queue={queue}
            onApproveSchedule={handleApproveSchedule}
            onSendToTune={handleSendToTune}
            onKillWithFeedback={handleKillWithFeedback}
          />
        )}
      </div>
    </div>
  );
}

// Mock scheduler — picks the next plausible slot (morning or evening) a day or
// two out. Real v1 wires this to whatever the label's release cadence is.
function mockScheduleSlot(): string {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const now = new Date();
  const offset = 1 + Math.floor(Math.random() * 3);
  const target = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
  const slots = ["9:00 am", "12:30 pm", "4:00 pm", "6:00 pm"];
  const slot = slots[Math.floor(Math.random() * slots.length)];
  return `${days[target.getDay()]} · ${slot}`;
}
