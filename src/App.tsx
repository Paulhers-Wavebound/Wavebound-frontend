import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Code-split: heavy pages — only loaded on navigation
const LabelExpansionRadar = lazy(
  () => import("./pages/label/LabelExpansionRadar"),
);
const LabelAssistant = lazy(() => import("./pages/label/LabelAssistant"));
const SoundIntelligenceOverview = lazy(
  () => import("./pages/label/SoundIntelligenceOverview"),
);
const SoundIntelligenceDetail = lazy(
  () => import("./pages/label/SoundIntelligenceDetail"),
);
const SoundComparison = lazy(() => import("./pages/label/SoundComparison"));
const LabelAmplification = lazy(
  () => import("./pages/label/LabelAmplification"),
);
const LabelArtistProfile = lazy(
  () => import("./pages/label/LabelArtistProfile"),
);
const LabelFanBriefs = lazy(() => import("./pages/label/LabelFanBriefs"));
const ContentAssistant = lazy(() => import("./pages/ContentAssistant"));
const TikTokAudit = lazy(() => import("./pages/TikTokAudit"));
const ThePulse = lazy(() => import("./pages/label/ThePulse"));
const ARProspect = lazy(() => import("./pages/label/ARProspect"));
const ARSimulationLab = lazy(() => import("./pages/label/ARSimulationLab"));
const CultureGenome = lazy(() => import("./pages/label/CultureGenome"));
const ArtistDatabase = lazy(() => import("./pages/label/ArtistDatabase"));
const ContentFactory = lazy(() => import("./pages/label/ContentFactory"));
import ErrorBoundary from "@/components/ErrorBoundary";
import { AISidebarProvider } from "@/contexts/AISidebarContext";
import { AnalysisProvider } from "@/contexts/AnalysisContext";
import { DiscoverProvider } from "@/contexts/DiscoverContext";
import { ContentPlanProvider } from "@/contexts/ContentPlanContext";
import { ChatSessionsProvider } from "@/contexts/ChatSessionsContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { DashboardRoleProvider } from "@/contexts/DashboardRoleContext";
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
import ContentPlanPage from "./pages/ContentPlanPage";
import LabelLayout from "./pages/label/LabelLayout";
import LabelDashboard from "./pages/label/LabelDashboard";

import LabelArtistDetailNew from "./pages/label/LabelArtistDetail";
const ArtistIntelligence = lazy(
  () => import("./pages/label/ArtistIntelligence"),
);
import LabelSettings from "./pages/label/LabelSettings";
import LabelHelp from "./pages/label/LabelHelp";
// Ops control panel — lazy-loaded sub-pages
const HealthLayout = lazy(() => import("./pages/label/health/HealthLayout"));
const HealthOverview = lazy(
  () => import("./pages/label/health/HealthOverview"),
);
const HealthServers = lazy(() => import("./pages/label/health/HealthServers"));
const HealthScrapers = lazy(
  () => import("./pages/label/health/HealthScrapers"),
);
const HealthCron = lazy(() => import("./pages/label/health/HealthCron"));
const HealthQuotas = lazy(() => import("./pages/label/health/HealthQuotas"));
const HealthDataPage = lazy(() => import("./pages/label/health/HealthData"));
const HealthPipeline = lazy(
  () => import("./pages/label/health/HealthPipeline"),
);
const HealthIdentity = lazy(
  () => import("./pages/label/health/HealthIdentity"),
);
const HealthInventory = lazy(
  () => import("./pages/label/health/HealthInventory"),
);
const HealthActivity = lazy(
  () => import("./pages/label/health/HealthActivity"),
);
const HealthErrors = lazy(() => import("./pages/label/health/HealthErrors"));
const HealthPerformance = lazy(
  () => import("./pages/label/health/HealthPerformance"),
);
const HealthHandles = lazy(() => import("./pages/label/health/HealthHandles"));
const HealthN8n = lazy(() => import("./pages/label/health/HealthN8n"));
const HealthDatabase = lazy(
  () => import("./pages/label/health/HealthDatabase"),
);
const HealthRosterCoverage = lazy(
  () => import("./pages/label/health/HealthRosterCoverage"),
);
import PreviewGate from "./components/coming-soon/PreviewGate";
import SoundIntelligencePreview from "./pages/label/previews/SoundIntelligencePreview";
import PaidAmplificationPreview from "./pages/label/previews/PaidAmplificationPreview";

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
                    <DashboardRoleProvider>
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
                                    element={
                                      <Suspense fallback={null}>
                                        <TikTokAudit />
                                      </Suspense>
                                    }
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

                                  <Route
                                    path="/my-plans"
                                    element={<MyPlans />}
                                  />
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

                                  <Route
                                    path="/l/:slug"
                                    element={<BioPage />}
                                  />
                                  <Route path="/about" element={<About />} />
                                  <Route path="/blog" element={<Blog />} />
                                  <Route
                                    path="/blog/:slug"
                                    element={<BlogPost />}
                                  />

                                  <Route
                                    path="/chat"
                                    element={
                                      <Suspense fallback={null}>
                                        <ContentAssistant />
                                      </Suspense>
                                    }
                                  />
                                  <Route
                                    path="/content-plan"
                                    element={<ContentPlanPage />}
                                  />
                                  <Route
                                    path="/admin"
                                    element={<AdminLayout />}
                                  >
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
                                    path="/label/admin/pulse"
                                    element={
                                      <Suspense fallback={null}>
                                        <ThePulse />
                                      </Suspense>
                                    }
                                  />
                                  <Route
                                    path="/label"
                                    element={<LabelLayout />}
                                  >
                                    <Route index element={<LabelDashboard />} />
                                    <Route
                                      path="assistant"
                                      element={<LabelAssistant />}
                                    />
                                    <Route
                                      path="sound-intelligence"
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
                                      path="sound-intelligence/compare"
                                      element={
                                        <PreviewGate
                                          featureId="sound-intelligence"
                                          preview={<SoundIntelligencePreview />}
                                        >
                                          <SoundComparison />
                                        </PreviewGate>
                                      }
                                    />
                                    <Route
                                      path="sound-intelligence/:jobId"
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
                                      path="amplification"
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
                                      path="paid-amplification"
                                      element={
                                        <Navigate
                                          to="/label/amplification"
                                          replace
                                        />
                                      }
                                    />
                                    <Route
                                      path="artist/:id"
                                      element={<ArtistIntelligence />}
                                    />
                                    <Route
                                      path="artists/:artistHandle"
                                      element={<LabelArtistProfile />}
                                    />
                                    <Route
                                      path="expansion-radar"
                                      element={<LabelExpansionRadar />}
                                    />
                                    <Route
                                      path="ar/prospect/:id"
                                      element={<ARProspect />}
                                    />
                                    <Route
                                      path="ar/simulation"
                                      element={<ARSimulationLab />}
                                    />
                                    <Route
                                      path="culture-genome"
                                      element={<CultureGenome />}
                                    />
                                    <Route
                                      path="database"
                                      element={<ArtistDatabase />}
                                    />
                                    <Route
                                      path="fan-briefs"
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
                                      path="content-factory"
                                      element={<ContentFactory />}
                                    />
                                    <Route
                                      path="settings"
                                      element={<LabelSettings />}
                                    />
                                    <Route
                                      path="help"
                                      element={<LabelHelp />}
                                    />
                                    <Route
                                      path="admin/health"
                                      element={<HealthLayout />}
                                    >
                                      <Route
                                        index
                                        element={<HealthOverview />}
                                      />
                                      <Route
                                        path="servers"
                                        element={<HealthServers />}
                                      />
                                      <Route
                                        path="scrapers"
                                        element={<HealthScrapers />}
                                      />
                                      <Route
                                        path="cron"
                                        element={<HealthCron />}
                                      />
                                      <Route
                                        path="quotas"
                                        element={<HealthQuotas />}
                                      />
                                      <Route
                                        path="data"
                                        element={<HealthDataPage />}
                                      />
                                      <Route
                                        path="identity"
                                        element={<HealthIdentity />}
                                      />
                                      <Route
                                        path="inventory"
                                        element={<HealthInventory />}
                                      />
                                      <Route
                                        path="pipeline"
                                        element={<HealthPipeline />}
                                      />
                                      <Route
                                        path="activity"
                                        element={<HealthActivity />}
                                      />
                                      <Route
                                        path="errors"
                                        element={<HealthErrors />}
                                      />
                                      <Route
                                        path="performance"
                                        element={<HealthPerformance />}
                                      />
                                      <Route
                                        path="handles"
                                        element={<HealthHandles />}
                                      />
                                      <Route
                                        path="n8n"
                                        element={<HealthN8n />}
                                      />
                                      <Route
                                        path="database"
                                        element={<HealthDatabase />}
                                      />
                                      <Route
                                        path="roster-coverage"
                                        element={<HealthRosterCoverage />}
                                      />
                                    </Route>
                                  </Route>

                                  <Route path="*" element={<NotFound />} />
                                </Routes>
                                <GlobalAISidebar />
                                <DaySelectorDialog />
                              </ChatSessionsProvider>
                            </AISidebarProvider>
                          </ContentPlanProvider>
                        </DiscoverProvider>
                      </AnalysisProvider>
                    </DashboardRoleProvider>
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
