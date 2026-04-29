import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Music,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import SEOHead from "@/components/SEOHead";
import { useSetPageTitle } from "@/contexts/PageTitleContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import IntelligenceTab from "@/components/label/intelligence/IntelligenceTab";
import {
  parsePostingDates,
  calcFrequency,
  getLastPostDate,
} from "@/utils/postingFrequency";
import {
  listSoundAnalyses,
  ListAnalysisEntry,
  formatNumber as formatSINumber,
  timeAgo as siTimeAgo,
} from "@/utils/soundIntelligenceApi";
import InfoTooltip from "@/components/label/intelligence/InfoTooltip";
import { STAT_TOOLTIPS } from "@/lib/statTooltips";

interface Artist {
  id: string;
  artist_name: string;
  artist_handle: string | null;
  avatar_url: string | null;
  tiktok_followers: number | null;
  spotify_popularity: number | null;
  posting_dates: unknown; // JSONB array of date objects
  last_post_date: string | null;
  intelligence_report_html: string | null;
  content_plan_html: string | null;
  content_plan_30d_html: string | null;
  updated_at: string | null;
}

function formatFollowers(n: number | null): string {
  if (!n) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
  return n.toString();
}

function timeAgo(date: string | null): string {
  if (!date) return "—";
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  const d = Math.floor(s / 86400);
  if (d < 7) return d + "d ago";
  if (d < 30) return Math.floor(d / 7) + "w ago";
  return Math.floor(d / 30) + "mo ago";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1 && parts[0].length > 0)
    return parts[0].slice(0, 2).toUpperCase();
  return "??";
}

export default function LabelArtistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { labelId } = useUserProfile();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  useSetPageTitle(artist?.artist_name ?? null);
  const [activeTab, setActiveTab] = useState<
    "intelligence" | "sounds" | "plan" | "plan30"
  >(
    searchParams.get("tab") === "sounds"
      ? "sounds"
      : searchParams.get("tab") === "plan30"
        ? "plan30"
        : searchParams.get("tab") === "plan"
          ? "plan"
          : "intelligence",
  );
  const [iframeHeight, setIframeHeight] = useState(600);
  const [artistSounds, setArtistSounds] = useState<ListAnalysisEntry[]>([]);
  const [soundsLoading, setSoundsLoading] = useState(false);

  const fetchArtistSounds = useCallback(async () => {
    if (!labelId || !artist?.artist_handle) return;
    setSoundsLoading(true);
    try {
      const handle = (artist.artist_handle || "").replace(/^@+/, "");
      const all = await listSoundAnalyses(labelId, { artist_handle: handle });
      setArtistSounds(all);
    } catch {
      // non-critical
    } finally {
      setSoundsLoading(false);
    }
  }, [labelId, artist?.artist_handle]);

  useEffect(() => {
    if (activeTab === "sounds" && artistSounds.length === 0 && !soundsLoading) {
      fetchArtistSounds();
    }
  }, [activeTab, fetchArtistSounds]); // eslint-disable-line

  useEffect(() => {
    if (!id || !labelId) return;
    const fetchArtist = async () => {
      const { data } = await supabase
        .from("artist_intelligence")
        .select("*")
        .eq("id", id)
        .eq("label_id", labelId)
        .single();
      setArtist(data as any);
      setLoading(false);
    };
    fetchArtist();
  }, [id, labelId]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // Only accept messages from srcdoc iframes (origin "null") with valid shape
      if (e.origin !== "null") return;
      if (
        e.data?.type === "iframe-height" &&
        typeof e.data.height === "number"
      ) {
        // Cap at reasonable max to prevent layout breakage
        setIframeHeight(Math.min(e.data.height + 32, 10000));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const getIframeSrc = (html: string | null) => {
    if (!html) return null;
    const resetCss = `<style>
      html, body { margin: 0 !important; padding: 0 !important; overflow-x: hidden; }
      body > * { margin-top: 0 !important; padding-top: 0 !important; }
      body > * > *:first-child { margin-top: 0 !important; padding-top: 0 !important; }
      body > * > * > *:first-child { margin-top: 0 !important; padding-top: 0 !important; }
    </style>`;
    const script = `<script>
      function sendHeight() {
        window.parent.postMessage({ type: 'iframe-height', height: document.body.scrollHeight }, '*');
      }
      window.addEventListener('load', sendHeight);
      new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true });
      setTimeout(sendHeight, 500);
      setTimeout(sendHeight, 1500);
    <\/script>`;
    return resetCss + html + script;
  };

  const currentHtml =
    activeTab === "plan"
      ? artist?.content_plan_html
      : artist?.content_plan_30d_html || (artist as any)?.thirty_day_plan_html;

  if (loading) {
    return (
      <>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "80vh",
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              border: "2.5px solid var(--border)",
              borderTopColor: "var(--accent)",
              borderRadius: "50%",
              animation: "labelSpin 0.8s linear infinite",
            }}
          />
        </div>
      </>
    );
  }

  if (!artist) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 16,
            fontWeight: 500,
            color: "var(--ink)",
          }}
        >
          Artist not found
        </div>
        <button
          onClick={() => navigate("/label")}
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            color: "var(--ink-secondary)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          ← Back to roster
        </button>
      </div>
    );
  }

  const postDates = parsePostingDates(artist.posting_dates);
  const freq30 = calcFrequency(postDates, 30);

  const stats = [
    {
      label: "TIKTOK FOLLOWERS",
      value: formatFollowers(artist.tiktok_followers),
      tooltip: STAT_TOOLTIPS.legacyHeader.tiktokFollowers,
    },
    {
      label: "SPOTIFY SCORE",
      value:
        artist.spotify_popularity !== null
          ? `${artist.spotify_popularity}/100`
          : "—",
      tooltip: STAT_TOOLTIPS.legacyHeader.spotifyScore,
    },
    {
      label: "POST FREQUENCY",
      value: freq30 !== null ? `Every ${Math.round(freq30)}d` : "—",
      tooltip: STAT_TOOLTIPS.legacyHeader.postFrequency,
    },
    {
      label: "LAST POST",
      value: timeAgo(artist.last_post_date || getLastPostDate(postDates)),
      tooltip: STAT_TOOLTIPS.legacyHeader.lastPost,
    },
  ];

  return (
    <>
      <SEOHead
        title={`${artist.artist_name} — Wavebound Label`}
        description={`Intelligence for ${artist.artist_name}`}
      />
      <div style={{ padding: "32px 36px 48px" }}>
        {/* Back */}
        <button
          onClick={() => navigate("/label")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            fontWeight: 500,
            color: "var(--ink-secondary)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            transition: "color 150ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--ink-secondary)")
          }
        >
          <ArrowLeft size={18} />
          Back to roster
        </button>

        {/* Header card */}
        <div
          style={{
            marginTop: 24,
            background: "var(--surface)",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow-sm)",
            padding: 28,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                overflow: "hidden",
                background: "var(--bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: "2px solid var(--border)",
              }}
            >
              {artist.avatar_url ? (
                <img
                  src={artist.avatar_url}
                  alt={artist.artist_name}
                  style={{ width: 64, height: 64, objectFit: "cover" }}
                />
              ) : (
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 22,
                    fontWeight: 600,
                    color: "var(--ink-tertiary)",
                  }}
                >
                  {getInitials(artist.artist_name)}
                </span>
              )}
            </div>
            <div>
              <h1
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: 32,
                  fontWeight: 600,
                  color: "var(--ink)",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {artist.artist_name}
              </h1>
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 14,
                  color: "var(--ink-tertiary)",
                  marginTop: 4,
                }}
              >
                @{(artist.artist_handle || "unknown").replace(/^@+/, "")}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              marginTop: 20,
              borderTop: "1px solid var(--border)",
            }}
          >
            {stats.map((s, i) => (
              <div
                key={s.label}
                style={{
                  padding: "16px 32px",
                  borderRight:
                    i < stats.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    color: "var(--ink-faint)",
                  }}
                >
                  {s.label}
                  {s.tooltip && <InfoTooltip text={s.tooltip} />}
                </div>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 22,
                    fontWeight: 500,
                    color: "var(--ink)",
                    marginTop: 6,
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Updated time */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              float: "right",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12,
              color: "var(--ink-tertiary)",
              marginTop: 12,
            }}
          >
            Report generated {timeAgo(artist.updated_at)}
            {artist.updated_at
              ? ` — ${format(new Date(artist.updated_at), "MMMM d, yyyy")}`
              : ""}
            <InfoTooltip text={STAT_TOOLTIPS.legacyHeader.reportGenerated} />
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 28,
            marginTop: 28,
            borderBottom: "1px solid var(--border)",
          }}
        >
          {[
            { key: "intelligence" as const, label: "Intelligence" },
            { key: "sounds" as const, label: "Sounds" },
            { key: "plan" as const, label: "Content Plan" },
            { key: "plan30" as const, label: "30-Day Plan" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSearchParams(
                  tab.key === "intelligence" ? {} : { tab: tab.key },
                  { replace: true },
                );
                setIframeHeight(600);
              }}
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 15,
                fontWeight: activeTab === tab.key ? 600 : 500,
                color:
                  activeTab === tab.key ? "var(--ink)" : "var(--ink-tertiary)",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === tab.key
                    ? "2.5px solid var(--accent)"
                    : "2.5px solid transparent",
                paddingBottom: 14,
                cursor: "pointer",
                transition: "color 150ms, border-color 150ms",
                borderRadius: "2px 2px 0 0",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ marginTop: 24 }}>
          {activeTab === "intelligence" ? (
            <IntelligenceTab artistName={artist.artist_name} />
          ) : activeTab === "sounds" ? (
            <ArtistSoundsSection
              sounds={artistSounds}
              loading={soundsLoading}
              artistName={artist.artist_name}
              onNavigate={(jobId) =>
                navigate(`/label/sound-intelligence/${jobId}`)
              }
            />
          ) : currentHtml ? (
            <div
              style={{
                borderRadius: "var(--radius)",
                overflow: "hidden",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <iframe
                key={activeTab}
                srcDoc={getIframeSrc(currentHtml) || ""}
                style={{
                  width: "100%",
                  height: iframeHeight,
                  border: "none",
                  minHeight: 400,
                }}
                sandbox="allow-scripts"
                title={activeTab === "plan" ? "Content Plan" : "30-Day Plan"}
              />
            </div>
          ) : (
            <div
              style={{
                border: "2px dashed var(--border)",
                borderRadius: "var(--radius)",
                padding: 80,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 16,
                  color: "var(--ink-tertiary)",
                }}
              >
                {activeTab === "plan"
                  ? "Content plan not yet generated"
                  : "30-day plan not yet generated"}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Velocity status config for sound cards ─── */
const velocityStatusConfig: Record<
  string,
  { label: string; color: string; Icon: typeof TrendingUp }
> = {
  accelerating: { label: "Accelerating", color: "#30D158", Icon: TrendingUp },
  active: { label: "Active", color: "#FF9F0A", Icon: Minus },
  declining: { label: "Declining", color: "#FF453A", Icon: TrendingDown },
};

/* ─── Artist Sounds Section ─── */
function ArtistSoundsSection({
  sounds,
  loading,
  artistName,
  onNavigate,
}: {
  sounds: ListAnalysisEntry[];
  loading: boolean;
  artistName: string;
  onNavigate: (jobId: string) => void;
}) {
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 0",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            border: "2.5px solid var(--border)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "labelSpin 0.8s linear infinite",
          }}
        />
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "var(--ink-tertiary)",
          }}
        >
          Loading tracked sounds...
        </div>
      </div>
    );
  }

  const completed = sounds.filter((s) => s.status === "completed");
  const processing = sounds.filter(
    (s) => s.status !== "completed" && s.status !== "failed",
  );

  if (sounds.length === 0) {
    return (
      <div
        style={{
          border: "2px dashed var(--border)",
          borderRadius: "var(--radius)",
          padding: 80,
          textAlign: "center",
        }}
      >
        <Zap size={40} color="var(--ink-faint)" style={{ marginBottom: 12 }} />
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 16,
            color: "var(--ink-tertiary)",
            marginBottom: 6,
          }}
        >
          No tracked sounds for {artistName}
        </div>
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "var(--ink-faint)",
          }}
        >
          Sounds are automatically tracked when this artist posts new music on
          TikTok.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Processing sounds */}
      {processing.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 8,
          }}
        >
          {processing.map((entry) => (
            <div
              key={entry.job_id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "var(--surface)",
                borderRadius: 12,
                borderTop: "0.5px solid var(--card-edge)",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  border: "2px solid var(--border)",
                  borderTopColor: "var(--accent)",
                  borderRadius: "50%",
                  animation: "labelSpin 0.8s linear infinite",
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 14,
                  color: "var(--ink)",
                }}
              >
                {entry.track_name || "Analyzing..."}
              </div>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "var(--ink-tertiary)",
                  marginLeft: "auto",
                }}
              >
                {entry.status}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed sound cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {completed.map((entry) => {
          const s = entry.summary;
          const vCfg =
            velocityStatusConfig[s?.velocity_status || "active"] ||
            velocityStatusConfig.active;
          const StatusIcon = vCfg.Icon;

          return (
            <div
              key={entry.job_id}
              onClick={() => onNavigate(entry.job_id)}
              style={{
                background: "var(--surface)",
                borderRadius: 16,
                borderTop: "0.5px solid var(--card-edge)",
                padding: 20,
                cursor: "pointer",
                transition: "transform 150ms, box-shadow 150ms",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform =
                  "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "none";
              }}
            >
              {/* Cover + title */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                {entry.cover_url ? (
                  <img
                    src={entry.cover_url}
                    alt={entry.track_name}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      objectFit: "cover",
                      background: "var(--border-subtle)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Music size={18} color="var(--ink-tertiary)" />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--ink)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.track_name || "Unknown Track"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 4,
                    }}
                  >
                    <StatusIcon size={12} color={vCfg.color} />
                    <span
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 11,
                        fontWeight: 600,
                        color: vCfg.color,
                        textTransform: "uppercase",
                      }}
                    >
                      {vCfg.label}
                    </span>
                    <span
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 11,
                        color: "var(--ink-faint)",
                        marginLeft: 4,
                      }}
                    >
                      {siTimeAgo(
                        entry.last_refresh_at ||
                          entry.completed_at ||
                          entry.created_at,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  borderTop: "1px solid var(--border)",
                  paddingTop: 12,
                }}
              >
                <StatCell
                  label="Videos"
                  value={s?.videos_analyzed?.toString() ?? "—"}
                />
                <StatCell
                  label="Views"
                  value={s ? formatSINumber(s.total_views) : "—"}
                />
                <StatCell
                  label="Eng."
                  value={s ? `${s.engagement_rate.toFixed(1)}%` : "—"}
                />
                {s?.winner_format && (
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 10,
                        fontWeight: 600,
                        color: "var(--ink-faint)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: 4,
                      }}
                    >
                      Winner
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Trophy
                        size={11}
                        color="var(--accent)"
                        style={{ flexShrink: 0 }}
                      />
                      <span
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 13,
                          color: "var(--ink-secondary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.winner_format}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 10,
          fontWeight: 600,
          color: "var(--ink-faint)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 15,
          fontWeight: 600,
          color: "var(--ink)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
