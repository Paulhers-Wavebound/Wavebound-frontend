import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";
import type { FanBrief } from "@/types/fanBriefs";
import { peakEvidenceOf, venueFromBrief, VENUE_STYLES } from "./venues";

interface BriefAuditModalProps {
  brief: FanBrief | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatTimestamp(seconds: number | null | undefined): string {
  if (seconds == null) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function BriefAuditModal({
  brief,
  open,
  onOpenChange,
}: BriefAuditModalProps) {
  if (!brief) return null;
  const evidence = peakEvidenceOf(brief);
  const venue = VENUE_STYLES[venueFromBrief(brief)];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[85vh] overflow-y-auto font-['DM_Sans',sans-serif]"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-[17px] font-semibold flex items-center gap-2 flex-wrap"
            style={{ color: "var(--ink)" }}
          >
            <span>@{brief.artist_handle}</span>
            <span
              className="text-[12px] font-medium uppercase tracking-wide"
              style={{ color: "var(--ink-tertiary)" }}
            >
              — evidence audit
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide"
              style={{ background: venue.bg, color: venue.color }}
            >
              {venue.label}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Source link */}
        {brief.youtube_timestamp_url && (
          <a
            href={brief.youtube_timestamp_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] no-underline hover:underline"
            style={{ color: "var(--accent)" }}
          >
            <ExternalLink size={13} />
            Open source on YouTube at {formatTimestamp(brief.timestamp_start)}
          </a>
        )}

        {/* Source title */}
        {brief.source_title && (
          <div
            className="text-[13px] italic"
            style={{ color: "var(--ink-secondary)" }}
          >
            {brief.source_title}
          </div>
        )}

        {/* Stat row */}
        {evidence && (
          <div
            className="flex flex-wrap gap-x-5 gap-y-2 mt-2 px-4 py-3 rounded-xl font-['JetBrains_Mono',monospace] text-[12px] tabular-nums"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
            }}
          >
            <StatChip label="cluster" value={evidence.cluster_size} />
            <StatChip label="sum likes" value={evidence.sum_likes} />
            <StatChip label="confidence" value={`${brief.confidence_score}%`} />
            {evidence.chapter_title && (
              <StatChip label="chapter" value={evidence.chapter_title} />
            )}
            {evidence.chapter_duration != null && (
              <StatChip
                label="chapter dur"
                value={`${evidence.chapter_duration}s`}
              />
            )}
          </div>
        )}

        {/* Top comments — full list */}
        {evidence && evidence.top_comments.length > 0 && (
          <div className="mt-4">
            <div
              className="text-[11px] font-semibold uppercase tracking-wide mb-2"
              style={{ color: "var(--ink-secondary)" }}
            >
              All fan comments in this cluster ({evidence.top_comments.length})
            </div>
            <div className="flex flex-col gap-2">
              {evidence.top_comments.map((c) => (
                <div
                  key={c.id}
                  className="px-3 py-2.5 rounded-lg"
                  style={{
                    background: "var(--surface-hover)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    className="text-[13px] leading-snug"
                    style={{ color: "var(--ink)" }}
                  >
                    {c.content}
                  </div>
                  <div
                    className="mt-1 text-[11px] font-['JetBrains_Mono',monospace] tabular-nums flex items-center gap-2"
                    style={{ color: "var(--ink-tertiary)" }}
                  >
                    <span>{c.author ?? "unknown"}</span>
                    <span>·</span>
                    <span>{c.like_count} likes</span>
                    {c.referenced_seconds != null && (
                      <>
                        <span>·</span>
                        <span>@ {formatTimestamp(c.referenced_seconds)}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw JSON */}
        {evidence && (
          <details className="mt-4">
            <summary
              className="cursor-pointer text-[12px] font-medium select-none"
              style={{ color: "var(--ink-secondary)" }}
            >
              Raw peak_evidence JSON
            </summary>
            <pre
              className="mt-2 p-3 rounded-lg text-[11px] leading-snug whitespace-pre-wrap font-['JetBrains_Mono',monospace] overflow-x-auto"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
                color: "var(--ink-secondary)",
              }}
            >
              {JSON.stringify(evidence, null, 2)}
            </pre>
          </details>
        )}

        {!evidence && (
          <div
            className="text-[13px] mt-4"
            style={{ color: "var(--ink-tertiary)" }}
          >
            No peak_evidence recorded for this brief. The backend may not have
            synthesized it from fan comments, or this is an interview brief
            opened by accident.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className="text-[10px] uppercase tracking-wide"
        style={{ color: "var(--ink-tertiary)" }}
      >
        {label}
      </span>
      <span style={{ color: "var(--ink)" }}>{value}</span>
    </div>
  );
}
