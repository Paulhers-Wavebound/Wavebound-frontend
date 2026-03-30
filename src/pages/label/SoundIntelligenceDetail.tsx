import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LabelLayout from '@/pages/label/LabelLayout';
import { SoundAnalysis } from '@/types/soundIntelligence';
import { getSoundAnalysis } from '@/utils/soundIntelligenceApi';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import SoundHeader from '@/components/sound-intelligence/SoundHeader';
import HeroStatsRow from '@/components/sound-intelligence/HeroStatsRow';
import VelocityChart from '@/components/sound-intelligence/VelocityChart';
import WinnerCard from '@/components/sound-intelligence/WinnerCard';
import FormatTrendsChart from '@/components/sound-intelligence/FormatTrendsChart';
import FormatBreakdownTable from '@/components/sound-intelligence/FormatBreakdownTable';
import HookDurationSection from '@/components/sound-intelligence/HookDurationSection';
import TopPerformersGrid from '@/components/sound-intelligence/TopPerformersGrid';
import CreatorTiersSection from '@/components/sound-intelligence/CreatorTiersSection';
import GeoSpreadSection from '@/components/sound-intelligence/GeoSpreadSection';
import LifecycleCard from '@/components/sound-intelligence/LifecycleCard';

export default function SoundIntelligenceDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<SoundAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ videos_scraped: number; videos_analyzed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedFormat, setExpandedFormat] = useState<number | null>(null);
  const [expandedTier, setExpandedTier] = useState<number | null>(null);
  const [expandedGeo, setExpandedGeo] = useState<number | null>(null);
  const [disabledTrendLines, setDisabledTrendLines] = useState<Set<string>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const poll = useCallback((id: string) => {
    stopPolling();
    setIsLoading(true);
    setError(null);

    const doFetch = async () => {
      try {
        const res = await getSoundAnalysis({ job_id: id });
        if (!res) return;
        const a: SoundAnalysis | null =
          (res.formats || res.velocity) ? res :
          (res.status === 'completed' && res.analysis) ? res.analysis : null;

        if (a) {
          stopPolling();
          setAnalysis(a);
          setIsLoading(false);
          setLoadingStatus(null);
          setProgress(null);
        } else if (res.status === 'failed') {
          stopPolling();
          setIsLoading(false);
          setError('Analysis failed.');
        } else {
          setLoadingStatus(res.status);
          if (res.progress) setProgress(res.progress);
        }
      } catch (err: any) {
        stopPolling();
        setIsLoading(false);
        setError(err.message);
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      }
    };

    doFetch();
    pollRef.current = setInterval(doFetch, 5000);
  }, [stopPolling]);

  useEffect(() => {
    if (jobId) poll(jobId);
    return stopPolling;
  }, [jobId]); // eslint-disable-line

  const statusLabels: Record<string, string> = {
    pending: 'Preparing analysis...',
    scraping: 'Analysing...',
    classifying: 'Classifying content...',
    synthesizing: 'Synthesizing insights...',
  };

  return (
    <LabelLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Back button */}
        <button
          onClick={() => navigate('/label/sound-intelligence')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            color: 'var(--ink-tertiary)',
            cursor: 'pointer',
            marginBottom: 24,
            padding: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-tertiary)')}
        >
          <ArrowLeft size={16} />
          Back to Sound Intelligence
        </button>

        {/* Loading */}
        {isLoading && !analysis && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{
              background: 'var(--surface)',
              borderRadius: 20,
              padding: '48px 64px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderTop: '0.5px solid rgba(255,255,255,0.04)',
            }}>
              <Loader2 size={40} color="#e8430a" style={{ animation: 'spin 1s linear infinite', marginBottom: 20 }} />
              <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
                {statusLabels[loadingStatus || 'pending']}
              </div>
              {progress && (loadingStatus === 'classifying' || loadingStatus === 'synthesizing') && (
                <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 14, color: 'var(--ink-tertiary)' }}>
                  {progress.videos_analyzed} / {progress.videos_scraped} analyzed
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 16, color: 'var(--ink-secondary)', marginBottom: 16 }}>
              {error}
            </div>
            <button
              onClick={() => jobId && poll(jobId)}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: '#e8430a', color: '#fff',
                fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ animation: 'fadeInUp 0.35s ease both' }}>
              <SoundHeader analysis={analysis} />
            </div>
            <div style={{ animation: 'fadeInUp 0.35s ease both', animationDelay: '0.05s' }}>
              <HeroStatsRow analysis={analysis} />
            </div>
            <div style={{ display: 'flex', gap: 16, animation: 'fadeInUp 0.35s ease both', animationDelay: '0.1s' }}>
              <VelocityChart velocity={analysis.velocity} lifecycle={analysis.lifecycle} />
              <WinnerCard winner={analysis.winner} />
            </div>
            <div style={{ animation: 'fadeInUp 0.35s ease both', animationDelay: '0.15s' }}>
              <FormatTrendsChart
                formats={analysis.formats}
                velocity={analysis.velocity}
                disabledLines={disabledTrendLines}
                onToggleLine={(name) => setDisabledTrendLines(prev => {
                  const next = new Set(prev);
                  next.has(name) ? next.delete(name) : next.add(name);
                  return next;
                })}
              />
            </div>
            <div style={{ animation: 'fadeInUp 0.35s ease both', animationDelay: '0.2s' }}>
              <FormatBreakdownTable
                formats={analysis.formats}
                expandedFormat={expandedFormat}
                onToggle={(i) => setExpandedFormat(prev => prev === i ? null : i)}
              />
            </div>
            <div style={{ animation: 'fadeInUp 0.35s ease both', animationDelay: '0.25s' }}>
              <HookDurationSection hookAnalysis={analysis.hook_analysis} duration={analysis.duration} />
            </div>
            <div style={{ animation: 'fadeInUp 0.35s ease both', animationDelay: '0.3s' }}>
              <TopPerformersGrid topVideos={analysis.top_videos} />
            </div>
            <div style={{ animation: 'fadeInUp 0.35s ease both', animationDelay: '0.35s' }}>
              <CreatorTiersSection
                tiers={analysis.creator_tiers}
                expandedTier={expandedTier}
                onToggle={(i) => setExpandedTier(prev => prev === i ? null : i)}
              />
            </div>
            <div style={{ animation: 'fadeInUp 0.35s ease both', animationDelay: '0.4s' }}>
              <GeoSpreadSection
                geography={analysis.geography}
                expandedGeo={expandedGeo}
                onToggle={(i) => setExpandedGeo(prev => prev === i ? null : i)}
              />
            </div>
            <div style={{ animation: 'fadeInUp 0.35s ease both', animationDelay: '0.45s' }}>
              <LifecycleCard lifecycle={analysis.lifecycle} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </LabelLayout>
  );
}
