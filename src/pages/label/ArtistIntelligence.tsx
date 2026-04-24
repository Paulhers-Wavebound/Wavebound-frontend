import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { useSetPageTitle } from "@/contexts/PageTitleContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useArtistBriefing } from "@/hooks/useArtistBriefing";
import { useDashboardRole } from "@/contexts/DashboardRoleContext";
import ContentIntelligenceView from "@/components/label/intelligence/ContentIntelligenceView";

// New briefing components
import ArtistHeader from "@/components/label/briefing/ArtistHeader";
import AIFocus from "@/components/label/briefing/AIFocus";
import type { WeeklyPulse } from "@/components/label/briefing/AIFocus";
import CatalogPulse from "@/components/label/briefing/CatalogPulse";
import TopOpportunities from "@/components/label/briefing/TopOpportunities";
import ContextPanel from "@/components/label/briefing/ContextPanel";
import BottomBar from "@/components/label/briefing/BottomBar";

// Legacy components (classic view)
import BriefingHero from "@/components/label/briefing/BriefingHero";
import SignalMap from "@/components/label/briefing/SignalMap";
import OpportunityEngine from "@/components/label/briefing/OpportunityEngine";
import CompetitiveLens from "@/components/label/briefing/CompetitiveLens";
import Outlook from "@/components/label/briefing/Outlook";
import IntelligenceTab from "@/components/label/intelligence/IntelligenceTab";

interface ArtistMeta {
  id: string;
  artist_name: string;
  artist_handle: string | null;
  avatar_url: string | null;
  weekly_pulse: WeeklyPulse | null;
  weekly_pulse_generated_at: string | null;
}

export default function ArtistIntelligencePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { labelId } = useUserProfile();
  const { role } = useDashboardRole();

  // Fetch artist metadata + weekly_pulse from artist_intelligence table
  const [meta, setMeta] = useState<ArtistMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  useSetPageTitle(meta?.artist_name ?? null);

  useEffect(() => {
    if (!id || !labelId) return;
    (async () => {
      const { data } = await supabase
        .from("artist_intelligence")
        .select(
          "id, artist_name, artist_handle, avatar_url, weekly_pulse, weekly_pulse_generated_at",
        )
        .eq("id", id)
        .eq("label_id", labelId)
        .single();
      setMeta(
        data
          ? {
              ...(data as Omit<ArtistMeta, "weekly_pulse">),
              weekly_pulse: data.weekly_pulse as WeeklyPulse | null,
            }
          : null,
      );
      setMetaLoading(false);
    })();
  }, [id, labelId]);

  // V2 briefing data (loads once we have artist name)
  const {
    entityId,
    briefing,
    rosterScores,
    isLoading: briefingLoading,
    error: briefingError,
    noEntity,
  } = useArtistBriefing(meta?.artist_name ?? null, labelId);

  // View toggle: briefing (new) vs classic (old)
  const [view, setView] = useState<"briefing" | "classic">("briefing");

  // ─── Loading ─────────────────────────────────────────────────────
  if (metaLoading) {
    return (
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
            border: "2.5px solid rgba(255,255,255,0.06)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "labelSpin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  // ─── Not Found ───────────────────────────────────────────────────
  if (!meta) {
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
            color: "rgba(255,255,255,0.87)",
          }}
        >
          Artist not found
        </div>
        <button
          onClick={() => navigate("/label")}
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            color: "rgba(255,255,255,0.55)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          {"\u2190"} Back to roster
        </button>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${meta.artist_name} — Intelligence`}
        description={`Intelligence briefing for ${meta.artist_name}`}
      />
      <div
        style={{ padding: "24px 32px 64px", maxWidth: 1100, margin: "0 auto" }}
      >
        {/* ─── Top bar: back + view toggle ─── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => navigate("/label")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 14,
              fontWeight: 500,
              color: "rgba(255,255,255,0.55)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "color 150ms",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "rgba(255,255,255,0.87)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "rgba(255,255,255,0.55)")
            }
          >
            <ArrowLeft size={18} />
            Back to roster
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {role === "marketing" && (
              <div
                style={{
                  display: "flex",
                  gap: 2,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 8,
                  padding: 2,
                }}
              >
                {(["briefing", "classic"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 12,
                      fontWeight: view === v ? 600 : 400,
                      color:
                        view === v
                          ? "rgba(255,255,255,0.87)"
                          : "rgba(255,255,255,0.35)",
                      background:
                        view === v ? "rgba(255,255,255,0.08)" : "transparent",
                      border: "none",
                      borderRadius: 6,
                      padding: "5px 14px",
                      cursor: "pointer",
                      transition: "all 150ms",
                    }}
                  >
                    {v === "briefing" ? "Intelligence" : "Classic"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Content role ─── */}
        {role === "content" && (
          <ContentIntelligenceView
            entityId={entityId ?? null}
            artistHandle={meta.artist_handle}
          />
        )}

        {/* ─── Marketing: Classic view (legacy) ─── */}
        {role === "marketing" && view === "classic" && (
          <>
            {briefingLoading && (
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
                    border: "2.5px solid rgba(255,255,255,0.06)",
                    borderTopColor: "var(--accent)",
                    borderRadius: "50%",
                    animation: "labelSpin 0.8s linear infinite",
                  }}
                />
              </div>
            )}
            {briefing && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                }}
              >
                <BriefingHero data={briefing} />
                <SignalMap data={briefing} />
                <OpportunityEngine data={briefing} />
                <CompetitiveLens
                  card={briefing.artistCard}
                  rosterScores={rosterScores}
                />
                <Outlook data={briefing} />
              </div>
            )}
            {noEntity && !briefingLoading && (
              <IntelligenceTab artistName={meta.artist_name} />
            )}
          </>
        )}

        {/* ─── Marketing: New Intelligence View ─── */}
        {role === "marketing" && view === "briefing" && (
          <>
            {/* Loading */}
            {briefingLoading && (
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
                    border: "2.5px solid rgba(255,255,255,0.06)",
                    borderTopColor: "var(--accent)",
                    borderRadius: "50%",
                    animation: "labelSpin 0.8s linear infinite",
                  }}
                />
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  Loading intelligence...
                </div>
              </div>
            )}

            {/* No entity */}
            {noEntity && !briefingLoading && (
              <div
                style={{
                  border: "2px dashed rgba(255,255,255,0.06)",
                  borderRadius: 16,
                  padding: 80,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 16,
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  Intelligence not yet available
                </div>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    color: "rgba(255,255,255,0.25)",
                    marginTop: 8,
                  }}
                >
                  This artist hasn't been linked in the pipeline yet. Try
                  Classic view.
                </div>
              </div>
            )}

            {/* Error */}
            {briefingError && !briefingLoading && (
              <div
                style={{
                  border: "2px dashed rgba(255,255,255,0.06)",
                  borderRadius: 16,
                  padding: 80,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 16,
                    color: "#FF453A",
                  }}
                >
                  Failed to load intelligence
                </div>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    color: "rgba(255,255,255,0.35)",
                    marginTop: 8,
                  }}
                >
                  {briefingError instanceof Error
                    ? briefingError.message
                    : "Unknown error"}
                </div>
              </div>
            )}

            {/* ─── THE NEW LAYOUT ─── */}
            {briefing && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {/* 1. Compact Artist Header */}
                <ArtistHeader
                  card={briefing.artistCard}
                  songsCount={briefing.songs.length}
                />

                {/* 2. AI Focus (the star of the show) */}
                <AIFocus
                  pulse={meta.weekly_pulse}
                  generatedAt={meta.weekly_pulse_generated_at}
                />

                {/* 3. Two-column layout */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 340px",
                    gap: 16,
                    alignItems: "start",
                  }}
                >
                  {/* Left: What's Happening */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      minWidth: 0,
                    }}
                  >
                    <CatalogPulse songs={briefing.songs} />
                    <TopOpportunities data={briefing} />
                  </div>

                  {/* Right: Context */}
                  <ContextPanel
                    card={briefing.artistCard}
                    data={briefing}
                    rosterScores={rosterScores}
                  />
                </div>

                {/* 4. Bottom Bar */}
                <BottomBar data={briefing} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Responsive override: stack columns on narrow screens */}
      <style>{`
        @media (max-width: 800px) {
          [style*="gridTemplateColumns: 1fr 340px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
