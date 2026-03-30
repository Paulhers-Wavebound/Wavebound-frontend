import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LabelLayout from '@/pages/label/LabelLayout';
import { triggerSoundAnalysis, extractSoundId, formatNumber, listSoundAnalyses, ListAnalysisEntry } from '@/utils/soundIntelligenceApi';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { toast } from '@/hooks/use-toast';
import { Search, Loader2, Music, TrendingUp, TrendingDown, Minus, Trophy } from 'lucide-react';

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#8E8E93' },
  scraping: { label: 'Scraping...', color: '#FF9F0A' },
  classifying: { label: 'Classifying...', color: '#0A84FF' },
  synthesizing: { label: 'Synthesizing...', color: '#30D158' },
};

const velocityStatusConfig: Record<string, { label: string; color: string; Icon: any }> = {
  accelerating: { label: 'Accelerating', color: '#30D158', Icon: TrendingUp },
  active: { label: 'Active', color: '#FF9F0A', Icon: Minus },
  declining: { label: 'Declining', color: '#FF453A', Icon: TrendingDown },
};

export default function SoundIntelligenceOverview() {
  const navigate = useNavigate();
  const { labelId } = useUserProfile();
  const [searchInput, setSearchInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entries, setEntries] = useState<ListAnalysisEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchList = useCallback(async () => {
    if (!labelId) return;
    try {
      const data = await listSoundAnalyses(labelId);
      setEntries(data);
    } catch (err) {
      console.error('Failed to fetch analyses list', err);
    } finally {
      setIsLoading(false);
    }
  }, [labelId]);

  // Initial load
  useEffect(() => {
    if (!labelId) { setIsLoading(false); return; }
    fetchList();
  }, [labelId, fetchList]);

  // Poll when there are processing entries
  useEffect(() => {
    const hasProcessing = entries.some(e => e.status !== 'completed' && e.status !== 'failed');
    if (!hasProcessing) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    pollRef.current = setInterval(fetchList, 5000);
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [entries.some(e => e.status !== 'completed' && e.status !== 'failed'), fetchList]); // eslint-disable-line

  const handleSubmit = async () => {
    if (!searchInput.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const soundId = extractSoundId(searchInput.trim());

      // Check if already completed in current list
      if (soundId) {
        const existing = entries.find(e => e.sound_id === soundId && e.status === 'completed');
        if (existing) {
          navigate(`/label/sound-intelligence/${existing.job_id}`);
          setIsSubmitting(false);
          return;
        }
      }

      const res = await triggerSoundAnalysis(searchInput.trim(), labelId || null);

      if (res.cached) {
        navigate(`/label/sound-intelligence/${res.job_id}`);
      } else {
        // Add optimistic entry
        const optimistic: ListAnalysisEntry = {
          job_id: res.job_id,
          sound_id: soundId || '',
          track_name: '',
          artist_name: '',
          album_name: '',
          status: 'pending',
          videos_scraped: 0,
          videos_analyzed: 0,
          created_at: new Date().toISOString(),
          completed_at: null,
          summary: null,
        };
        setEntries(prev => [optimistic, ...prev.filter(e => e.job_id !== res.job_id)]);
      }
      setSearchInput('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const processing = entries.filter(e => e.status !== 'completed' && e.status !== 'failed');
  const completed = entries.filter(e => e.status === 'completed');

  return (
    <LabelLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--ink)',
            marginBottom: 8,
          }}>
            Sound Intelligence
          </h1>
          <p style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 15,
            color: 'var(--ink-tertiary)',
            lineHeight: 1.5,
          }}>
            Analyze any TikTok sound to uncover format performance, creator tiers, and viral patterns
          </p>
        </div>

        {/* Search bar */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            display: 'flex',
            gap: 12,
            background: 'var(--surface)',
            borderRadius: 16,
            padding: '8px 8px 8px 20px',
            borderTop: '0.5px solid rgba(255,255,255,0.04)',
            alignItems: 'center',
          }}>
            <Search size={18} color="var(--ink-tertiary)" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Paste a TikTok sound URL to analyze"
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 15,
                color: 'var(--ink)',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !searchInput.trim()}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                border: 'none',
                background: '#e8430a',
                color: '#fff',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting || !searchInput.trim() ? 0.6 : 1,
                transition: 'opacity 150ms',
              }}
            >
              {isSubmitting ? 'Analyzing...' : 'Analyze Sound'}
            </button>
          </div>
        </div>

        {/* Processing section */}
        {processing.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ink-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 16,
            }}>
              Processing
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {processing.map(entry => {
                const cfg = statusConfig[entry.status] || statusConfig.pending;
                const progressText = entry.status === 'scraping'
                  ? `${entry.videos_scraped} videos scraped`
                  : entry.videos_scraped > 0
                    ? `${entry.videos_analyzed} / ${entry.videos_scraped} analyzed`
                    : null;
                return (
                  <div key={entry.job_id} style={{
                    background: '#1C1C1E',
                    borderRadius: 16,
                    padding: '20px 24px',
                    borderTop: '0.5px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}>
                    <Loader2 size={20} color={cfg.color} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--ink)',
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {entry.track_name || entry.sound_id || 'Analyzing...'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 12,
                          fontWeight: 600,
                          color: cfg.color,
                          textTransform: 'uppercase',
                        }}>
                          {cfg.label}
                        </span>
                        {progressText && (
                          <span style={{
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: 12,
                            color: 'var(--ink-tertiary)',
                          }}>
                            · {progressText}
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 12,
                      color: 'var(--ink-faint)',
                    }}>
                      Started {relativeTime(entry.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed grid */}
        {completed.length > 0 && (
          <div>
            <h2 style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ink-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 16,
            }}>
              Completed Analyses
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: 16,
            }}>
              {completed.map(entry => {
                const s = entry.summary;
                const vCfg = velocityStatusConfig[s?.velocity_status || 'active'] || velocityStatusConfig.active;
                const StatusIcon = vCfg.Icon;
                return (
                  <div
                    key={entry.job_id}
                    onClick={() => navigate(`/label/sound-intelligence/${entry.job_id}`)}
                    style={{
                      background: '#1C1C1E',
                      borderRadius: 16,
                      padding: '24px',
                      borderTop: '0.5px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      transition: 'transform 150ms, background 150ms',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLDivElement).style.background = '#2C2C2E';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLDivElement).style.background = '#1C1C1E';
                    }}
                  >
                    {/* Track info + status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 17,
                          fontWeight: 700,
                          color: 'var(--ink)',
                          marginBottom: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {entry.track_name || 'Unknown Track'}
                        </div>
                        <div style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 13,
                          color: 'var(--ink-tertiary)',
                        }}>
                          {entry.artist_name || 'Unknown Artist'}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        borderRadius: 20,
                        background: `${vCfg.color}18`,
                      }}>
                        <StatusIcon size={12} color={vCfg.color} />
                        <span style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 11,
                          fontWeight: 600,
                          color: vCfg.color,
                          textTransform: 'uppercase',
                        }}>
                          {vCfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Stats row */}
                    {s && (
                      <div style={{
                        display: 'flex',
                        gap: 20,
                        marginBottom: 16,
                        flexWrap: 'wrap',
                      }}>
                        <div>
                          <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: 'var(--ink-faint)', marginBottom: 2, textTransform: 'uppercase' }}>
                            Videos
                          </div>
                          <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                            {s.videos_analyzed}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: 'var(--ink-faint)', marginBottom: 2, textTransform: 'uppercase' }}>
                            Views
                          </div>
                          <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                            {formatNumber(s.total_views)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: 'var(--ink-faint)', marginBottom: 2, textTransform: 'uppercase' }}>
                            Engagement
                          </div>
                          <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                            {s.engagement_rate.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: 'var(--ink-faint)', marginBottom: 2, textTransform: 'uppercase' }}>
                            Peak
                          </div>
                          <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                            {s.peak_day}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bottom row: winner format + timestamp */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {s?.winner_format && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            borderRadius: 8,
                            background: '#2C2C2E',
                          }}>
                            <Trophy size={12} color="#e8430a" />
                            <span style={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 12,
                              fontWeight: 600,
                              color: 'var(--ink-secondary)',
                            }}>
                              {s.winner_format}
                            </span>
                            {s.winner_multiplier > 0 && (
                              <span style={{
                                fontFamily: '"DM Sans", sans-serif',
                                fontSize: 11,
                                color: '#e8430a',
                                fontWeight: 600,
                              }}>
                                {s.winner_multiplier.toFixed(1)}x
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 12,
                        color: 'var(--ink-faint)',
                      }}>
                        {entry.completed_at ? relativeTime(entry.completed_at) : relativeTime(entry.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && entries.length === 0 && !isSubmitting && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Music size={48} color="var(--ink-faint)" style={{ marginBottom: 16 }} />
            <div style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 16,
              color: 'var(--ink-secondary)',
              maxWidth: 400,
              margin: '0 auto',
              lineHeight: 1.6,
            }}>
              No analyses yet. Paste a TikTok sound URL above to get started.
            </div>
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Loader2 size={32} color="var(--ink-tertiary)" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </LabelLayout>
  );
}
