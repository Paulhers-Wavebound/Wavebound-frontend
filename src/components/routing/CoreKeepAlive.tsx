import { useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import Discover from "@/pages/Discover";
import Create from "@/pages/Create";
import NewWorkspace from "@/pages/NewWorkspace";
import AnalyzeAudioWorkspace from "@/pages/AnalyzeAudioWorkspace";
import AnalyzeVideoWorkspace from "@/pages/AnalyzeVideoWorkspace";
import FavoritePlanWorkspace from "@/pages/FavoritePlanWorkspace";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { stopAllMedia } from "@/utils/mediaEvents";

type ActivePage = "discover" | "create" | "workspace" | "analyze-audio" | "analyze-video" | "analyze-favorite" | null;

const getActivePage = (pathname: string): ActivePage => {
  if (pathname.startsWith("/analyze-audio/")) return "analyze-audio";
  if (pathname.startsWith("/analyze-video/")) return "analyze-video";
  if (pathname.startsWith("/analyze-favorite/")) return "analyze-favorite";
  if (pathname.startsWith("/discover")) return "discover";
  if (pathname.startsWith("/create")) return "create";
  if (pathname.startsWith("/workspace")) return "workspace";
  return null;
};

/**
 * Keeps core "workflow" pages mounted so state + loaded content doesn't reset
 * when navigating between features.
 */
export default function CoreKeepAlive() {
  const location = useLocation();
  const { activeAnalysis, hasActiveAnalysis } = useAnalysis();
  
  const active = getActivePage(location.pathname);
  const prevActiveRef = useRef(active);

  // Track which pages have been visited at least once (lazy keep-alive)
  const visitedRef = useRef<Set<string>>(new Set());
  if (active) visitedRef.current.add(active);

  // Stop all media when navigating between keep-alive pages
  useEffect(() => {
    if (prevActiveRef.current !== active) {
      stopAllMedia();
      prevActiveRef.current = active;
    }
  }, [active]);

  // Audio analysis
  const analyzeAudioMatch = location.pathname.match(/^\/analyze-audio\/([^/?]+)/);
  const currentAudioId = analyzeAudioMatch?.[1];
  const audioIdToRender = currentAudioId || (activeAnalysis?.type === 'audio' ? activeAnalysis?.id : undefined);
  const shouldRenderAudioAnalysis = active === "analyze-audio" || (hasActiveAnalysis && activeAnalysis?.type === 'audio');

  // Video analysis
  const analyzeVideoMatch = location.pathname.match(/^\/analyze-video\/([^/?]+)/);
  const currentVideoId = analyzeVideoMatch?.[1];
  const videoIdToRender = currentVideoId || (activeAnalysis?.type === 'video' ? activeAnalysis?.id : undefined);
  const shouldRenderVideoAnalysis = active === "analyze-video" || (hasActiveAnalysis && activeAnalysis?.type === 'video');

  // Favorite plan
  const analyzeFavoriteMatch = location.pathname.match(/^\/analyze-favorite\/([^/?]+)/);
  const currentFavoriteId = analyzeFavoriteMatch?.[1];

  return (
    <>
      {visitedRef.current.has("discover") && (
        <div style={{ display: active === "discover" ? "block" : "none" }}>
          <Discover />
        </div>
      )}
      {visitedRef.current.has("create") && (
        <div style={{ display: active === "create" ? "block" : "none" }}>
          <Create />
        </div>
      )}
      {visitedRef.current.has("workspace") && (
        <div style={{ display: active === "workspace" ? "block" : "none" }}>
          <NewWorkspace />
        </div>
      )}
      {shouldRenderAudioAnalysis && audioIdToRender && (
        <div style={{ display: active === "analyze-audio" ? "block" : "none" }}>
          <AnalyzeAudioWorkspace 
            audioIdProp={audioIdToRender} 
            isHidden={active !== "analyze-audio"} 
          />
        </div>
      )}
      {shouldRenderVideoAnalysis && videoIdToRender && (
        <div style={{ display: active === "analyze-video" ? "block" : "none" }}>
          <AnalyzeVideoWorkspace 
            videoIdProp={videoIdToRender} 
            isHidden={active !== "analyze-video"} 
          />
        </div>
      )}
      {currentFavoriteId && (
        <div style={{ display: active === "analyze-favorite" ? "block" : "none" }}>
          <FavoritePlanWorkspace 
            videoIdProp={currentFavoriteId} 
            isHidden={active !== "analyze-favorite"} 
          />
        </div>
      )}
    </>
  );
}