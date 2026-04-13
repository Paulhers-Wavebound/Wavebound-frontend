/**
 * A&R Prospect Drill-Down Page
 *
 * Route: /label/ar/prospect/:id
 * Composes: ProspectBanner + SignabilityScorecard + ProspectDeepDiveTabs + AgentActionsBar
 */
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useSetPageTitle } from "@/contexts/PageTitleContext";
import { useARProspectDetail } from "@/hooks/useARData";
import ProspectBanner from "@/components/label/ar/ProspectBanner";
import SignabilityScorecard from "@/components/label/ar/SignabilityScorecard";
import ProspectDeepDiveTabs from "@/components/label/ar/ProspectDeepDiveTabs";
import AgentActionsBar from "@/components/label/ar/AgentActionsBar";

export default function ARProspect() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useARProspectDetail(id);
  const prospect = data?.prospect;
  useSetPageTitle(prospect?.artist_name ?? null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2
          size={24}
          className="animate-spin"
          style={{ color: "rgba(255,255,255,0.30)" }}
        />
      </div>
    );
  }

  if (error || !prospect) {
    return (
      <div className="p-10 text-center">
        <p className="text-[15px] text-white/40 mb-4">Prospect not found.</p>
        <button
          onClick={() => navigate("/label")}
          className="text-[13px] text-[#e8430a] hover:underline"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6 pb-24">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[12px] text-white/40 hover:text-white/60 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to pipeline
      </motion.button>

      {/* Banner */}
      <ProspectBanner
        prospect={prospect}
        platforms={data?.platforms}
        recentVideos={data?.recent_videos}
        source={data?.source}
      />

      {/* Signability Scorecard */}
      <SignabilityScorecard signability={prospect.signability} />

      {/* Deep Dive Tabs */}
      <ProspectDeepDiveTabs
        prospect={prospect}
        recentVideos={data?.recent_videos}
      />

      {/* Agent Actions Bar */}
      <AgentActionsBar />
    </div>
  );
}
