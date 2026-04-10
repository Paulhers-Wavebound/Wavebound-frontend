import { useState, useCallback } from "react";
import { TopVideo } from "@/types/soundIntelligence";
import { Copy, Check, Download, ExternalLink } from "lucide-react";
import InfoPopover from "./InfoPopover";
import { toast } from "@/hooks/use-toast";

interface Props {
  topVideos: TopVideo[];
  trackName: string;
}

export default function CreatorActionList({ topVideos, trackName }: Props) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = useCallback((handle: string, idx: number) => {
    const clean = handle.replace(/^@+/, "");
    navigator.clipboard.writeText(`@${clean}`);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }, []);

  const handleExportCSV = useCallback(() => {
    const header = "Rank,Creator,Format,Views,Engagement,Spark Score,URL\n";
    const rows = topVideos
      .map(
        (v) =>
          `${v.rank},"@${v.creator.replace(/^@+/, "")}","${v.format}","${v.views}","${v.share_rate}",${v.spark_score ?? ""},${v.url}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `creators-${trackName.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported" });
  }, [topVideos, trackName]);

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 16,
        padding: 20,
        borderTop: "0.5px solid var(--card-edge)",
        flex: "1 1 40%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 3,
              height: 14,
              borderRadius: 1,
              background:
                "linear-gradient(180deg, rgba(232,67,10,0.6) 0%, rgba(232,67,10,0.15) 100%)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.10em",
              color: "var(--ink-tertiary)",
            }}
          >
            Creator Action List
          </span>
          <InfoPopover text="Top-performing creators ranked by views. Copy handles for outreach or export the full list as CSV." />
        </div>
        <button
          onClick={handleExportCSV}
          data-pdf-hide
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 10px",
            borderRadius: 7,
            border: "1px solid var(--border)",
            background: "none",
            color: "var(--ink-secondary)",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 150ms",
          }}
        >
          <Download size={12} />
          CSV
        </button>
      </div>

      {/* List */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {topVideos.slice(0, 20).map((v, i) => {
          const cleanHandle = v.creator.replace(/^@+/, "");
          const isCopied = copiedIdx === i;

          return (
            <div
              key={v.rank}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 4px",
                borderBottom:
                  i < Math.min(topVideos.length, 20) - 1
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
              {/* Rank */}
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  fontWeight: 700,
                  color: v.rank <= 3 ? "var(--accent)" : "var(--ink-tertiary)",
                  minWidth: 20,
                  textAlign: "center",
                }}
              >
                {v.rank}
              </span>

              {/* Handle + format */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  @{cleanHandle}
                </div>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    color: "var(--ink-faint)",
                  }}
                >
                  {v.format}
                </div>
              </div>

              {/* Views */}
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ink)",
                  minWidth: 48,
                  textAlign: "right",
                }}
              >
                {v.views}
              </span>

              {/* Spark score */}
              {v.spark_score != null && (
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background:
                      v.spark_score >= 70
                        ? "rgba(48,209,88,0.12)"
                        : v.spark_score >= 40
                          ? "rgba(255,214,10,0.12)"
                          : "var(--overlay-subtle)",
                    color:
                      v.spark_score >= 70
                        ? "#30D158"
                        : v.spark_score >= 40
                          ? "#FFD60A"
                          : "var(--ink-tertiary)",
                    minWidth: 28,
                    textAlign: "center",
                  }}
                >
                  {v.spark_score}
                </span>
              )}

              {/* Copy handle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(cleanHandle, i);
                }}
                data-pdf-hide
                title="Copy handle"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: "none",
                  background: isCopied
                    ? "rgba(48,209,88,0.12)"
                    : "var(--overlay-subtle)",
                  color: isCopied ? "#30D158" : "var(--ink-tertiary)",
                  cursor: "pointer",
                  transition: "all 150ms",
                  flexShrink: 0,
                }}
              >
                {isCopied ? <Check size={12} /> : <Copy size={12} />}
              </button>

              {/* Link */}
              {v.url && (
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-pdf-hide
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: "var(--overlay-subtle)",
                    color: "var(--ink-tertiary)",
                    flexShrink: 0,
                    transition: "all 150ms",
                  }}
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          );
        })}
      </div>

      {topVideos.length > 20 && (
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            color: "var(--ink-faint)",
            textAlign: "center",
            paddingTop: 8,
          }}
        >
          +{topVideos.length - 20} more in CSV export
        </div>
      )}
    </div>
  );
}
