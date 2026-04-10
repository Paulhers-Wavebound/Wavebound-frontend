import { Trophy } from "lucide-react";
import type { TopEntities } from "./types";
import { formatNumber, relativeTime } from "./helpers";
import { ENTITY_TYPE_COLORS } from "./constants";
import { CollapsibleSection } from "./shared";

export default function TopEntitiesSection({ top }: { top: TopEntities }) {
  return (
    <CollapsibleSection title="Top entities" icon={Trophy}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {/* Most Listeners */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            border: "1px solid var(--border)",
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 8,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Most listeners
          </div>
          {top.most_listeners.length === 0 ? (
            <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
              No data yet
            </span>
          ) : (
            top.most_listeners.map((e, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0",
                  fontSize: 12,
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                <span
                  style={{
                    color: "var(--ink-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 140,
                  }}
                >
                  {e.name}
                </span>
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    color: "var(--ink)",
                    fontWeight: 500,
                    fontSize: 11,
                  }}
                >
                  {formatNumber(e.value)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Most Countries */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            border: "1px solid var(--border)",
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 8,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Most countries
          </div>
          {top.most_countries.length === 0 ? (
            <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
              No data yet
            </span>
          ) : (
            top.most_countries.map((e, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0",
                  fontSize: 12,
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                <span
                  style={{
                    color: "var(--ink-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 140,
                  }}
                >
                  {e.name}
                </span>
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    color: "var(--ink)",
                    fontWeight: 500,
                    fontSize: 11,
                  }}
                >
                  {e.countries}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Most Platforms */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            border: "1px solid var(--border)",
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 8,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Most platforms
          </div>
          {top.most_platforms.length === 0 ? (
            <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
              No data yet
            </span>
          ) : (
            top.most_platforms.map((e, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0",
                  fontSize: 12,
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                <span
                  style={{
                    color: "var(--ink-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 140,
                  }}
                >
                  {e.name}
                </span>
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    color: "var(--ink)",
                    fontWeight: 500,
                    fontSize: 11,
                  }}
                >
                  {e.platforms}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Newest Entities */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            border: "1px solid var(--border)",
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 8,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Newest entities
          </div>
          {top.newest_entities.length === 0 ? (
            <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
              No data yet
            </span>
          ) : (
            top.newest_entities.map((e, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "3px 0",
                  fontSize: 12,
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "1px 5px",
                      borderRadius: 4,
                      background:
                        (ENTITY_TYPE_COLORS[e.entity_type] || "#6366f1") + "22",
                      color: ENTITY_TYPE_COLORS[e.entity_type] || "#6366f1",
                      whiteSpace: "nowrap",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {e.entity_type}
                  </span>
                  <span
                    style={{
                      color: "var(--ink-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {e.name}
                  </span>
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--ink-faint)",
                    whiteSpace: "nowrap",
                    marginLeft: 8,
                  }}
                >
                  {relativeTime(e.created_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
}
