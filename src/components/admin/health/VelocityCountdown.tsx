import { Zap, CheckCircle2 } from "lucide-react";
import type { VelocityStatus } from "./types";
import { formatDateShort } from "./helpers";
import { SectionHeader, ProgressBar } from "./shared";

export default function VelocityCountdown({ v }: { v: VelocityStatus }) {
  const targetLabel = formatDateShort(v.target_date + "T00:00:00Z");

  if (v.velocity_active) {
    return (
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 14,
          border: "1px solid var(--border)",
          padding: 20,
        }}
      >
        <SectionHeader icon={Zap} label="Velocity countdown" />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            borderRadius: 12,
            background: "var(--green-light)",
            border: "1px solid #34d39933",
          }}
        >
          <CheckCircle2 size={20} color="#34d399" />
          <div>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 15,
                fontWeight: 600,
                color: "#34d399",
              }}
            >
              Velocity metrics ACTIVE
            </span>
            <span
              style={{
                fontSize: 13,
                color: "var(--ink-secondary)",
                marginLeft: 12,
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              {v.days_of_data} days of data collected
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        padding: 20,
      }}
    >
      <SectionHeader icon={Zap} label="Velocity countdown" />
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 28,
              fontWeight: 700,
              color: "#f59e0b",
            }}
          >
            {v.days_of_data}
            <span style={{ fontSize: 16, fontWeight: 400, marginLeft: 4 }}>
              / 7 days
            </span>
          </span>
          <span
            style={{
              fontSize: 13,
              color: "var(--ink-tertiary)",
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Target: {targetLabel}
          </span>
        </div>
        <ProgressBar pct={v.pct_complete} color="#f59e0b" height={10} />
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: "var(--ink-secondary)",
          fontFamily: '"DM Sans", sans-serif',
        }}
      >
        {v.days_of_data} day{v.days_of_data !== 1 ? "s" : ""} of data collected.
        Velocity metrics activate in{" "}
        <strong style={{ color: "#f59e0b" }}>
          {v.days_until_velocity} day{v.days_until_velocity !== 1 ? "s" : ""}
        </strong>
        .
      </p>
    </div>
  );
}
