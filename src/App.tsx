import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Code-split: heavy page with Three.js — only loaded on navigation
const LabelExpansionRadar = lazy(
  () => import("./pages/label/LabelExpansionRadar"),
);
import ErrorBoundary from "@/components/ErrorBoundary";
import { AISidebarProvider } from "@/contexts/AISidebarContext";
import { AnalysisProvider } from "@/contexts/AnalysisContext";
import { DiscoverProvider } from "@/contexts/DiscoverContext";
import { ContentPlanProvider } from "@/contexts/ContentPlanContext";
import { ChatSessionsProvider } from "@/contexts/ChatSessionsContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { GlobalAISidebar } from "@/components/layout/GlobalAISidebar";
import { DaySelectorDialog } from "@/components/DaySelectorDialog";
import { AuthGate } from "@/components/AuthGate";

// Public pages
import LabelAuth from "./pages/label/LabelAuth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Support from "./pages/Support";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

// Private pages
import Auth from "./pages/Auth";
import TikTokAudit from "./pages/TikTokAudit";
import MyAnalyses from "./pages/MyAnalyses";
import MyPage from "./pages/MyPage";
import Favorites from "./pages/Favorites";
import MyPlans from "./pages/MyPlans";
import PlanWorkspace from "./pages/PlanWorkspace";
import SharedNotes from "./pages/SharedNotes";
import SharedPlan from "./pages/SharedPlan";

import BioPage from "./pages/BioPage";
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";

import AdminLayout from "./components/admin/AdminLayout";
import { AdminPlanReviewTab } from "./components/admin/AdminPlanReviewTab";
import AdminEditTab from "./components/admin/AdminEditTab";
import AdminOnboarding from "./pages/admin/AdminOnboarding";
import { AdminArtistsTab } from "./components/admin/AdminArtistsTab";
import { AdminLabelsTab } from "./components/admin/AdminLabelsTab";
import ContentAssistant from "./pages/ContentAssistant";
import ContentPlanPage from "./pages/ContentPlanPage";
import LabelDashboard from "./pages/label/LabelDashboard";

import LabelArtistDetailNew from "./pages/label/LabelArtistDetail";
import LabelArtistProfile from "./pages/label/LabelArtistProfile";
import SoundIntelligenceOverview from "./pages/label/SoundIntelligenceOverview";
import SoundIntelligenceDetail from "./pages/label/SoundIntelligenceDetail";
import LabelAmplification from "./pages/label/LabelAmplification";
import LabelSettings from "./pages/label/LabelSettings";
import LabelHelp from "./pages/label/LabelHelp";
import LabelFanBriefs from "./pages/label/LabelFanBriefs";
import PreviewGate from "./components/coming-soon/PreviewGate";
import SoundIntelligencePreview from "./pages/label/previews/SoundIntelligencePreview";
import PaidAmplificationPreview from "./pages/label/previews/PaidAmplificationPreview";
import ExpansionRadarPreview from "./pages/label/previews/ExpansionRadarPreview";
import FanBriefsPreview from "./pages/label/previews/FanBriefsPreview";
import { OfflineDetector } from "./components/OfflineDetector";
import CoreKeepAlive from "@/components/routing/CoreKeepAlive";

const App = () => {
  // rebuilt
  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={100} skipDelayDuration={0}>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes — no auth required */}
            <Route path="/login" element={<LabelAuth />} />
            <Route path="/join/:inviteCode" element={<LabelAuth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/support" element={<Support />} />
            <Route path="/terms" element={<Terms />} />

            {/* All other routes — auth required */}
            <Route
              path="*"
              element={
                <AuthGate>
                  <UserProfileProvider>
                    <AnalysisProvider>
                      <DiscoverProvider>
                        <ContentPlanProvider>
                          <AISidebarProvider>
                            <ChatSessionsProvider>
                              <OfflineDetector />
                              <CoreKeepAlive />
                              <Routes>
                                <Route
                                  path="/"
                                  element={<Navigate to="/label" replace />}
                                />
                                <Route path="/discover" element={null} />
                                <Route path="/workspace" element={null} />
                                <Route path="/create" element={null} />
                                <Route
                                  path="/analyze-audio/:audioId"
                                  element={null}
                                />
                                <Route
                                  path="/analyze-video/:videoId"
                                  element={null}
                                />
                                <Route
                                  path="/analyze-favorite/:videoId"
                                  element={null}
                                />

                                <Route
                                  path="/tiktok-audit/:jobId"
                                  element={<TikTokAudit />}
                                />
                                <Route
                                  path="/my-analyses"
                                  element={<MyAnalyses />}
                                />

                                <Route
                                  path="/plan"
                                  element={
                                    <Navigate to="/content-plan" replace />
                                  }
                                />
                                <Route path="/me" element={<MyPage />} />
                                <Route
                                  path="/favorites"
                                  element={<Favorites />}
                                />

                                <Route path="/my-plans" element={<MyPlans />} />
                                <Route
                                  path="/my-plans/:planId"
                                  element={<PlanWorkspace />}
                                />
                                <Route
                                  path="/share/:shareId"
                                  element={<SharedNotes />}
                                />
                                <Route
                                  path="/shared-plan/:shareId"
                                  element={<SharedPlan />}
                                />

                                <Route path="/l/:slug" element={<BioPage />} />
                                <Route path="/about" element={<About />} />
                                <Route path="/blog" element={<Blog />} />
                                <Route
                                  path="/blog/:slug"
                                  element={<BlogPost />}
                                />

                                <Route
                                  path="/chat"
                                  element={<ContentAssistant />}
                                />
                                <Route
                                  path="/content-plan"
                                  element={<ContentPlanPage />}
                                />
                                <Route path="/admin" element={<AdminLayout />}>
                                  <Route
                                    index
                                    element={
                                      <Navigate
                                        to="/admin/onboarding"
                                        replace
                                      />
                                    }
                                  />
                                  <Route
                                    path="onboarding"
                                    element={<AdminOnboarding />}
                                  />
                                  <Route
                                    path="plans"
                                    element={<AdminPlanReviewTab />}
                                  />
                                  <Route
                                    path="edit"
                                    element={<AdminEditTab />}
                                  />
                                  <Route
                                    path="artists"
                                    element={<AdminArtistsTab />}
                                  />
                                  <Route
                                    path="labels"
                                    element={<AdminLabelsTab />}
                                  />
                                </Route>
                                <Route
                                  path="/label"
                                  element={<LabelDashboard />}
                                />

                                <Route
                                  path="/label/sound-intelligence"
                                  element={
                                    <PreviewGate
                                      featureId="sound-intelligence"
                                      preview={<SoundIntelligencePreview />}
                                    >
                                      <SoundIntelligenceOverview />
                                    </PreviewGate>
                                  }
                                />
                                <Route
                                  path="/label/sound-intelligence/:jobId"
                                  element={
                                    <PreviewGate
                                      featureId="sound-intelligence"
                                      preview={<SoundIntelligencePreview />}
                                    >
                                      <SoundIntelligenceDetail />
                                    </PreviewGate>
                                  }
                                />
                                <Route
                                  path="/label/amplification"
                                  element={
                                    <PreviewGate
                                      featureId="paid-amplification"
                                      preview={<PaidAmplificationPreview />}
                                    >
                                      <LabelAmplification />
                                    </PreviewGate>
                                  }
                                />
                                <Route
                                  path="/label/artist/:id"
                                  element={<LabelArtistDetailNew />}
                                />
                                <Route
                                  path="/label/artists/:artistHandle"
                                  element={<LabelArtistProfile />}
                                />
                                <Route
                                  path="/label/expansion-radar"
                                  element={
                                    <PreviewGate
                                      featureId="expansion-radar"
                                      preview={<ExpansionRadarPreview />}
                                    >
                                      <Suspense fallback={null}>
                                        <LabelExpansionRadar />
                                      </Suspense>
                                    </PreviewGate>
                                  }
                                />
                                <Route
                                  path="/label/fan-briefs"
                                  element={
                                    <PreviewGate
                                      featureId="fan-briefs"
                                      preview={<FanBriefsPreview />}
                                    >
                                      <LabelFanBriefs />
                                    </PreviewGate>
                                  }
                                />
                                <Route
                                  path="/label/settings"
                                  element={<LabelSettings />}
                                />
                                <Route
                                  path="/label/help"
                                  element={<LabelHelp />}
                                />

                                <Route path="*" element={<NotFound />} />
                              </Routes>
                              <GlobalAISidebar />
                              <DaySelectorDialog />
                            </ChatSessionsProvider>
                          </AISidebarProvider>
                        </ContentPlanProvider>
                      </DiscoverProvider>
                    </AnalysisProvider>
                  </UserProfileProvider>
                </AuthGate>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  );
};

export default App;
