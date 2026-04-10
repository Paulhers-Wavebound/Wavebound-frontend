import { PlaylistTracking } from "@/types/soundIntelligence";
import { formatNumber, timeAgo } from "@/utils/soundIntelligenceApi";
import { ListMusic, Plus, Minus } from "lucide-react";
import InfoPopover from "./InfoPopover";

interface Props {
  playlists: PlaylistTracking[];
}

export default function PlaylistActivityFeed({ playlists }: Props) {
  if (!playlists || playlists.length === 0) {
    return (
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          padding: 20,
          borderTop: "0.5px solid var(--card-edge)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 3,
              height: 14,
              borderRadius: 1,
              background:
                "linear-gradient(180deg, rgba(232,67,10,0.6) 0%, rgba(232,67,10,0.15) 100%)",
            }}
          />
          <ListMusic size={14} color="var(--ink-tertiary)" />
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.10em",
              color: "var(--ink-tertiary)",
            }}
          >
            Playlist Activity
          </span>
        </div>
        <div
          style={{
            padding: "24px 0",
            textAlign: "center",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "var(--ink-faint)",
          }}
        >
          No playlist tracking data yet. Spotify playlist adds/removes will
          appear here.
        </div>
      </div>
    );
  }

  // Sort by date descending
  const sorted = [...playlists].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 16,
        padding: 20,
        borderTop: "0.5px solid var(--card-edge)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 3,
            height: 14,
            borderRadius: 1,
            background:
              "linear-gradient(180deg, rgba(232,67,10,0.6) 0%, rgba(232,67,10,0.15) 100%)",
          }}
        />
        <ListMusic size={14} color="#1DB954" />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.10em",
            color: "var(--ink-tertiary)",
          }}
        >
          Playlist Activity
        </span>
        <InfoPopover text="Real-time Spotify playlist additions and removals. Follower counts show playlist reach." />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            color: "var(--ink-faint)",
            marginLeft: "auto",
          }}
        >
          {sorted.length} events
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {sorted.map((p, i) => {
          const isAdd = p.action === "added";
          return (
            <div
              key={`${p.playlist_id}-${p.date}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 4px",
                borderBottom:
                  i < sorted.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: isAdd
                    ? "rgba(48,209,88,0.12)"
                    : "rgba(255,69,58,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isAdd ? (
                  <Plus size={12} color="#30D158" />
                ) : (
                  <Minus size={12} color="#FF453A" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ink)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.playlist_name}
                </div>
                {p.curator && (
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 11,
                      color: "var(--ink-faint)",
                    }}
                  >
                    by {p.curator}
                  </div>
                )}
              </div>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "var(--ink-secondary)",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {formatNumber(p.followers)} followers
              </span>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  color: "var(--ink-faint)",
                  whiteSpace: "nowrap",
                  minWidth: 50,
                  textAlign: "right",
                }}
              >
                {timeAgo(p.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
