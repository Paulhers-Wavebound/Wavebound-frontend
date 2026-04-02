import { ReactNode } from "react";
import { Lock } from "lucide-react";

interface ComingSoonProps {
  children: ReactNode;
  /** Text shown in the badge, e.g. "Q2 2026" */
  label?: string;
}

/**
 * Wraps a section with a subtle overlay that prevents interaction.
 * Content is fully visible. A bottom gradient fades it out naturally.
 * Lock card floats in the center of the viewport.
 */
export default function ComingSoon({
  children,
  label = "Q2 2026",
}: ComingSoonProps) {
  return (
    <div style={{ position: "relative" }}>
      {/* Content — visible but not interactive */}
      <div
        style={{ pointerEvents: "none", userSelect: "none" }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Full-bleed interaction blocker — no visible styling, just blocks clicks */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 20,
        }}
      />

      {/* Bottom fade — content dissolves into page bg */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 300,
          background:
            "linear-gradient(to top, var(--bg, #000) 0%, transparent 100%)",
          zIndex: 21,
          pointerEvents: "none",
        }}
      />

      {/* Lock card — viewport-centered */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 22,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            padding: "32px 44px",
            borderRadius: 18,
            background: "rgba(28, 28, 30, 0.9)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background:
                "linear-gradient(135deg, rgba(232,67,10,0.2) 0%, rgba(232,67,10,0.05) 100%)",
              border: "1px solid rgba(232,67,10,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lock size={24} style={{ color: "#e8430a", opacity: 0.9 }} />
          </div>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.55)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            Launching {label}
          </span>
        </div>
      </div>
    </div>
  );
}
