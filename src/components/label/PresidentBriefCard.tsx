import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import InfoPopover from "@/components/sound-intelligence/InfoPopover";
import { renderBriefText } from "@/utils/briefText";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Split brief text into situation ("What's happening") and action ("What to do").
 * Looks for the first sentence that starts with action-oriented language.
 */
function splitBrief(text: string): { situation: string; action: string } {
  // Sentence-split on period followed by space + uppercase letter
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!sentences || sentences.length <= 1)
    return { situation: text, action: "" };

  const actionStarters = [
    /^the most urgent/i,
    /^the key action/i,
    /^the (top )?priorit/i,
    /^prioriti[sz]e/i,
    /^focus on/i,
    /^action items/i,
    /^immediately/i,
    /^i recommend/i,
    /^you should/i,
    /^we (should|need|recommend)/i,
    /^start by/i,
    /^first,/i,
    /^to capitaliz/i,
    /^activate/i,
    /^consider/i,
    /^take action/i,
    /^act now/i,
    /^your team should/i,
  ];

  let splitIdx = -1;
  for (let i = 0; i < sentences.length; i++) {
    const trimmed = sentences[i].trim();
    if (actionStarters.some((re) => re.test(trimmed))) {
      splitIdx = i;
      break;
    }
  }

  // Fallback: split roughly in half if no action phrase detected
  if (splitIdx <= 0) {
    splitIdx = Math.ceil(sentences.length / 2);
  }

  return {
    situation: sentences.slice(0, splitIdx).join("").trim(),
    action: sentences.slice(splitIdx).join("").trim(),
  };
}

export default function PresidentBriefCard({
  text,
  generatedAt,
  userName,
}: {
  text: string;
  generatedAt: string | null;
  userName?: string | null;
}) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const displayName = userName || "there";
  const greeting = getGreeting();

  const assistantPrefill = [
    `Here's your morning brief:\n`,
    text,
    `\nWhat would you like to dig into?`,
  ].join("\n");

  const isStale = generatedAt
    ? Date.now() - new Date(generatedAt).getTime() > 24 * 60 * 60 * 1000
    : false;
  const updatedLabel = generatedAt
    ? `Generated ${formatDistanceToNow(new Date(generatedAt), { addSuffix: true })}`
    : "Updated just now";
  const updatedTitle = generatedAt
    ? isStale
      ? `Brief is over 24 hours old — the president_briefs job may not have run.\n\nGenerated: ${new Date(generatedAt).toLocaleString()}`
      : new Date(generatedAt).toLocaleString()
    : undefined;

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
                Morning Brief
              </h2>
              <span
                className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded"
                style={{
                  color: "#e8430a",
                  background: "rgba(232,67,10,0.12)",
                }}
              >
                Wavebound Brief
              </span>
              <InfoPopover
                text="A daily AI-generated summary of what's happening across your roster and what to act on today."
                width={280}
              />
            </div>
            <span
              className="text-[11px] tabular-nums whitespace-nowrap"
              style={{
                color: isStale ? "#FF9F0A" : "rgba(255,255,255,0.35)",
              }}
              title={updatedTitle}
            >
              {updatedLabel}
            </span>
          </div>

          {/* Greeting */}
          <h3
            className="text-[22px] font-normal mb-5"
            style={{
              fontFamily: '"Tiempos Text", Georgia, serif',
              color: "rgba(255,255,255,0.87)",
            }}
          >
            {greeting}, {displayName}.
          </h3>

          {/* Brief text — split into two paragraphs with breathing room */}
          {(() => {
            const { situation, action } = splitBrief(text);
            const pStyle = {
              fontFamily: '"Tiempos Text", Georgia, serif',
              color: "rgba(255,255,255,0.75)",
            };
            return (
              <div>
                <p className="text-[15px] leading-[1.85]" style={pStyle}>
                  {renderBriefText(situation)}
                </p>
                {action && (
                  <>
                    <hr className="border-t border-white/[0.06] my-5" />
                    <p className="text-[15px] leading-[1.85]" style={pStyle}>
                      {renderBriefText(action)}
                    </p>
                  </>
                )}
              </div>
            );
          })()}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-5 pt-2.5 border-t border-white/[0.06]">
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
