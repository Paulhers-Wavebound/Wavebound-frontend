import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import type { ContentBriefing } from "@/data/contentDashboardHelpers";
import type { BriefSection } from "@/hooks/useIntelligenceBriefs";
import InfoPopover from "@/components/sound-intelligence/InfoPopover";

export default function ContentBriefingCard({
  briefing,
  userName,
  aiGeneratedAt,
  aiBriefSections,
}: {
  briefing: ContentBriefing;
  userName?: string;
  /** ISO timestamp from intelligence_briefs — when present, actions come from AI */
  aiGeneratedAt?: string | null;
  /** Sections from AI briefs for richer chat prefill */
  aiBriefSections?: BriefSection[];
}) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const displayName = userName || "there";

  // Build prefill text for the chat assistant
  const prefillLines = [
    `Here's my content & social briefing:`,
    ``,
    ...briefing.paragraphs,
  ];

  // When AI brief sections exist, include them for richer context
  if (aiBriefSections && aiBriefSections.length > 0) {
    prefillLines.push(``, `Intelligence highlights:`);
    for (const sec of aiBriefSections) {
      prefillLines.push(``, `**${sec.artistName} — ${sec.title}**`);
      prefillLines.push(sec.content);
    }
  }

  prefillLines.push(
    ``,
    `Recommended actions:`,
    ...briefing.actions.map((a, i) => `${i + 1}. ${a}`),
    ``,
    `Let's discuss this — what should I prioritize first?`,
  );

  const prefillText = prefillLines.join("\n");

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
          className="rounded-xl border border-white/[0.06] px-7 py-6"
          style={{ background: "#1C1C1E" }}
        >
          {/* Header */}
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
                Content &amp; Social Briefing
              </h2>
              {aiGeneratedAt && (
                <span
                  className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded"
                  style={{
                    color: "#e8430a",
                    background: "rgba(232,67,10,0.12)",
                  }}
                >
                  Wavebound Brief
                </span>
              )}
              <InfoPopover
                text="A daily summary of your roster's content health — what changed overnight, who needs attention, and recommended actions for today."
                width={280}
              />
            </div>
            {(() => {
              if (!aiGeneratedAt) {
                return (
                  <span
                    className="text-[11px]"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    Updated just now
                  </span>
                );
              }
              const isStale =
                Date.now() - new Date(aiGeneratedAt).getTime() >
                24 * 60 * 60 * 1000;
              return (
                <span
                  className="text-[11px] tabular-nums whitespace-nowrap"
                  style={{
                    color: isStale ? "#FF9F0A" : "rgba(255,255,255,0.35)",
                  }}
                  title={
                    isStale
                      ? `Brief is over 24 hours old — the president_briefs job may not have run.\n\nGenerated: ${new Date(aiGeneratedAt).toLocaleString()}`
                      : new Date(aiGeneratedAt).toLocaleString()
                  }
                >
                  Generated{" "}
                  {formatDistanceToNow(new Date(aiGeneratedAt), {
                    addSuffix: true,
                  })}
                </span>
              );
            })()}
          </div>

          {/* Greeting */}
          <h3
            className="text-[22px] font-normal mb-5"
            style={{
              fontFamily: '"Tiempos Text", Georgia, serif',
              color: "rgba(255,255,255,0.87)",
            }}
          >
            {briefing.greeting}, {displayName}.
          </h3>

          {/* Body */}
          <div
            style={{ fontFamily: '"Tiempos Text", Georgia, serif' }}
            className="space-y-4"
          >
            {briefing.paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-[15px] leading-[1.85]"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {p}
              </p>
            ))}

            {/* Recommended actions */}
            {briefing.actions.length > 0 && (
              <div>
                <p
                  className="text-[13px] font-medium mb-2"
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    color: "rgba(255,255,255,0.45)",
                    letterSpacing: "0.02em",
                  }}
                >
                  Today&rsquo;s recommended actions:
                </p>
                {briefing.actionsArtist && (
                  <p
                    className="text-[12px] font-semibold mb-1.5"
                    style={{ color: "#e8430a" }}
                  >
                    {briefing.actionsArtist}
                  </p>
                )}
                <ul
                  className="list-disc list-inside space-y-1 text-[14px] leading-[1.7]"
                  style={{ color: "rgba(255,255,255,0.60)" }}
                >
                  {briefing.actions.slice(0, 4).map((action, i) => (
                    <li key={i}>
                      {action.length > 140
                        ? action.slice(0, 140) + "…"
                        : action}
                    </li>
                  ))}
                </ul>
                {briefing.actions.length > 4 && (
                  <p
                    className="text-[12px] mt-1"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    +{briefing.actions.length - 4} more
                  </p>
                )}
              </div>
            )}

            {/* Summary */}
            <p
              className="text-[13px] leading-[1.7]"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              {briefing.summary}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-3 pt-2.5 border-t border-white/[0.06]">
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
                  state: { prefill: prefillText },
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
