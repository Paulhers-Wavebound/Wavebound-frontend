import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LabelLayout from "./LabelLayout";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import SEOHead from "@/components/SEOHead";
import {
  parsePostingDates,
  calcFrequency,
  getLastPostDate,
} from "@/utils/postingFrequency";

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
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function LabelArtistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"report" | "plan" | "plan30">(
    searchParams.get("tab") === "plan30"
      ? "plan30"
      : searchParams.get("tab") === "plan"
        ? "plan"
        : "report",
  );
  const [iframeHeight, setIframeHeight] = useState(600);

  useEffect(() => {
    if (!id) return;
    const fetchArtist = async () => {
      const { data } = await supabase
        .from("artist_intelligence" as any)
        .select("*")
        .eq("id", id)
        .single();
      setArtist(data as any);
      setLoading(false);
    };
    fetchArtist();
  }, [id]);

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
    activeTab === "report"
      ? artist?.intelligence_report_html
      : activeTab === "plan"
        ? artist?.content_plan_html
        : artist?.content_plan_30d_html ||
          (artist as any)?.thirty_day_plan_html;

  if (loading) {
    return (
      <LabelLayout>
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
        <style>{`@keyframes labelSpin { to { transform: rotate(360deg); } }`}</style>
      </LabelLayout>
    );
  }

  if (!artist) {
    return (
      <LabelLayout>
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
      </LabelLayout>
    );
  }

  const postDates = parsePostingDates(artist.posting_dates);
  const freq30 = calcFrequency(postDates, 30);

  const stats = [
    {
      label: "TIKTOK FOLLOWERS",
      value: formatFollowers(artist.tiktok_followers),
    },
    {
      label: "SPOTIFY SCORE",
      value:
        artist.spotify_popularity !== null
          ? `${artist.spotify_popularity}/100`
          : "—",
    },
    {
      label: "POST FREQUENCY",
      value: freq30 !== null ? `Every ${Math.round(freq30)}d` : "—",
    },
    {
      label: "LAST POST",
      value: timeAgo(artist.last_post_date || getLastPostDate(postDates)),
    },
  ];

  return (
    <LabelLayout>
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
                @{artist.artist_handle || "unknown"}
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
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    color: "var(--ink-faint)",
                  }}
                >
                  {s.label}
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
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12,
              color: "var(--ink-tertiary)",
              marginTop: 12,
              textAlign: "right",
            }}
          >
            Report generated {timeAgo(artist.updated_at)}
            {artist.updated_at
              ? ` — ${format(new Date(artist.updated_at), "MMMM d, yyyy")}`
              : ""}
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
            { key: "report" as const, label: "Intelligence Report" },
            { key: "plan" as const, label: "Content Plan" },
            { key: "plan30" as const, label: "30-Day Plan" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
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
          {currentHtml ? (
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
                title={
                  activeTab === "report"
                    ? "Intelligence Report"
                    : "Content Plan"
                }
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
                {activeTab === "report"
                  ? "Report not yet generated"
                  : activeTab === "plan"
                    ? "Content plan not yet generated"
                    : "30-day plan not yet generated"}
              </div>
            </div>
          )}
        </div>
      </div>
    </LabelLayout>
  );
}
