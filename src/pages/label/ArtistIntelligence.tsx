import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { useSetPageTitle } from "@/contexts/PageTitleContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useArtistBriefing } from "@/hooks/useArtistBriefing";
import BriefingHero from "@/components/label/briefing/BriefingHero";
import SignalMap from "@/components/label/briefing/SignalMap";
import OpportunityEngine from "@/components/label/briefing/OpportunityEngine";
import CompetitiveLens from "@/components/label/briefing/CompetitiveLens";
import Outlook from "@/components/label/briefing/Outlook";
import RoleSelector from "@/components/label/RoleSelector";
import { useDashboardRole } from "@/contexts/DashboardRoleContext";
import ContentIntelligenceView from "@/components/label/intelligence/ContentIntelligenceView";

// Also keep legacy tabs available via a toggle
import IntelligenceTab from "@/components/label/intelligence/IntelligenceTab";

interface ArtistMeta {
  id: string;
  artist_name: string;
  artist_handle: string | null;
  avatar_url: string | null;
}

export default function ArtistIntelligencePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { labelId } = useUserProfile();
  const { role } = useDashboardRole();

  // Fetch basic artist metadata from artist_intelligence table
  const [meta, setMeta] = useState<ArtistMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  useSetPageTitle(meta?.artist_name ?? null);

  useEffect(() => {
    if (!id || !labelId) return;
    (async () => {
      const { data } = await supabase
        .from("artist_intelligence")
        .select("id, artist_name, artist_handle, avatar_url")
        .eq("id", id)
        .eq("label_id", labelId)
        .single();
      setMeta(data as ArtistMeta | null);
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

  // View toggle: briefing (new V2) vs classic (old intelligence tab)
  const [view, setView] = useState<"briefing" | "classic">("briefing");

  // ─── Loading ─────────────────────────────────────────────────────
  if (metaLoading) {
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
              border: "2.5px solid rgba(255,255,255,0.06)",
              borderTopColor: "var(--accent)",
              borderRadius: "50%",
              animation: "labelSpin 0.8s linear infinite",
            }}
          />
        </div>
      </>
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
        title={`${meta.artist_name} — Intelligence Briefing`}
        description={`Intelligence briefing for ${meta.artist_name}`}
      />
      <div
        style={{ padding: "28px 32px 64px", maxWidth: 1100, margin: "0 auto" }}
      >
        {/* ─── Top bar: back + view toggle ─── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
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
            <RoleSelector />
            {/* View toggle — only shown for marketing role */}
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
                      textTransform: "capitalize",
                    }}
                  >
                    {v === "briefing"
                      ? "Intelligence Briefing"
                      : "Classic View"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Content role: Content Intelligence View ─── */}
        {role === "content" && (
          <ContentIntelligenceView
            entityId={entityId ?? null}
            artistHandle={meta.artist_handle}
          />
        )}

        {/* ─── Marketing role: Classic view (legacy) ─── */}
        {role === "marketing" && view === "classic" && (
          <IntelligenceTab artistName={meta.artist_name} />
        )}

        {/* ─── Marketing role: Briefing view (V2) ─── */}
        {role === "marketing" && view === "briefing" && (
          <>
            {/* Loading state for briefing */}
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
                  Assembling intelligence briefing...
                </div>
              </div>
            )}

            {/* No entity in intelligence pipeline */}
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
                  Intelligence briefing not yet available
                </div>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    color: "rgba(255,255,255,0.25)",
                    marginTop: 8,
                  }}
                >
                  This artist hasn't been linked in the intelligence pipeline
                  yet. Try the Classic View for available data.
                </div>
              </div>
            )}

            {/* Error state */}
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
                  Failed to load briefing
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

            {/* ─── THE BRIEFING ─── */}
            {briefing && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                }}
              >
                {/* Section 1: The Briefing Hero */}
                <BriefingHero data={briefing} />

                {/* Section 2: Signal Map */}
                <SignalMap data={briefing} />

                {/* Section 3: Opportunity Engine */}
                <OpportunityEngine data={briefing} />

                {/* Section 4: Competitive Lens */}
                <CompetitiveLens
                  card={briefing.artistCard}
                  rosterScores={rosterScores}
                />

                {/* Section 5: Outlook + Bottom Line */}
                <Outlook data={briefing} />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
