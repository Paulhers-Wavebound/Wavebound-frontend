import { useState } from "react";
import { UserX, ChevronDown, ChevronRight } from "lucide-react";
import type { UnresolvedEntities } from "./types";
import { relativeTime } from "./helpers";

export default function UnresolvedEntitiesCard({
  data,
}: {
  data: UnresolvedEntities;
}) {
  const [expanded, setExpanded] = useState(false);

  const color =
    data.count > 200 ? "#ef4444" : data.count > 50 ? "#f59e0b" : "#34d399";

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        padding: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <UserX size={14} color="var(--ink-tertiary)" />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Unresolved artists
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 6,
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 28,
            fontWeight: 700,
            color,
            lineHeight: 1,
          }}
        >
          {data.count}
        </span>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            color: "var(--ink-faint)",
          }}
        >
          with 0 platform IDs
        </span>
      </div>

      {data.sample.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
              marginTop: 6,
            }}
          >
            {expanded ? (
              <ChevronDown size={12} color="var(--ink-faint)" />
            ) : (
              <ChevronRight size={12} color="var(--ink-faint)" />
            )}
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                color: "var(--ink-faint)",
              }}
            >
              {expanded ? "Hide" : "Show"} recent examples
            </span>
          </button>

          {expanded && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                marginTop: 6,
              }}
            >
              {data.sample.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 12,
                      color: "var(--ink-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "70%",
                    }}
                  >
                    {s.name}
                  </span>
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 10,
                      color: "var(--ink-faint)",
                    }}
                  >
                    {relativeTime(s.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
