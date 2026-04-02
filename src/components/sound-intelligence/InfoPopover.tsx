import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, X } from "lucide-react";

interface InfoPopoverProps {
  text: string;
  /** Optional width override (default 260) */
  width?: number;
}

export default function InfoPopover({ text, width = 260 }: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div
      ref={ref}
      data-pdf-hide
      style={{ position: "relative", display: "inline-flex" }}
    >
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label="What is this?"
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: open ? "var(--ink-secondary)" : "var(--ink-faint)",
          transition: "color 150ms",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "var(--ink-secondary)")
        }
        onMouseLeave={(e) =>
          !open && (e.currentTarget.style.color = "var(--ink-faint)")
        }
      >
        <HelpCircle size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -4 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 25,
              mass: 0.8,
            }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: "50%",
              transform: "translateX(-50%)",
              width,
              background: "var(--chart-tooltip-bg, #1C1C1E)",
              backdropFilter: "blur(16px)",
              border:
                "1px solid var(--chart-tooltip-border, rgba(255,255,255,0.08))",
              borderRadius: 12,
              padding: "12px 14px",
              zIndex: 50,
              transformOrigin: "bottom center",
            }}
          >
            {/* Arrow pointing down */}
            <div
              style={{
                position: "absolute",
                bottom: -5,
                left: "50%",
                marginLeft: -5,
                width: 10,
                height: 10,
                background: "var(--chart-tooltip-bg, #1C1C1E)",
                border:
                  "1px solid var(--chart-tooltip-border, rgba(255,255,255,0.08))",
                borderLeft: "none",
                borderTop: "none",
                transform: "rotate(45deg)",
                borderRadius: "0 0 2px 0",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <p
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  lineHeight: 1.55,
                  color: "var(--ink-secondary, rgba(255,255,255,0.55))",
                  margin: 0,
                }}
              >
                {text}
              </p>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "var(--ink-faint)",
                  flexShrink: 0,
                  marginTop: -1,
                }}
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
