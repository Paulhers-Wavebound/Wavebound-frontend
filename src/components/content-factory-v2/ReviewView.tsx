import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  FileText,
  Film,
  Inbox,
  LinkIcon,
  Settings2,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import type {
  QueueItem,
  KillReason,
  OutputType,
  QueueSource,
  QueueStatus,
  RiskLevel,
} from "./types";
import {
  MOCK_ARTISTS,
  OUTPUT_TYPE_LABEL,
  QUEUE_SOURCE_LABEL,
  RISK_COLOR,
  artistById,
} from "./mockData";
import KillFeedbackModal from "./KillFeedbackModal";

interface ReviewViewProps {
  queue: QueueItem[];
  onApproveSchedule: (itemId: string) => void;
  onSendToTune: (itemId: string) => void;
  onKillWithFeedback: (
    itemId: string,
    reason: KillReason,
    note: string,
  ) => void;
}

const ALL_OUTPUT_TYPES: OutputType[] = [
  "short_form",
  "mini_doc",
  "sensational",
  "self_help",
  "tour_recap",
  "fan_brief",
  "link_video",
];

const ALL_SOURCES: QueueSource[] = ["autopilot", "human", "fan_brief"];
const ALL_RISKS: RiskLevel[] = ["low", "medium", "flagged"];

export default function ReviewView({
  queue,
  onApproveSchedule,
  onSendToTune,
  onKillWithFeedback,
}: ReviewViewProps) {
  const [reviewTab, setReviewTab] = useState<QueueStatus>("pending");
  const [artistFilter, setArtistFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<QueueSource | "all">("all");
  const [outputFilter, setOutputFilter] = useState<OutputType | "all">("all");
  const [killTarget, setKillTarget] = useState<QueueItem | null>(null);

  // Items in the currently-viewed sub-tab (pending | scheduled). All sidebar
  // counts and filters operate within this set so the numbers stay honest when
  // the user switches sub-tabs.
  const tabItems = useMemo(
    () => queue.filter((q) => q.status === reviewTab),
    [queue, reviewTab],
  );

  const filtered = useMemo(() => {
    return tabItems.filter((q) => {
      if (artistFilter !== "all" && q.artistId !== artistFilter) return false;
      if (riskFilter !== "all" && q.risk !== riskFilter) return false;
      if (sourceFilter !== "all" && q.source !== sourceFilter) return false;
      if (outputFilter !== "all" && q.outputType !== outputFilter) return false;
      return true;
    });
  }, [tabItems, artistFilter, riskFilter, sourceFilter, outputFilter]);

  const pendingTotal = useMemo(
    () => queue.filter((q) => q.status === "pending").length,
    [queue],
  );
  const scheduledTotal = useMemo(
    () => queue.filter((q) => q.status === "scheduled").length,
    [queue],
  );

  const counts = useMemo(() => {
    return {
      all: tabItems.length,
      byRisk: {
        low: tabItems.filter((q) => q.risk === "low").length,
        medium: tabItems.filter((q) => q.risk === "medium").length,
        flagged: tabItems.filter((q) => q.risk === "flagged").length,
      },
      bySource: {
        autopilot: tabItems.filter((q) => q.source === "autopilot").length,
        human: tabItems.filter((q) => q.source === "human").length,
        fan_brief: tabItems.filter((q) => q.source === "fan_brief").length,
      },
    };
  }, [tabItems]);

  return (
    <div
      className="font-['DM_Sans',sans-serif] grid gap-6"
      style={{
        gridTemplateColumns: "240px minmax(0,1fr)",
        color: "var(--ink)",
      }}
    >
      {/* Left filters */}
      <aside
        className="rounded-2xl p-5 flex flex-col gap-5 h-fit"
        style={{
          background: "var(--surface)",
          borderTop: "0.5px solid var(--card-edge)",
          position: "sticky",
          top: 20,
        }}
      >
        <FilterGroup title={`Queue · ${counts.all}`}>
          <FilterRow
            active={
              artistFilter === "all" &&
              riskFilter === "all" &&
              sourceFilter === "all" &&
              outputFilter === "all"
            }
            onClick={() => {
              setArtistFilter("all");
              setRiskFilter("all");
              setSourceFilter("all");
              setOutputFilter("all");
            }}
          >
            Clear all filters
          </FilterRow>
        </FilterGroup>

        <FilterGroup title="Artist">
          <FilterRow
            active={artistFilter === "all"}
            onClick={() => setArtistFilter("all")}
          >
            All artists
          </FilterRow>
          {MOCK_ARTISTS.map((a) => {
            const count = tabItems.filter((q) => q.artistId === a.id).length;
            if (count === 0) return null;
            return (
              <FilterRow
                key={a.id}
                active={artistFilter === a.id}
                onClick={() => setArtistFilter(a.id)}
                count={count}
              >
                {a.name}
              </FilterRow>
            );
          })}
        </FilterGroup>

        <FilterGroup title="Risk">
          <FilterRow
            active={riskFilter === "all"}
            onClick={() => setRiskFilter("all")}
          >
            Any risk
          </FilterRow>
          {ALL_RISKS.map((r) => (
            <FilterRow
              key={r}
              active={riskFilter === r}
              onClick={() => setRiskFilter(r)}
              count={counts.byRisk[r]}
              dot={RISK_COLOR[r].dot}
            >
              {RISK_COLOR[r].label.toLowerCase()}
            </FilterRow>
          ))}
        </FilterGroup>

        <FilterGroup title="Source">
          <FilterRow
            active={sourceFilter === "all"}
            onClick={() => setSourceFilter("all")}
          >
            Any source
          </FilterRow>
          {ALL_SOURCES.map((s) => (
            <FilterRow
              key={s}
              active={sourceFilter === s}
              onClick={() => setSourceFilter(s)}
              count={counts.bySource[s]}
            >
              {QUEUE_SOURCE_LABEL[s]}
            </FilterRow>
          ))}
        </FilterGroup>

        <FilterGroup title="Output type">
          <FilterRow
            active={outputFilter === "all"}
            onClick={() => setOutputFilter("all")}
          >
            Any type
          </FilterRow>
          {ALL_OUTPUT_TYPES.map((o) => {
            const c = tabItems.filter((q) => q.outputType === o).length;
            if (c === 0) return null;
            return (
              <FilterRow
                key={o}
                active={outputFilter === o}
                onClick={() => setOutputFilter(o)}
                count={c}
              >
                {OUTPUT_TYPE_LABEL[o]}
              </FilterRow>
            );
          })}
        </FilterGroup>
      </aside>

      {/* Queue list */}
      <div className="flex flex-col gap-3 min-w-0">
        {/* Pending / Scheduled sub-tabs */}
        <div
          className="flex items-center gap-1 p-1 rounded-[12px] self-start"
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border)",
          }}
        >
          <SubTab
            active={reviewTab === "pending"}
            onClick={() => setReviewTab("pending")}
            icon={<Inbox size={13} />}
            label="Pending"
            count={pendingTotal}
          />
          <SubTab
            active={reviewTab === "scheduled"}
            onClick={() => setReviewTab("scheduled")}
            icon={<CalendarClock size={13} />}
            label="Scheduled"
            count={scheduledTotal}
          />
        </div>

        <div
          className="flex items-baseline justify-between"
          style={{ color: "var(--ink-secondary)" }}
        >
          <div
            className="text-[13px]"
            style={{ color: "var(--ink-secondary)" }}
          >
            {filtered.length} of {tabItems.length} {reviewTab}
          </div>
          <div
            className="text-[11px] font-['JetBrains_Mono',monospace]"
            style={{ color: "var(--ink-tertiary)" }}
          >
            {reviewTab === "pending"
              ? "sorted: newest first"
              : "sorted: next drop first"}
          </div>
        </div>

        {filtered.length === 0 && (
          <div
            className="rounded-2xl px-5 py-10 text-center text-[14px]"
            style={{
              background: "var(--surface)",
              borderTop: "0.5px solid var(--card-edge)",
              color: "var(--ink-tertiary)",
            }}
          >
            {reviewTab === "pending"
              ? "Queue is clear for these filters. Relax a filter or check back later."
              : "Nothing scheduled yet for these filters. Approve a pending item to see it land here."}
          </div>
        )}

        {filtered.map((item) => (
          <QueueCard
            key={item.id}
            item={item}
            onApprove={() => onApproveSchedule(item.id)}
            onTune={() => onSendToTune(item.id)}
            onKill={() => setKillTarget(item)}
          />
        ))}
      </div>

      <KillFeedbackModal
        item={killTarget}
        open={killTarget !== null}
        onClose={() => setKillTarget(null)}
        onSubmit={(id, reason, note) => {
          onKillWithFeedback(id, reason, note);
          setKillTarget(null);
        }}
      />
    </div>
  );
}

function QueueCard({
  item,
  onApprove,
  onTune,
  onKill,
}: {
  item: QueueItem;
  onApprove: () => void;
  onTune: () => void;
  onKill: () => void;
}) {
  const artist = artistById(item.artistId);
  const risk = RISK_COLOR[item.risk];

  return (
    <div
      className="rounded-2xl p-5 flex gap-4"
      style={{
        background: "var(--surface)",
        borderTop: "0.5px solid var(--card-edge)",
        borderLeft:
          item.risk === "flagged"
            ? "2px solid rgba(220,38,38,0.6)"
            : item.risk === "medium"
              ? "2px solid rgba(217,164,74,0.5)"
              : "none",
        paddingLeft: item.risk === "low" ? 20 : 18,
      }}
    >
      {/* Thumb */}
      <div
        className="w-24 h-24 rounded-[10px] flex items-center justify-center shrink-0"
        style={{
          background: "var(--bg-subtle)",
          border: "1px solid var(--border)",
        }}
      >
        {item.thumbKind === "video" && (
          <Film size={24} color="var(--ink-tertiary)" />
        )}
        {item.thumbKind === "brief" && (
          <FileText size={24} color="var(--ink-tertiary)" />
        )}
        {item.thumbKind === "link" && (
          <LinkIcon size={24} color="var(--ink-tertiary)" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5"
            style={{ background: risk.bg, color: risk.fg }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: risk.dot }}
            />
            {risk.label}
          </span>
          <span
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--ink-tertiary)" }}
          >
            {OUTPUT_TYPE_LABEL[item.outputType]}
          </span>
          <span
            className="text-[11px] font-['JetBrains_Mono',monospace]"
            style={{ color: "var(--ink-tertiary)" }}
          >
            · {QUEUE_SOURCE_LABEL[item.source]}
          </span>
          {item.status === "scheduled" && item.scheduledFor ? (
            <span
              className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{
                background: "var(--accent-light)",
                color: "var(--accent)",
                border: "1px solid var(--accent)",
              }}
            >
              <CalendarClock size={11} />
              {item.scheduledFor}
            </span>
          ) : (
            <span
              className="text-[11px] font-['JetBrains_Mono',monospace] ml-auto"
              style={{ color: "var(--ink-tertiary)" }}
            >
              {item.createdAt}
            </span>
          )}
        </div>

        <div
          className="text-[15px] font-semibold leading-snug"
          style={{ color: "var(--ink)" }}
        >
          {item.title}
        </div>
        <div className="text-[12px]" style={{ color: "var(--ink-tertiary)" }}>
          {artist?.name} · {artist?.handle}
        </div>

        {item.riskNotes.length > 0 && (
          <ul className="flex flex-col gap-1 mt-1">
            {item.riskNotes.map((note, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-[12px]"
                style={{ color: risk.fg }}
              >
                <TriangleAlert
                  size={12}
                  style={{ marginTop: 3, flexShrink: 0 }}
                />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2">
          {item.status === "pending" && (
            <ActionButton onClick={onApprove} variant="primary">
              <CheckCircle2 size={14} />
              Approve & schedule
            </ActionButton>
          )}
          <ActionButton onClick={onTune}>
            <Settings2 size={14} />
            Send to Tune
          </ActionButton>
          <ActionButton onClick={onKill} variant="danger">
            <Trash2 size={14} />
            Kill + feedback
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--ink-secondary)" }}
      >
        {title}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function FilterRow({
  active,
  onClick,
  children,
  count,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1.5 rounded-[8px] text-left text-[12px] transition-colors"
      style={{
        background: active ? "var(--accent-light)" : "transparent",
        color: active ? "var(--accent)" : "var(--ink-secondary)",
        fontWeight: active ? 600 : 500,
      }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: dot }}
        />
      )}
      <span className="truncate flex-1">{children}</span>
      {count != null && (
        <span
          className="text-[10px] font-['JetBrains_Mono',monospace] tabular-nums"
          style={{ color: active ? "var(--accent)" : "var(--ink-tertiary)" }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function SubTab({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 px-3 rounded-[9px] flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
      style={{
        background: active ? "var(--surface)" : "transparent",
        color: active ? "var(--ink)" : "var(--ink-secondary)",
        border: active ? "1px solid var(--border)" : "1px solid transparent",
      }}
    >
      <span style={{ color: active ? "var(--accent)" : "var(--ink-tertiary)" }}>
        {icon}
      </span>
      <span>{label}</span>
      <span
        className="px-1.5 py-0.5 rounded-full text-[10px] font-['JetBrains_Mono',monospace] tabular-nums"
        style={{
          background: active ? "var(--accent-light)" : "var(--surface)",
          color: active ? "var(--accent)" : "var(--ink-secondary)",
          border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
        }}
      >
        {count}
      </span>
    </button>
  );
}

function ActionButton({
  onClick,
  children,
  variant,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "danger";
}) {
  const styles =
    variant === "primary"
      ? {
          background: "var(--accent)",
          color: "#fff",
          border: "none",
        }
      : variant === "danger"
        ? {
            background: "transparent",
            color: "#dc2626",
            border: "1px solid rgba(220,38,38,0.35)",
          }
        : {
            background: "transparent",
            color: "var(--ink)",
            border: "1px solid var(--border)",
          };
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 px-3 rounded-[10px] text-[12px] font-semibold flex items-center gap-1.5"
      style={styles}
    >
      {children}
    </button>
  );
}
