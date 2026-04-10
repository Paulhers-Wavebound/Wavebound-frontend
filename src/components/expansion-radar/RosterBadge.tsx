import { ShieldCheck } from "lucide-react";

export default function RosterBadge() {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 6,
        border: "1px solid rgba(232,67,10,0.25)",
        background: "rgba(232,67,10,0.06)",
      }}
    >
      <ShieldCheck size={13} color="#e8430a" />
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10,
          fontWeight: 600,
          color: "#e8430a",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Roster Intelligence
      </span>
    </div>
  );
}
