/**
 * Signal Report Card — replaces the 08:00-10:00 manual triage.
 *
 * Bible §3: "The strategist presents the Signal Report. This is not a summary
 * of the day's work, but a list of the 3-5 critical Decision Points."
 *
 * Structure:
 *  1. Roster Pulse — 1 sentence overall direction + key metrics
 *  2. Decision Points — 3-5 specific artist + signal + recommended action
 *  3. Risk Alerts — critical/warning flags (if any)
 *  4. Today's TODO — actionable checklist derived from decisions
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  MessageCircle,
  Check,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Zap,
  Music2,
  Clock,
  Target,
  ShieldAlert,
  Bookmark,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import InfoPopover from "@/components/sound-intelligence/InfoPopover";
import type {
  SignalReport,
  DecisionCategory,
  DecisionPoint,
} from "@/data/contentDashboardHelpers";
import { fmtPct } from "@/data/contentDashboardHelpers";
import {
  useDecisionPointActions,
  useLabelTeammates,
} from "@/hooks/useDecisionPointActions";
import { useSignalReportTodos, todoKey } from "@/hooks/useSignalReportTodos";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { decisionPointKey } from "@/utils/decisionPointKey";
import DecisionPointActions from "./DecisionPointActions";

/* ─── Category config ─────────────────────────────────────── */

const CATEGORY_CONFIG: Record<
  DecisionCategory,
  { label: string; icon: typeof TrendingUp; color: string }
> = {
  MOMENTUM_CAPTURE: {
    label: "Scale",
    icon: TrendingUp,
    color: "#30D158",
  },
  BUDGET_REALLOCATION: {
    label: "Reallocate",
    icon: Zap,
    color: "#FFD60A",
  },
  FORMAT_PIVOT: {
    label: "Pivot",
    icon: Target,
    color: "#0A84FF",
  },
  CATALOG_ACTIVATION: {
    label: "Catalog",
    icon: Music2,
    color: "#BF5AF2",
  },
  CONTENT_PIPELINE: {
    label: "Pipeline",
    icon: Clock,
    color: "#FF9F0A",
  },
  CRISIS_RESPONSE: {
    label: "Crisis",
    icon: ShieldAlert,
    color: "#FF453A",
  },
  CONVERSION_ALERT: {
    label: "Conversion",
    icon: Bookmark,
    color: "#FF453A",
  },
};

const URGENCY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  now: { label: "NOW", color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
  today: { label: "TODAY", color: "#FF9F0A", bg: "rgba(255,159,10,0.10)" },
  this_week: {
    label: "THIS WEEK",
    color: "rgba(255,255,255,0.40)",
    bg: "rgba(255,255,255,0.04)",
  },
};

/* ─── Artist Avatar with chained fallback ────────────────────
 * Tries the provided URL first, then a deterministic Supabase Storage
 * URL derived from the handle, then falls back to artist initials.
 * This makes the row resilient to expired TikTok CDN signed URLs.
 */
const AVATAR_BUCKET_BASE =
  "https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/object/public/avatars";

function ArtistAvatar({
  name,
  handle,
  url,
  color,
  size = 36,
}: {
  name: string;
  handle?: string | null;
  url?: string | null;
  color: string;
  size?: number;
}) {
  const sources = useMemo(() => {
    const arr: string[] = [];
    if (url) arr.push(url);
    if (handle) {
      const h = handle.replace(/^@/, "").trim();
      if (h) {
        const storageUrl = `${AVATAR_BUCKET_BASE}/${h}.jpg`;
        if (!arr.includes(storageUrl)) arr.push(storageUrl);
      }
    }
    return arr;
  }, [url, handle]);

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setIdx(0);
  }, [sources]);

  const currentSrc = idx < sources.length ? sources[idx] : null;
  const initials =
    (name || "?")
      .split(/[\s,]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?";

  const boxStyle = {
    height: size,
    width: size,
    border: `2px solid ${color}40`,
  } as const;

  if (!currentSrc) {
    return (
      <div
        className="shrink-0 mt-0.5 flex items-center justify-center rounded-full font-semibold"
        style={{
          ...boxStyle,
          background: `${color}25`,
          color,
          fontSize: Math.round(size * 0.36),
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className="shrink-0 mt-0.5 rounded-full overflow-hidden"
      style={{ ...boxStyle, background: `${color}15` }}
    >
      <img
        key={currentSrc}
        src={currentSrc}
        alt={name}
        className="h-full w-full object-cover"
        onError={() => setIdx((i) => i + 1)}
      />
    </div>
  );
}

/* ─── Decision Point Row ──────────────────────────────────── */

function DecisionPointRow({
  dp,
  index,
  briefDate,
  revisitingNote,
  senderLabel,
}: {
  dp: DecisionPoint;
  index: number;
  briefDate: string;
  revisitingNote?: string | null;
  senderLabel?: string | null;
}) {
  const cat = CATEGORY_CONFIG[dp.category];
  const urg = URGENCY_CONFIG[dp.urgency];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      className="flex gap-3 py-3"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {/* Artist avatars — show all for multi-artist decision points */}
      <div
        className="flex shrink-0"
        style={{ marginLeft: dp.all_artists?.length > 1 ? 0 : 0 }}
      >
        {(dp.all_artists && dp.all_artists.length > 1
          ? dp.all_artists
          : [
              {
                name: dp.artist_name,
                handle: dp.artist_handle,
                avatar_url: dp.avatar_url,
              },
            ]
        ).map((artist, ai) => (
          <div
            key={artist.handle || ai}
            style={{
              marginLeft: ai > 0 ? -10 : 0,
              zIndex: dp.all_artists?.length ? dp.all_artists.length - ai : 1,
            }}
            className="relative"
          >
            <ArtistAvatar
              name={artist.name}
              handle={artist.handle}
              url={artist.avatar_url}
              color={cat.color}
              size={dp.all_artists && dp.all_artists.length > 2 ? 30 : 36}
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header: category + urgency + artist */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[10px] font-semibold tracking-wider uppercase"
            style={{ color: cat.color }}
          >
            {cat.label}
          </span>
          <span
            className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded"
            style={{ color: urg.color, background: urg.bg }}
          >
            {urg.label}
          </span>
          <span className="text-[11px] text-white/40 truncate">
            {dp.artist_name}
          </span>
          {senderLabel && (
            <span
              className="text-[9px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded shrink-0"
              style={{
                color: "#e8430a",
                background: "rgba(232,67,10,0.10)",
              }}
            >
              from {senderLabel}
            </span>
          )}
        </div>

        {/* Signal */}
        <p
          className="text-[13px] leading-relaxed mb-1"
          style={{
            fontFamily: '"Tiempos Text", Georgia, serif',
            color: "rgba(255,255,255,0.80)",
          }}
        >
          {dp.signal}
        </p>

        {/* Decision */}
        <p
          className="text-[13px] leading-relaxed mb-2"
          style={{
            fontFamily: '"Tiempos Text", Georgia, serif',
            color: "rgba(255,255,255,0.60)",
          }}
        >
          <ArrowRight
            size={11}
            className="inline -mt-0.5 mr-1"
            style={{ color: cat.color }}
          />
          {dp.decision}
        </p>

        {/* Evidence chips */}
        {dp.evidence.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {dp.evidence.map((e, i) => (
              <span
                key={i}
                className="text-[10px] font-medium tabular-nums px-2 py-0.5 rounded bg-white/[0.04] max-w-full truncate"
                style={{ color: e.color || "rgba(255,255,255,0.50)" }}
              >
                {e.value ? `${e.label}: ${e.value}` : e.label}
              </span>
            ))}
          </div>
        )}

        {revisitingNote && (
          <div className="mt-2 text-[11px] text-white/55 italic border-l-2 border-[#e8430a]/40 pl-2">
            “{revisitingNote}”
          </div>
        )}

        <DecisionPointActions decisionPoint={dp} briefDate={briefDate} />
      </div>
    </motion.div>
  );
}

/* ─── Collapsible Decision Points ────────────────────────── */

const PEEK_HEIGHT = 120;

function DecisionPointsSection({
  decisionPoints,
  briefDate,
  isOpen,
  onToggle,
}: {
  decisionPoints: DecisionPoint[];
  briefDate: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="px-7 pb-2">
      {/* Header — clickable toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full pt-3 pb-2 border-t border-white/[0.06]"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-white/30">
            Decision Points
          </span>
          <span className="text-[10px] text-white/20 tabular-nums">
            {decisionPoints.length}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.30)" }} />
        </motion.div>
      </button>

      {decisionPoints.length === 0 && (
        <p className="text-[13px] text-white/30 py-4">
          No critical decisions needed today. Roster is stable.
        </p>
      )}

      {decisionPoints.length > 0 && (
        <motion.div
          animate={{
            height: isOpen
              ? (contentRef.current?.scrollHeight ?? "auto")
              : PEEK_HEIGHT,
          }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          style={{ overflow: "hidden", position: "relative" }}
          onClick={!isOpen ? onToggle : undefined}
          className={!isOpen ? "cursor-pointer" : undefined}
        >
          {/* Fade-out mask — visible only when collapsed */}
          <motion.div
            animate={{ opacity: isOpen ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 1,
              background:
                "linear-gradient(to bottom, transparent 15%, var(--L1, #1C1C1E) 95%)",
            }}
          />

          <div ref={contentRef}>
            {decisionPoints.map((dp, i) => (
              <DecisionPointRow
                key={`${dp.artist_handle}-${dp.category}-${i}`}
                dp={dp}
                index={i}
                briefDate={briefDate}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── Revisiting Section (snoozed back to today + forwarded to me) ─── */

function RevisitingSection({
  entries,
  briefDate,
}: {
  entries: ReturnType<typeof useDecisionPointActions>["revisiting"];
  briefDate: string;
}) {
  const { labelId } = useUserProfile();
  const teammates = useLabelTeammates(labelId);

  const senderLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of teammates.data ?? []) {
      const display = t.artist_handle || t.email?.split("@")[0] || null;
      if (display) map.set(t.user_id, display);
    }
    return map;
  }, [teammates.data]);

  if (entries.length === 0) return null;
  return (
    <div className="px-7 pb-2">
      <div className="flex items-center gap-2 pt-3 pb-2 border-t border-white/[0.06]">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-[#e8430a]">
          Revisiting
        </span>
        <span className="text-[10px] text-white/20 tabular-nums">
          {entries.length}
        </span>
        <span className="text-[10px] text-white/30 ml-1">
          snoozed back to today or forwarded to you
        </span>
      </div>
      <div>
        {entries.map((entry, i) => {
          const senderLabel =
            entry.reason === "forwarded_to_me" && entry.senderUserId
              ? (senderLookup.get(entry.senderUserId) ?? "teammate")
              : null;
          return (
            <DecisionPointRow
              key={entry.key}
              dp={entry.decisionPoint}
              index={i}
              briefDate={briefDate}
              revisitingNote={
                entry.reason === "forwarded_to_me" ? entry.note : null
              }
              senderLabel={senderLabel}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Signal Report Card ─────────────────────────────── */

export default function SignalReportCard({
  report,
  userName,
  aiBriefText,
  aiBriefGeneratedAt,
  briefDate,
}: {
  report: SignalReport;
  userName?: string | null;
  aiBriefText?: string | null;
  aiBriefGeneratedAt?: string | null;
  briefDate: string;
}) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [decisionsOpen, setDecisionsOpen] = useState(false);
  const [showAllTodos, setShowAllTodos] = useState(false);

  const { acknowledgedKeys, futureSnoozedKeys, revisiting } =
    useDecisionPointActions(briefDate);
  const { checkedKeys: checkedTodoKeys, toggle: toggleTodoPersisted } =
    useSignalReportTodos(briefDate);

  const visibleDecisionPoints = report.decisionPoints.filter((dp) => {
    const key = decisionPointKey(dp, briefDate);
    return !acknowledgedKeys.has(key) && !futureSnoozedKeys.has(key);
  });

  const displayName = userName || "there";
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  const visibleTodos = showAllTodos ? report.todos : report.todos.slice(0, 4);
  const checkedTodoCount = report.todos.filter((t) =>
    checkedTodoKeys.has(todoKey(t, briefDate)),
  ).length;

  // Build prefill for chat
  const assistantPrefill = [
    `Here's your Signal Report for ${report.date}:\n`,
    report.rosterPulse,
    `\nDecision Points:\n`,
    ...report.decisionPoints.map(
      (dp, i) =>
        `${i + 1}. ${dp.artist_name}: ${dp.signal} \u2192 ${dp.decision}`,
    ),
    `\nWhat would you like to dig into?`,
  ].join("\n");

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{
            opacity: 0,
            height: 0,
            marginBottom: 0,
            overflow: "hidden",
          }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-white/[0.06] overflow-hidden"
          style={{ background: "#1C1C1E" }}
        >
          {/* ── Header ─────────────────────────────────────── */}
          <div className="px-7 pt-6 pb-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2
                  className="text-[13px] font-medium tracking-wide"
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    color: "rgba(255,255,255,0.50)",
                    letterSpacing: "0.04em",
                  }}
                >
                  Signal Report
                </h2>
                <span
                  className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded"
                  style={{
                    color: "#e8430a",
                    background: "rgba(232,67,10,0.12)",
                  }}
                >
                  {report.date}
                </span>
                <InfoPopover
                  text="The Signal Report replaces your morning triage. It identifies the 3-5 critical decisions you need to make today, derived from overnight roster data, content anomalies, sound velocity, format performance, and AI analysis."
                  width={320}
                />
              </div>
              <div className="flex items-center gap-3">
                {/* Metric pills */}
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[10px] font-medium tabular-nums px-2 py-0.5 rounded bg-white/[0.04]">
                    <span className="text-white/30 mr-1">Velocity</span>
                    <span
                      style={{
                        color:
                          report.metrics.avgVelocityDelta > 5
                            ? "#30D158"
                            : report.metrics.avgVelocityDelta < -5
                              ? "#FF453A"
                              : "rgba(255,255,255,0.55)",
                      }}
                    >
                      {fmtPct(report.metrics.avgVelocityDelta)}
                    </span>
                  </span>
                  {report.metrics.avgSaveRate != null && (
                    <span className="text-[10px] font-medium tabular-nums px-2 py-0.5 rounded bg-white/[0.04]">
                      <span className="text-white/30 mr-1">Save Rate</span>
                      <span style={{ color: "rgba(255,255,255,0.55)" }}>
                        {report.metrics.avgSaveRate.toFixed(1)}%
                      </span>
                    </span>
                  )}
                  <span className="text-[10px] font-medium tabular-nums px-2 py-0.5 rounded bg-white/[0.04]">
                    <span className="text-white/30 mr-1">Active</span>
                    <span style={{ color: "rgba(255,255,255,0.55)" }}>
                      {report.metrics.activeArtists}/
                      {report.metrics.totalArtists}
                    </span>
                  </span>
                </div>
                {aiBriefGeneratedAt &&
                  (() => {
                    const isStale =
                      Date.now() - new Date(aiBriefGeneratedAt).getTime() >
                      24 * 60 * 60 * 1000;
                    return (
                      <span
                        className="text-[11px] tabular-nums whitespace-nowrap"
                        style={{
                          color: isStale ? "#FF9F0A" : "rgba(255,255,255,0.35)",
                        }}
                        title={
                          isStale
                            ? `Brief is over 24 hours old — the president_briefs job may not have run.\n\nGenerated: ${new Date(aiBriefGeneratedAt).toLocaleString()}`
                            : new Date(aiBriefGeneratedAt).toLocaleString()
                        }
                      >
                        Generated{" "}
                        {formatDistanceToNow(new Date(aiBriefGeneratedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    );
                  })()}
              </div>
            </div>

            {/* Greeting */}
            <h3
              className="text-[22px] font-normal mb-2"
              style={{
                fontFamily: '"Tiempos Text", Georgia, serif',
                color: "rgba(255,255,255,0.87)",
              }}
            >
              {greeting}, {displayName}.
            </h3>

            {/* Roster Pulse */}
            <p
              className="text-[15px] leading-[1.85] mb-1"
              style={{
                fontFamily: '"Tiempos Text", Georgia, serif',
                color: "rgba(255,255,255,0.87)",
              }}
            >
              {report.rosterPulse}
            </p>

            {/* AI Brief — incorporated from backend generation when available */}
            {aiBriefText && (
              <p
                className="text-[14px] leading-[1.85] mt-2"
                style={{
                  fontFamily: '"Tiempos Text", Georgia, serif',
                  color: "rgba(255,255,255,0.50)",
                }}
              >
                {aiBriefText}
              </p>
            )}
          </div>

          {/* ── Risk Alerts (subtle inline) ─────────────────── */}
          {report.riskAlerts.length > 0 && (
            <div className="px-7 pt-1 pb-2">
              <p
                className="text-[12px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                <span
                  className="font-medium"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  Heads up:
                </span>{" "}
                {report.riskAlerts.slice(0, 3).map((alert, i, arr) => (
                  <span key={i}>
                    {alert.message}
                    {i < arr.length - 1
                      ? i === arr.length - 2
                        ? ", and "
                        : ", "
                      : "."}
                  </span>
                ))}
              </p>
            </div>
          )}

          {/* ── Revisiting (snoozed back to today + forwarded to me) ── */}
          <RevisitingSection entries={revisiting} briefDate={briefDate} />

          {/* ── Decision Points (collapsible) ─────────────── */}
          <DecisionPointsSection
            decisionPoints={visibleDecisionPoints}
            briefDate={briefDate}
            isOpen={decisionsOpen}
            onToggle={() => setDecisionsOpen((o) => !o)}
          />

          {/* ── TODO Checklist ─────────────────────────────── */}
          {report.todos.length > 0 && (
            <div className="px-7 pb-4">
              <div className="flex items-center gap-2 mb-2 pt-3 border-t border-white/[0.06]">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-white/30">
                  Today&apos;s Actions
                </span>
                <span className="text-[10px] text-white/20 tabular-nums">
                  {checkedTodoCount}/{report.todos.length}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                {visibleTodos.map((todo, i) => {
                  const key = todoKey(todo, briefDate);
                  const checked = checkedTodoKeys.has(key);
                  const urg = URGENCY_CONFIG[todo.urgency];
                  return (
                    <motion.button
                      key={key}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => toggleTodoPersisted(todo)}
                      className="flex items-start gap-2.5 text-left px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Checkbox */}
                      <div
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors"
                        style={{
                          borderColor: checked
                            ? "#30D158"
                            : "rgba(255,255,255,0.15)",
                          background: checked
                            ? "rgba(48,209,88,0.15)"
                            : "transparent",
                        }}
                      >
                        {checked && (
                          <Check size={10} style={{ color: "#30D158" }} />
                        )}
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className="text-[9px] font-semibold tracking-wider uppercase px-1 py-0.5 rounded"
                            style={{ color: urg.color, background: urg.bg }}
                          >
                            {urg.label}
                          </span>
                          {todo.avatar_url && (
                            <img
                              src={todo.avatar_url}
                              alt={todo.artist_name}
                              className="h-3.5 w-3.5 shrink-0 rounded-full object-cover"
                            />
                          )}
                          <span className="text-[10px] text-white/30 truncate">
                            {todo.artist_name}
                          </span>
                        </div>
                        <p
                          className={`text-[12px] leading-relaxed transition-colors ${
                            checked
                              ? "text-white/25 line-through"
                              : "text-white/70"
                          }`}
                        >
                          {todo.text}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {report.todos.length > 4 && (
                <button
                  onClick={() => setShowAllTodos(!showAllTodos)}
                  className="flex items-center gap-1 mt-1 px-3 text-[11px] text-white/30 hover:text-white/50 transition-colors"
                >
                  {showAllTodos ? (
                    <>
                      Show less <ChevronUp size={12} />
                    </>
                  ) : (
                    <>
                      {report.todos.length - 4} more <ChevronDown size={12} />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* ── Footer actions ─────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 px-7 py-3 border-t border-white/[0.06]">
            <button
              onClick={() => setDismissed(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
            >
              <Check size={13} />
              Got it
            </button>
            <button
              onClick={() =>
                navigate("/label/assistant", {
                  state: { assistantPrefill, newSession: true },
                })
              }
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-medium text-[#e8430a] hover:bg-[#e8430a]/10 transition-colors"
            >
              <MessageCircle size={13} />
              Chat about this
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
