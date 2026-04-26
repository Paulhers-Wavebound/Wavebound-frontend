import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { KillReason, QueueItem } from "./types";

interface KillFeedbackModalProps {
  item: QueueItem | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (itemId: string, reason: KillReason, note: string) => void;
}

const REASONS: { value: KillReason; label: string; description: string }[] = [
  {
    value: "angle_wrong",
    label: "Angle wrong",
    description: "The premise misses what makes this artist interesting.",
  },
  {
    value: "tone_off",
    label: "Tone off",
    description: "Framing or voice doesn't match the brand.",
  },
  {
    value: "factual_issue",
    label: "Factual issue",
    description: "Claim isn't supported by the sources cited.",
  },
  {
    value: "other",
    label: "Other",
    description: "Spell it out in the note.",
  },
];

export default function KillFeedbackModal({
  item,
  open,
  onClose,
  onSubmit,
}: KillFeedbackModalProps) {
  const [reason, setReason] = useState<KillReason>("angle_wrong");
  const [note, setNote] = useState("");

  const isOpen = open && !!item;

  const submit = () => {
    if (!item) return;
    // TODO: feeds back into artist's Autopilot priors
    onSubmit(item.id, reason, note.trim());
    setReason("angle_wrong");
    setNote("");
  };

  return (
    <AnimatePresence>
      {isOpen && item && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[520px] rounded-2xl p-6 flex flex-col gap-5 font-['DM_Sans',sans-serif]"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderTop: "0.5px solid var(--card-edge)",
            }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div
                  className="text-[11px] font-semibold uppercase tracking-wide mb-1"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  Kill + feedback
                </div>
                <div
                  className="text-[15px] font-semibold truncate"
                  style={{ color: "var(--ink)" }}
                >
                  {item.title}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border)",
                }}
              >
                <X size={14} color="var(--ink-tertiary)" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div
                className="text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: "var(--ink-secondary)" }}
              >
                Reason
              </div>
              <div className="flex flex-col gap-1.5">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className="text-left px-3 py-2.5 rounded-[10px] transition-colors"
                    style={{
                      background:
                        reason === r.value
                          ? "var(--accent-light)"
                          : "var(--bg-subtle)",
                      border: `1px solid ${
                        reason === r.value ? "var(--accent)" : "var(--border)"
                      }`,
                      color:
                        reason === r.value ? "var(--accent)" : "var(--ink)",
                    }}
                  >
                    <div className="text-[13px] font-semibold">{r.label}</div>
                    <div
                      className="text-[11px]"
                      style={{
                        color:
                          reason === r.value
                            ? "var(--accent)"
                            : "var(--ink-tertiary)",
                        opacity: reason === r.value ? 0.85 : 1,
                      }}
                    >
                      {r.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div
                className="text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: "var(--ink-secondary)" }}
              >
                Note (optional)
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything specific — Autopilot learns from this."
                className="w-full min-h-[84px] px-3 py-2 rounded-[10px] text-[13px] outline-none resize-y"
                style={{
                  background: "var(--bg-subtle)",
                  color: "var(--ink)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-[10px] text-[13px] font-semibold"
                style={{
                  background: "transparent",
                  color: "var(--ink)",
                  border: "1px solid var(--border)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                className="h-10 px-4 rounded-[10px] text-[13px] font-semibold"
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                }}
              >
                Kill with feedback
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
