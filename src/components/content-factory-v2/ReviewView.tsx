import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Film,
  ImageIcon,
  Inbox,
  LinkIcon,
  Loader2,
  Mic2,
  Play,
  RefreshCw,
  Settings2,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import type {
  QueueItem,
  KillReason,
  OutputType,
  QueueSource,
  RiskLevel,
} from "./types";
import {
  MOCK_ARTISTS,
  OUTPUT_TYPE_LABEL,
  QUEUE_SOURCE_LABEL,
  RISK_COLOR,
  artistById,
} from "./mockData";
import { CARTOON_STAGE_ORDER, type CartoonStage } from "./cartoonReconciler";
import KillFeedbackModal from "./KillFeedbackModal";
import { toast } from "@/hooks/use-toast";

interface ReviewViewProps {
  queue: QueueItem[];
  onApproveSchedule: (itemId: string) => void;
  onSendToTune: (itemId: string) => void;
  onKillWithFeedback: (
    itemId: string,
    reason: KillReason,
    note: string,
  ) => void;
  onRetryRender: (itemId: string) => void;
}

const ALL_OUTPUT_TYPES: OutputType[] = [
  "short_form",
  "mini_doc",
  "sensational",
  "self_help",
  "tour_recap",
  "fan_brief",
  "cartoon",
  "link_video",
];

const CARTOON_STAGE_META: Record<
  CartoonStage,
  { label: string; Icon: typeof FileText }
> = {
  script: { label: "Script", Icon: FileText },
  vo: { label: "VO", Icon: Mic2 },
  images: { label: "Images", Icon: ImageIcon },
  video: { label: "Video", Icon: Film },
};

const ALL_SOURCES: QueueSource[] = ["autopilot", "human", "fan_brief"];
const ALL_RISKS: RiskLevel[] = ["low", "medium", "flagged"];

export default function ReviewView({
  queue,
  onApproveSchedule,
  onSendToTune,
  onKillWithFeedback,
  onRetryRender,
}: ReviewViewProps) {
  const [reviewTab, setReviewTab] = useState<"pending" | "scheduled">(
    "pending",
  );
  const [artistFilter, setArtistFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<QueueSource | "all">("all");
  const [outputFilter, setOutputFilter] = useState<OutputType | "all">("all");
  const [killTarget, setKillTarget] = useState<QueueItem | null>(null);
  const [viewTarget, setViewTarget] = useState<QueueItem | null>(null);

  // Items in the currently-viewed sub-tab. The Pending tab also surfaces
  // generating + failed items so users see the full lifecycle in one place
  // ("I hit Create, where are my briefs?").
  const tabItems = useMemo(() => {
    if (reviewTab === "pending") {
      return queue.filter(
        (q) =>
          q.status === "pending" ||
          q.status === "generating" ||
          q.status === "failed",
      );
    }
    return queue.filter((q) => q.status === "scheduled");
  }, [queue, reviewTab]);

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
    () =>
      queue.filter(
        (q) =>
          q.status === "pending" ||
          q.status === "generating" ||
          q.status === "failed",
      ).length,
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
          {ALL_RISKS.map((r) => {
            const c = counts.byRisk[r];
            if (c === 0) return null;
            return (
              <FilterRow
                key={r}
                active={riskFilter === r}
                onClick={() => setRiskFilter(r)}
                count={c}
                dot={RISK_COLOR[r].dot}
              >
                {RISK_COLOR[r].label.toLowerCase()}
              </FilterRow>
            );
          })}
        </FilterGroup>

        <FilterGroup title="Source">
          <FilterRow
            active={sourceFilter === "all"}
            onClick={() => setSourceFilter("all")}
          >
            Any source
          </FilterRow>
          {ALL_SOURCES.map((s) => {
            const c = counts.bySource[s];
            if (c === 0) return null;
            return (
              <FilterRow
                key={s}
                active={sourceFilter === s}
                onClick={() => setSourceFilter(s)}
                count={c}
              >
                {QUEUE_SOURCE_LABEL[s]}
              </FilterRow>
            );
          })}
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

        {/* Queue list — stagger reveal only on tab-mount. Once parent
            transitions through hidden → show the staggerChildren delay no
            longer applies, so new items pushed in by Realtime/polling get
            a quick standalone fade-in (no list-wide restage). Cap the
            visible-stagger to first 8 items so total ≈ 280ms. */}
        <motion.div
          className="flex flex-col gap-3"
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: 0.035, delayChildren: 0.04 },
            },
          }}
          initial="hidden"
          animate="show"
        >
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.32,
                    ease: [0.16, 1, 0.3, 1],
                    delay: i < 8 ? 0 : 0,
                  },
                },
              }}
            >
              <QueueCard
                item={item}
                onApprove={() => onApproveSchedule(item.id)}
                onTune={() => onSendToTune(item.id)}
                onKill={() => setKillTarget(item)}
                onView={() => setViewTarget(item)}
                onRetry={() => onRetryRender(item.id)}
              />
            </motion.div>
          ))}
        </motion.div>
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

      <AnimatePresence>
        {viewTarget && (
          <BriefViewerModal
            key="brief-viewer"
            item={viewTarget}
            onClose={() => setViewTarget(null)}
            onRetry={() => {
              onRetryRender(viewTarget.id);
              setViewTarget(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function QueueCard({
  item,
  onApprove,
  onTune,
  onKill,
  onView,
  onRetry,
}: {
  item: QueueItem;
  onApprove: () => void;
  onTune: () => void;
  onKill: () => void;
  onView: () => void;
  onRetry: () => void;
}) {
  const artist = artistById(item.artistId);
  const artistName = artist?.name ?? item.artistDisplayName ?? "Unknown artist";
  const artistHandle =
    artist?.handle ??
    (item.artistDisplayHandle ? `@${item.artistDisplayHandle}` : "");
  const risk = RISK_COLOR[item.risk];
  const isGenerating = item.status === "generating";
  const isFailed = item.status === "failed";
  // Render didn't deliver in the expected window — treat the card as a
  // soft failure: red accents + "didn't render" copy. Doesn't change the
  // brief's actual status (it's still pending/scheduled in DB), just the
  // UI signal so the user knows to act.
  const isStalled = !!item.renderStalled;

  return (
    <div
      className="group rounded-2xl p-5 flex gap-5 transition-[transform,border-color,box-shadow,opacity] duration-[var(--dur-state)] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.25)",
        opacity: isGenerating ? 0.92 : 1,
      }}
    >
      {/* Thumb — clickable when there's something to show. Opens the in-page
          viewer modal which plays the rendered MP4 if available, or falls
          back to a "rendering not ready, view source" state. The frame border
          encodes status (red=failed/stalled, accent=generating, risk-amber=
          flagged/medium) since we dropped the left-edge card strip. */}
      <ThumbFrame
        item={item}
        isGenerating={isGenerating}
        isFailed={isFailed}
        onClick={onView}
      />

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {isGenerating ? (
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5"
              style={{
                background: "var(--accent-light)",
                color: "var(--accent)",
              }}
            >
              <Loader2 size={11} className="animate-spin" />
              Generating
            </span>
          ) : isFailed ? (
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5"
              style={{
                background: "rgba(220,38,38,0.12)",
                color: "#dc2626",
              }}
            >
              <TriangleAlert size={11} />
              Failed
            </span>
          ) : isStalled ? (
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5"
              style={{
                background: "rgba(220,38,38,0.12)",
                color: "#dc2626",
              }}
            >
              <TriangleAlert size={11} />
              {renderErrorChipLabel(item.renderError)}
            </span>
          ) : (
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
          )}
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
          {artistName}
          {artistHandle && ` · ${artistHandle}`}
        </div>

        {isGenerating && item.jobStage && (
          <div
            className="text-[12px] flex items-center gap-1.5 mt-0.5"
            style={{ color: "var(--accent)" }}
          >
            <Loader2 size={11} className="animate-spin shrink-0" />
            <span>{item.jobStage}</span>
          </div>
        )}

        {isGenerating && item.outputType === "cartoon" && (
          <CartoonStageTimeline
            stage={item.cartoonStage ?? "script"}
            detail={item.cartoonStageDetail}
            className="mt-1"
          />
        )}

        {isFailed && item.jobError && (
          <div
            className="text-[12px] flex items-start gap-1.5 mt-0.5"
            style={{ color: "#dc2626" }}
          >
            <TriangleAlert size={11} style={{ marginTop: 3, flexShrink: 0 }} />
            <span>{item.jobError}</span>
          </div>
        )}

        {!isFailed && isStalled && (
          <div
            className="text-[12px] flex items-start gap-1.5 mt-0.5"
            style={{ color: "#dc2626" }}
          >
            <TriangleAlert size={11} style={{ marginTop: 3, flexShrink: 0 }} />
            <span>{renderErrorMessage(item.renderError)}</span>
          </div>
        )}

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
          {item.status === "pending" && !isStalled && (
            <ActionButton onClick={onApprove} variant="primary">
              <CheckCircle2 size={14} />
              Approve & schedule
            </ActionButton>
          )}
          {(isStalled || isFailed) && (
            <ActionButton onClick={onRetry} variant="primary">
              <RefreshCw size={14} />
              Retry
            </ActionButton>
          )}
          {isStalled && item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="h-9 px-3 rounded-[10px] text-[13px] font-semibold flex items-center gap-1.5 transition-colors"
              style={{
                background: "transparent",
                color: "var(--ink)",
                border: "1px solid var(--border)",
              }}
            >
              <Play size={13} />
              Open on YouTube
            </a>
          )}
          {!isGenerating && !isStalled && (
            <ActionButton onClick={onTune}>
              <Settings2 size={14} />
              Send to Tune
            </ActionButton>
          )}
          {item.cartoonFinalUrl && (
            <CopyLinkButton url={item.cartoonFinalUrl} />
          )}
          <ActionButton onClick={onKill} variant="danger">
            <Trash2 size={14} />
            {isFailed ? "Dismiss" : isGenerating ? "Cancel" : "Kill + feedback"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function ThumbFrame({
  item,
  isGenerating,
  isFailed,
  onClick,
}: {
  item: QueueItem;
  isGenerating: boolean;
  isFailed: boolean;
  onClick: () => void;
}) {
  // Status-tinted border replaces the dropped left-edge card strip. Failed /
  // stalled = red, generating = accent, flagged/medium-risk = amber, else
  // normal border. Two-tone border (outer color + inner translucent) gives
  // depth on the dark surface.
  const isStalledForFrame = !!item.renderStalled;
  const frameBorderColor =
    isFailed || isStalledForFrame
      ? "rgba(220,38,38,0.55)"
      : isGenerating
        ? "var(--accent)"
        : item.risk === "flagged"
          ? "rgba(220,38,38,0.45)"
          : item.risk === "medium"
            ? "rgba(217,164,74,0.45)"
            : "var(--border)";
  const frameGlow =
    isFailed || isStalledForFrame
      ? "0 0 16px rgba(220,38,38,0.18)"
      : isGenerating
        ? "0 0 18px rgba(242,93,36,0.22)"
        : "none";
  const baseClass =
    "w-[140px] h-[140px] rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative group";
  const baseStyle = {
    background: "var(--bg-subtle)",
    border: `1.5px solid ${frameBorderColor}`,
    boxShadow: frameGlow,
  } as const;

  const hasRender = !!item.renderedClipUrl;
  const isStalled = !!item.renderStalled;
  const isRendering =
    !isGenerating && !isFailed && !!item.fanBriefId && !hasRender && !isStalled;

  const inner = isGenerating ? (
    <Loader2 size={32} color="var(--accent)" className="animate-spin" />
  ) : isFailed ? (
    <TriangleAlert size={32} color="#dc2626" />
  ) : item.thumbnailUrl ? (
    <>
      <img
        src={item.thumbnailUrl}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
      {/* Hover overlay — burn-orange play disc when an edit is ready, or a
          "Rendering" pill when render-clip.ts hasn't run yet. */}
      <div
        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "rgba(0,0,0,0.5)" }}
      >
        {hasRender ? (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "var(--accent)" }}
          >
            <Play size={18} color="#fff" fill="#fff" />
          </div>
        ) : (
          <span
            className="px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide"
            style={{
              background: "rgba(255,255,255,0.92)",
              color: "var(--ink)",
            }}
          >
            Open
          </span>
        )}
      </div>
      {/* Persistent badge in the corner so the user sees the state at rest. */}
      {isRendering && (
        <div
          className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wide flex items-center gap-1"
          style={{
            background: "rgba(0,0,0,0.65)",
            color: "#fff",
          }}
        >
          <Loader2 size={9} className="animate-spin" />
          Rendering
        </div>
      )}
      {isStalled && (
        <div
          className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wide flex items-center gap-1"
          style={{
            background: "rgba(220,38,38,0.92)",
            color: "#fff",
          }}
        >
          <TriangleAlert size={9} />
          Failed
        </div>
      )}
      {hasRender && (
        <div
          className="absolute bottom-1 left-1 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: "var(--accent)" }}
        >
          <Play size={10} color="#fff" fill="#fff" />
        </div>
      )}
    </>
  ) : item.thumbKind === "video" ? (
    <Film size={32} color="var(--ink-tertiary)" />
  ) : item.thumbKind === "brief" ? (
    <FileText size={32} color="var(--ink-tertiary)" />
  ) : (
    <LinkIcon size={32} color="var(--ink-tertiary)" />
  );

  if (!isGenerating && !isFailed && (hasRender || item.sourceUrl)) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={baseClass}
        style={{ ...baseStyle, cursor: "pointer" }}
        title={
          hasRender
            ? "Watch the edit"
            : isStalled
              ? "Render didn't run — view source"
              : "Render not ready — view source"
        }
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={baseClass} style={baseStyle}>
      {inner}
    </div>
  );
}

function BriefViewerModal({
  item,
  onClose,
  onRetry,
}: {
  item: QueueItem;
  onClose: () => void;
  onRetry: () => void;
}) {
  const hasRender = !!item.renderedClipUrl;
  // Tracks <video> load errors (404 from storage, CORS, codec rejection).
  // Reset whenever a fresh URL lands so the user gets one re-attempt per
  // URL without remounting the modal.
  const [videoError, setVideoError] = useState(false);
  const lastUrlRef = useRef<string | undefined>(item.renderedClipUrl);
  if (lastUrlRef.current !== item.renderedClipUrl) {
    lastUrlRef.current = item.renderedClipUrl;
    if (videoError) setVideoError(false);
  }

  const isStalled = !!item.renderStalled;
  const showVideo = hasRender && !videoError;
  const headerLabel = showVideo
    ? "Rendered edit"
    : videoError
      ? "Couldn't load edit"
      : isStalled
        ? "Render didn't run"
        : "Render in progress";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl flex flex-col gap-4 p-6 max-w-[920px] w-full max-h-[90vh] overflow-y-auto font-['DM_Sans',sans-serif]"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className="text-[11px] font-semibold uppercase tracking-wide mb-0.5"
              style={{ color: "var(--ink-secondary)" }}
            >
              {headerLabel}
            </div>
            <div
              className="text-[18px] font-semibold leading-snug"
              style={{ color: "var(--ink)" }}
            >
              {item.title}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="text-[14px]"
              style={{ color: "var(--ink-tertiary)" }}
            >
              ✕
            </span>
          </button>
        </div>

        {showVideo ? (
          <div
            className="rounded-xl overflow-hidden mx-auto"
            style={{
              background: "#000",
              maxWidth: 432,
              aspectRatio: "9 / 16",
            }}
          >
            <video
              src={item.renderedClipUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full"
              onError={() => {
                console.warn("[brief-viewer] video failed to load", {
                  url: item.renderedClipUrl,
                  briefId: item.fanBriefId,
                });
                setVideoError(true);
              }}
            />
          </div>
        ) : (
          <div
            className="rounded-xl p-6 flex flex-col items-center text-center gap-3"
            style={{
              background: "var(--bg-subtle)",
              border: "1px dashed var(--border)",
            }}
          >
            {videoError || isStalled ? (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "var(--red-light)" }}
              >
                <span className="text-[16px]" style={{ color: "var(--red)" }}>
                  !
                </span>
              </div>
            ) : (
              <Loader2
                size={28}
                color="var(--accent)"
                className="animate-spin"
              />
            )}
            <div
              className="text-[14px] font-semibold"
              style={{ color: "var(--ink)" }}
            >
              {videoError
                ? "Couldn't load the rendered clip"
                : isStalled
                  ? renderErrorChipLabel(item.renderError)
                  : "The edit hasn't rendered yet"}
            </div>
            <div
              className="text-[12px] max-w-[440px]"
              style={{ color: "var(--ink-tertiary)" }}
            >
              {videoError
                ? "The MP4 may have been removed from storage or the URL is unreachable. View the source on YouTube instead."
                : isStalled
                  ? renderErrorMessage(item.renderError)
                  : "The brief is approved but the render worker hasn't produced the 9:16 MP4 yet. Once it lands, this card will pick it up automatically."}
            </div>
            {isStalled && (
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={onRetry}
                  className="h-9 px-4 rounded-[10px] text-[13px] font-semibold flex items-center gap-2"
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  <RefreshCw size={13} />
                  Retry render
                </button>
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 px-4 rounded-[10px] text-[13px] font-semibold flex items-center gap-2"
                    style={{
                      background: "transparent",
                      color: "var(--ink)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <Play size={13} />
                    Open on YouTube
                  </a>
                )}
              </div>
            )}
            {!isStalled && item.sourceUrl && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="h-9 px-4 rounded-[10px] text-[13px] font-semibold flex items-center gap-2 mt-1"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                  border: "none",
                }}
              >
                <Play size={13} fill="#fff" />
                View source on YouTube
              </a>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
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
      className="h-9 px-3 rounded-[10px] text-[12px] font-semibold flex items-center gap-1.5 transition-[color,background-color,border-color,transform,opacity] duration-[var(--dur-state)] ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-90 active:scale-[0.97] active:duration-[var(--dur-instant)]"
      style={styles}
    >
      {children}
    </button>
  );
}

// Backend `render_error` codes get short, user-readable chip labels and
// longer per-card messages. Codes intentionally surface to the user so they
// can decide whether retrying makes sense (yt_blocked / geo_blocked are
// unlikely to resolve unless something changed; download_failed often does).
function renderErrorChipLabel(code: QueueItem["renderError"]): string {
  switch (code) {
    case "yt_blocked":
      return "YouTube blocked source";
    case "geo_blocked":
      return "Source geo-blocked";
    case "download_failed":
      return "Download failed";
    case "render_failed":
      return "Render failed";
    default:
      return "Render didn't run";
  }
}

function renderErrorMessage(code: QueueItem["renderError"]): string {
  switch (code) {
    case "yt_blocked":
      return "YouTube flagged the source as bot traffic and our worker can't fetch it. Watching it directly on YouTube may still work for you.";
    case "geo_blocked":
      return "The source video isn't available in our worker's region. Open it on YouTube — it'll likely play for you.";
    case "download_failed":
      return "Couldn't download the source video. It may have been removed or made private. Retry, or open on YouTube to verify.";
    case "render_failed":
      return "The video downloaded but rendering errored downstream. Retry once — if it fails again, kill this brief.";
    default:
      return "The render didn't finish in the expected window. The source video may be blocked. Open on YouTube, retry, or dismiss.";
  }
}

function CartoonStageTimeline({
  stage,
  detail,
  className,
}: {
  stage: CartoonStage;
  detail?: string;
  className?: string;
}) {
  const currentIdx = CARTOON_STAGE_ORDER.indexOf(stage);
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className ?? ""}`}>
      {CARTOON_STAGE_ORDER.map((s, idx) => {
        const meta = CARTOON_STAGE_META[s];
        const isCurrent = currentIdx === idx;
        const isPast = currentIdx > idx;
        const Icon = meta.Icon;
        return (
          <div key={s} className="flex items-center gap-1.5 min-w-0">
            <div
              className="flex items-center gap-1.5 px-2 h-6 rounded-[8px] text-[10px] font-semibold uppercase tracking-wide"
              style={{
                background: isCurrent
                  ? "var(--accent-light)"
                  : isPast
                    ? "rgba(74,160,122,0.12)"
                    : "var(--bg-subtle)",
                color: isCurrent
                  ? "var(--accent)"
                  : isPast
                    ? "#4aa07a"
                    : "var(--ink-tertiary)",
                border: `1px solid ${isCurrent ? "var(--accent)" : isPast ? "rgba(74,160,122,0.35)" : "var(--border)"}`,
              }}
            >
              {isCurrent ? (
                <Loader2 size={10} className="animate-spin" />
              ) : isPast ? (
                <Check size={10} />
              ) : (
                <Icon size={10} />
              )}
              {meta.label}
            </div>
            {idx < CARTOON_STAGE_ORDER.length - 1 && (
              <div
                className="w-2 h-px"
                style={{
                  background: isPast
                    ? "rgba(74,160,122,0.35)"
                    : "var(--border)",
                }}
              />
            )}
          </div>
        );
      })}
      {/* End-of-line "Done" pill — dimmed until the run lands at status=pending. */}
      <div
        className="flex items-center gap-1.5 px-2 h-6 rounded-[8px] text-[10px] font-semibold uppercase tracking-wide"
        style={{
          background: "var(--bg-subtle)",
          color: "var(--ink-tertiary)",
          border: "1px solid var(--border)",
        }}
      >
        <Sparkles size={10} />
        Done
      </div>
      {/* Sub-state hint — surfaces "Queued · waiting for slot" when the
          backend serializes image/video rendering and N>1 cartoons stack up.
          Without this the active pill spins for minutes and looks stalled. */}
      {detail && (
        <div
          className="text-[11px] font-medium ml-1"
          style={{ color: "var(--ink-secondary)" }}
        >
          {detail}
        </div>
      )}
    </div>
  );
}

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({
        title: "Copy failed",
        description: "Try right-click → Copy link instead.",
        variant: "destructive",
      });
    }
  }, [url]);
  return (
    <button
      type="button"
      onClick={onCopy}
      className="h-9 px-3 rounded-[10px] text-[12px] font-semibold flex items-center gap-1.5"
      style={{
        background: "transparent",
        color: "var(--ink)",
        border: "1px solid var(--border)",
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
