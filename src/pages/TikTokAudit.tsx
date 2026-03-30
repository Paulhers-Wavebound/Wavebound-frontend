import { useParams } from "react-router-dom";
import HeaderAuth from "@/components/HeaderAuth";
import FooterSection from "@/components/FooterSection";
import SEOHead from "@/components/SEOHead";
import TikTokAuditDashboard from "@/components/TikTokAuditDashboard";
const TikTokAudit = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const numericJobId = jobId ? Number(jobId) : undefined;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SEOHead 
        title="Profile Analysis Results - Wavebound"
        description="View your TikTok profile analysis results. Explore video performance, content styles, and actionable insights."
      />
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-primary/5 to-accent/10 animate-gradient" />
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJoc2woMTgwIDMwJSA1MCUgLyAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

      <div className="relative z-10">
        <HeaderAuth variant="light" />

        <main className="container mx-auto px-4 pt-24 pb-16 max-w-[1600px]">
          <header className="mb-10 space-y-3">
            <p className="text-sm font-medium text-primary/80 tracking-wide uppercase">
              TikTok Profile Analysis
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
              Analysis Results
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              We&apos;re pulling in your analyzed videos in real time. New videos will appear here as soon as
              they finish processing.
            </p>
          </header>

          {numericJobId ? (
            <TikTokAuditDashboard jobId={numericJobId} />
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                No job selected. Go back and analyze a profile to see its audit.
              </p>
            </div>
          )}
        </main>
        <FooterSection />
      </div>
    </div>
  );
};

export default TikTokAudit;
