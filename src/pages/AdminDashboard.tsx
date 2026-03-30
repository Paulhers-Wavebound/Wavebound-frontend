import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';
import { AdminStatsProvider, useAdminStatsRefresh } from '@/components/admin/AdminStatsProvider';
import { AdminOverviewCards } from '@/components/admin/AdminOverviewCards';
import { AdminSignupGrowth } from '@/components/admin/AdminSignupGrowth';
import { AdminUserBreakdown } from '@/components/admin/AdminUserBreakdown';
import { AdminActivationFunnel } from '@/components/admin/AdminActivationFunnel';
import { AdminRetentionCohorts } from '@/components/admin/AdminRetentionCohorts';
import { AdminTopUsers } from '@/components/admin/AdminTopUsers';
import { AdminPowerUsers } from '@/components/admin/AdminPowerUsers';
import { AdminActivityFeed } from '@/components/admin/AdminActivityFeed';
import { AdminDailyUsage } from '@/components/admin/AdminDailyUsage';
import { AdminPdfExport } from '@/components/admin/AdminPdfExport';
import { AdminActiveUsers } from '@/components/admin/AdminActiveUsers';
import { AdminLabelsTab } from '@/components/admin/AdminLabelsTab';
import { AdminArtistsTab } from '@/components/admin/AdminArtistsTab';
import { AdminPipelineTab } from '@/components/admin/AdminPipelineTab';
import { AdminPlanReviewTab } from '@/components/admin/AdminPlanReviewTab';

function AnalyticsHeader() {
  const { refresh } = useAdminStatsRefresh();
  return (
    <div className="flex items-center justify-end gap-2 mb-4">
      <AdminPdfExport />
      <Button variant="outline" size="sm" className="shadow-sm" onClick={refresh}>
        <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
      </Button>
    </div>
  );
}

function AnalyticsContent() {
  return (
    <AdminStatsProvider>
      <AnalyticsHeader />
      <div className="space-y-6">
        <div data-pdf-section="Key Metrics"><AdminOverviewCards /></div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div data-pdf-section="Active Now" className="lg:col-span-2"><AdminActiveUsers /></div>
          <div data-pdf-section="Signup Growth" className="lg:col-span-3"><AdminSignupGrowth /></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div data-pdf-section="Activation Funnel"><AdminActivationFunnel /></div>
          <div data-pdf-section="User Breakdown"><AdminUserBreakdown /></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div data-pdf-section="Daily Usage"><AdminDailyUsage /></div>
          <div data-pdf-section="Activity Feed"><AdminActivityFeed /></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div data-pdf-section="Retention Cohorts"><AdminRetentionCohorts /></div>
          <div data-pdf-section="Power Users"><AdminPowerUsers /></div>
        </div>
        <div data-pdf-section="Top 50 Users"><AdminTopUsers /></div>
      </div>
    </AdminStatsProvider>
  );
}

export default function AdminDashboard() {
  const { isAdmin, loading } = useAdminRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [isAdmin, loading, navigate]);

  if (loading || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-primary/40" />
          <h1 className="text-xl font-bold text-foreground tracking-tight">Admin Dashboard</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="labels">Labels</TabsTrigger>
            <TabsTrigger value="artists">Artists</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="reviews">Plan Review</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics"><AnalyticsContent /></TabsContent>
          <TabsContent value="labels"><AdminLabelsTab /></TabsContent>
          <TabsContent value="artists"><AdminArtistsTab /></TabsContent>
          <TabsContent value="pipeline"><AdminPipelineTab /></TabsContent>
          <TabsContent value="reviews"><AdminPlanReviewTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
