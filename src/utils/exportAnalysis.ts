import { SoundAnalysis, FormatBreakdown } from "@/types/soundIntelligence";
import { formatNumber, ListAnalysisEntry } from "@/utils/soundIntelligenceApi";

/* ------------------------------------------------------------------ */
/*  PDF Export — section-aware, no content splitting across pages      */
/* ------------------------------------------------------------------ */

const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const MARGIN = 8;
const CONTENT_W = PAGE_W - MARGIN * 2;
const HEADER_H = 16;
const FOOTER_MARGIN = 6;
const USABLE_H = PAGE_H - HEADER_H - FOOTER_MARGIN;

export async function exportAnalysisPDF(
  element: HTMLElement,
  analysis: SoundAnalysis,
): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  // The target render width in pixels — chosen so content fills A4 width
  // without excessive shrinking. 750px ≈ 194mm content area at ~98dpi.
  const RENDER_WIDTH = 900;

  // 1. Temporarily resize the container to PDF-friendly width
  //    and freeze all animations for clean capture.
  const savedContainer = element.style.cssText;
  element.style.width = `${RENDER_WIDTH}px`;
  element.style.maxWidth = `${RENDER_WIDTH}px`;
  element.style.minWidth = `${RENDER_WIDTH}px`;

  const savedStyles: { el: HTMLElement; css: string }[] = [];
  element.querySelectorAll<HTMLElement>("*").forEach((el) => {
    const cs = el.style;
    if (cs.animation || cs.opacity !== "1" || cs.transform) {
      savedStyles.push({ el, css: cs.cssText });
      cs.animation = "none";
      cs.opacity = "1";
      cs.transform = "none";
    }
  });

  // 1b. PDF-specific DOM manipulation: hide interactive elements, adjust layouts
  const savedPdfStyles: { el: HTMLElement; css: string }[] = [];

  // Hide interactive-only elements (tabs, toggles, chevrons)
  element.querySelectorAll<HTMLElement>("[data-pdf-hide]").forEach((el) => {
    savedPdfStyles.push({ el, css: el.style.cssText });
    el.style.display = "none";
  });

  // Stack side-by-side containers vertically for PDF
  element.querySelectorAll<HTMLElement>("[data-pdf-stack]").forEach((el) => {
    savedPdfStyles.push({ el, css: el.style.cssText });
    el.style.flexDirection = "column";
    Array.from(el.children).forEach((child) => {
      const c = child as HTMLElement;
      savedPdfStyles.push({ el: c, css: c.style.cssText });
      c.style.flex = "none";
      c.style.width = "100%";
    });
  });

  // Override grid columns for PDF-friendly layout
  element.querySelectorAll<HTMLElement>("[data-pdf-cols]").forEach((el) => {
    savedPdfStyles.push({ el, css: el.style.cssText });
    const cols = el.getAttribute("data-pdf-cols");
    el.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  });

  // Override grid templates with explicit PDF-friendly values
  element
    .querySelectorAll<HTMLElement>("[data-pdf-grid-template]")
    .forEach((el) => {
      savedPdfStyles.push({ el, css: el.style.cssText });
      el.style.gridTemplateColumns = el.getAttribute("data-pdf-grid-template")!;
    });

  // Convert legend containers to clean grid layout for PDF
  element
    .querySelectorAll<HTMLElement>("[data-pdf-legend-cols]")
    .forEach((el) => {
      savedPdfStyles.push({ el, css: el.style.cssText });
      const cols = el.getAttribute("data-pdf-legend-cols");
      el.style.display = "grid";
      el.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      el.style.gap = "6px 16px";
      el.style.flexWrap = "";
    });

  // Hide Recharts tooltips, cursors, and active dots
  element
    .querySelectorAll<HTMLElement>(
      ".recharts-tooltip-wrapper, .recharts-tooltip-cursor",
    )
    .forEach((el) => {
      savedPdfStyles.push({ el, css: el.style.cssText });
      el.style.visibility = "hidden";
    });

  // Force layout reflow and wake Recharts ResponsiveContainers
  element.getBoundingClientRect();
  window.dispatchEvent(new Event("resize"));
  await new Promise((r) => setTimeout(r, 400));

  // 2. Capture each top-level section as a separate canvas
  const sections = Array.from(element.children) as HTMLElement[];
  const captures: { canvas: HTMLCanvasElement; heightMm: number }[] = [];

  for (const section of sections) {
    const canvas = await html2canvas(section, {
      backgroundColor: "#000000",
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: RENDER_WIDTH,
    });
    const heightMm = (canvas.height / canvas.width) * CONTENT_W;
    captures.push({ canvas, heightMm });
  }

  // 3. Restore all styles
  savedPdfStyles.forEach(({ el, css }) => {
    el.style.cssText = css;
  });
  savedStyles.forEach(({ el, css }) => {
    el.style.cssText = css;
  });
  element.style.cssText = savedContainer;

  // 4. Build PDF, placing sections with page-break awareness
  const pdf = new jsPDF("p", "mm", "a4");
  let pageNum = 1;
  let cursorY = HEADER_H + 2; // start below header

  const drawPageBg = () => {
    pdf.setFillColor(0, 0, 0);
    pdf.rect(0, 0, PAGE_W, PAGE_H, "F");
  };

  const drawHeader = () => {
    pdf.setFillColor(0, 0, 0);
    pdf.rect(0, 0, PAGE_W, HEADER_H, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(232, 67, 10);
    pdf.text("WAVEBOUND", MARGIN, 6.5);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(200, 200, 200);
    pdf.text("Sound Intelligence Report", MARGIN, 11);
    pdf.setTextColor(120, 120, 120);
    pdf.text(
      `${analysis.track_name} \u2014 ${analysis.artist_name}`,
      MARGIN,
      14.5,
    );
    pdf.setFontSize(7);
    pdf.text(String(pageNum), PAGE_W - MARGIN - 4, 14.5);
  };

  const newPage = () => {
    pdf.addPage();
    pageNum++;
    cursorY = HEADER_H + 2;
    drawPageBg();
    drawHeader();
  };

  // Draw background + header on first page
  drawPageBg();
  drawHeader();

  const SECTION_GAP = 3; // mm between sections
  // Minimum remaining page space worth filling — below this, just start a new page
  const MIN_SPLIT_THRESHOLD = 40;

  const placeCanvas = (canvas: HTMLCanvasElement, heightMm: number) => {
    const availMm = PAGE_H - FOOTER_MARGIN - cursorY;

    if (heightMm <= availMm) {
      // Fits on current page
      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      pdf.addImage(imgData, "JPEG", MARGIN, cursorY, CONTENT_W, heightMm);
      cursorY += heightMm + SECTION_GAP;
    } else if (availMm < MIN_SPLIT_THRESHOLD && heightMm <= USABLE_H) {
      // Too little space and section fits on a fresh page — bump intact
      newPage();
      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      pdf.addImage(imgData, "JPEG", MARGIN, cursorY, CONTENT_W, heightMm);
      cursorY += heightMm + SECTION_GAP;
    } else {
      // Split the section across pages (large sections or filling gaps)
      const scaleFactor = canvas.width / CONTENT_W;
      let srcY = 0;
      const totalSrcH = canvas.height;

      while (srcY < totalSrcH) {
        const pageAvail = PAGE_H - FOOTER_MARGIN - cursorY;
        const sliceSrcH = Math.min(pageAvail * scaleFactor, totalSrcH - srcY);
        const sliceMm = sliceSrcH / scaleFactor;

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.ceil(sliceSrcH);
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(
          canvas,
          0,
          srcY,
          canvas.width,
          sliceSrcH,
          0,
          0,
          canvas.width,
          sliceSrcH,
        );

        const imgData = sliceCanvas.toDataURL("image/jpeg", 0.9);
        pdf.addImage(imgData, "JPEG", MARGIN, cursorY, CONTENT_W, sliceMm);

        srcY += sliceSrcH;
        cursorY += sliceMm;

        if (srcY < totalSrcH) {
          newPage();
        }
      }
      cursorY += SECTION_GAP;
    }
  };

  for (const { canvas, heightMm } of captures) {
    placeCanvas(canvas, heightMm);
  }

  // Add generation date footer on last page
  pdf.setFontSize(7);
  pdf.setTextColor(100, 100, 100);
  pdf.text(
    `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    MARGIN,
    PAGE_H - 4,
  );

  const date = new Date().toISOString().slice(0, 10);
  const safeName = analysis.track_name.replace(/[^a-zA-Z0-9]/g, "_");
  const safeArtist = analysis.artist_name.replace(/[^a-zA-Z0-9]/g, "_");
  pdf.save(`${safeName}_${safeArtist}_Sound_Intelligence_${date}.pdf`);
}

/* ------------------------------------------------------------------ */
/*  Overview Summary PDF — native jsPDF table (no html2canvas)        */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<string, [number, number, number]> = {
  accelerating: [48, 209, 88],
  active: [255, 159, 10],
  declining: [255, 69, 58],
};

export async function exportOverviewPDF(
  entries: ListAnalysisEntry[],
): Promise<void> {
  const completed = entries.filter(
    (e) => e.status === "completed" && e.summary,
  );
  if (completed.length === 0) return;

  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF("l", "mm", "a4"); // landscape for wide table
  const PW = 297;
  const PH = 210;
  const M = 10;
  const CW = PW - M * 2;
  let pageNum = 1;

  const drawPage = () => {
    // Black background
    pdf.setFillColor(0, 0, 0);
    pdf.rect(0, 0, PW, PH, "F");

    // Header bar
    pdf.setFillColor(20, 20, 22);
    pdf.rect(0, 0, PW, 18, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(232, 67, 10);
    pdf.text("WAVEBOUND", M, 7.5);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(200, 200, 200);
    pdf.text("Sound Intelligence Summary", M, 12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `${completed.length} sounds \u2022 ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
      M,
      16,
    );
    pdf.setFontSize(7);
    pdf.text(String(pageNum), PW - M - 4, 16);
  };

  drawPage();

  // Column layout
  const cols = [
    { label: "TRACK", x: M, w: 58 },
    { label: "ARTIST", x: M + 58, w: 38 },
    { label: "VIDEOS", x: M + 96, w: 22 },
    { label: "VIEWS", x: M + 118, w: 26 },
    { label: "ENGAGE %", x: M + 144, w: 24 },
    { label: "SHARE %", x: M + 168, w: 22 },
    { label: "PEAK DAY", x: M + 190, w: 26 },
    { label: "WINNER FORMAT", x: M + 216, w: 40 },
    { label: "STATUS", x: M + 256, w: 21 },
  ];

  // Table header
  let y = 24;
  pdf.setFillColor(28, 28, 30);
  pdf.rect(M, y, CW, 8, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(140, 140, 140);
  cols.forEach((c) => {
    pdf.text(c.label, c.x + 2, y + 5.5);
  });
  y += 10;

  const ROW_H = 9;

  const drawTableHeader = () => {
    pdf.setFillColor(28, 28, 30);
    pdf.rect(M, y, CW, 8, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(140, 140, 140);
    cols.forEach((c) => {
      pdf.text(c.label, c.x + 2, y + 5.5);
    });
    y += 10;
  };

  completed.forEach((entry, idx) => {
    // Check page break
    if (y + ROW_H > PH - 8) {
      pdf.addPage();
      pageNum++;
      drawPage();
      y = 24;
      drawTableHeader();
    }

    const s = entry.summary!;

    // Zebra stripe
    if (idx % 2 === 0) {
      pdf.setFillColor(22, 22, 24);
      pdf.rect(M, y, CW, ROW_H, "F");
    }

    // Row border
    pdf.setDrawColor(40, 40, 42);
    pdf.line(M, y + ROW_H, M + CW, y + ROW_H);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    const ty = y + 6;

    // Track name — bold, white
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(220, 220, 220);
    pdf.text(entry.track_name.slice(0, 30), cols[0].x + 2, ty);

    // Artist
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(160, 160, 160);
    pdf.text(entry.artist_name.slice(0, 20), cols[1].x + 2, ty);

    // Videos
    pdf.setTextColor(200, 200, 200);
    pdf.text(formatNumber(s.videos_analyzed), cols[2].x + 2, ty);

    // Views
    pdf.text(formatNumber(s.total_views), cols[3].x + 2, ty);

    // Engagement
    pdf.text(`${s.engagement_rate}%`, cols[4].x + 2, ty);

    // Share rate
    pdf.text(
      s.share_rate != null ? `${s.share_rate}%` : "—",
      cols[5].x + 2,
      ty,
    );

    // Peak day
    pdf.text(s.peak_day || "—", cols[6].x + 2, ty);

    // Winner format
    pdf.setTextColor(232, 67, 10);
    pdf.text(s.winner_format.slice(0, 22), cols[7].x + 2, ty);

    // Status pill
    const statusKey = s.velocity_status || "active";
    const sc = STATUS_COLORS[statusKey] || [140, 140, 140];
    pdf.setFillColor(sc[0], sc[1], sc[2]);
    pdf.roundedRect(cols[8].x + 1, y + 2, 19, 5, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    pdf.setTextColor(0, 0, 0);
    const statusLabel = statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
    pdf.text(statusLabel, cols[8].x + 3, y + 5.8);

    y += ROW_H;
  });

  // Footer
  pdf.setFontSize(7);
  pdf.setTextColor(100, 100, 100);
  pdf.text(
    `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    M,
    PH - 4,
  );

  const date = new Date().toISOString().slice(0, 10);
  pdf.save(`Wavebound_Sound_Intelligence_Summary_${date}.pdf`);
}

/* ------------------------------------------------------------------ */
/*  CSV Export — structured data from the analysis                    */
/* ------------------------------------------------------------------ */

function csvEscape(val: string | number | null | undefined): string {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsvRows(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): string {
  const headerLine = headers.map(csvEscape).join(",");
  const dataLines = rows.map((row) => row.map(csvEscape).join(","));
  return [headerLine, ...dataLines].join("\n");
}

export function exportFormatBreakdownCSV(
  formats: FormatBreakdown[],
  analysis: SoundAnalysis,
): void {
  const hasShareRate = formats.some((f) => f.actual_share_rate != null);
  const headers = [
    "Format",
    "Videos",
    "% of Total",
    "Avg Views",
    "Engagement Rate %",
    ...(hasShareRate ? ["Share Rate %"] : []),
    "Verdict",
    "Face %",
    "Snippet",
    "Top Hook",
  ];
  const rows = formats.map((f) => [
    f.name,
    f.video_count,
    f.pct_of_total,
    f.avg_views,
    f.share_rate,
    ...(hasShareRate ? [f.actual_share_rate ?? ""] : []),
    f.verdict,
    f.hooks.face_pct,
    f.hooks.snippet,
    f.hooks.top_hooks[0] || "",
  ]);

  const csv = toCsvRows(headers, rows);
  downloadFile(csv, `${analysis.track_name}_Format_Breakdown.csv`, "text/csv");
}

export function exportFullAnalysisCSV(analysis: SoundAnalysis): void {
  const sections: string[] = [];

  // Summary
  sections.push("SOUND INTELLIGENCE SUMMARY");
  sections.push(`Track,${csvEscape(analysis.track_name)}`);
  sections.push(`Artist,${csvEscape(analysis.artist_name)}`);
  sections.push(`Videos Analyzed,${analysis.videos_analyzed}`);
  sections.push(`Total Views,${analysis.total_views}`);
  sections.push(`Avg Engagement Rate,${analysis.avg_share_rate}%`);
  if (analysis.actual_share_rate != null) {
    sections.push(`Avg Share Rate,${analysis.actual_share_rate}%`);
  }
  sections.push(`Avg Duration,${analysis.avg_duration_seconds}s`);
  sections.push(`Peak Day,${csvEscape(analysis.peak_day)}`);
  sections.push(`Status,${analysis.status}`);
  sections.push("");

  // Winner
  sections.push("WINNER FORMAT");
  sections.push(`Format,${csvEscape(analysis.winner.format)}`);
  sections.push(`Multiplier,${analysis.winner.multiplier}x`);
  sections.push(`Videos,${analysis.winner.video_count}`);
  sections.push(`Avg Views,${formatNumber(analysis.winner.avg_views)}`);
  sections.push(`Recommendation,${csvEscape(analysis.winner.recommendation)}`);
  sections.push("");

  // Formats
  const fmtHasShare = analysis.formats.some((f) => f.actual_share_rate != null);
  sections.push("FORMAT BREAKDOWN");
  sections.push(
    fmtHasShare
      ? "Format,Videos,% Total,Avg Views,Engagement %,Share Rate %,Verdict"
      : "Format,Videos,% Total,Avg Views,Engagement %,Verdict",
  );
  analysis.formats.forEach((f) => {
    sections.push(
      [
        f.name,
        f.video_count,
        f.pct_of_total,
        f.avg_views,
        f.share_rate,
        ...(fmtHasShare ? [f.actual_share_rate ?? ""] : []),
        f.verdict,
      ]
        .map((v) => csvEscape(v))
        .join(","),
    );
  });
  sections.push("");

  // Creator Tiers
  sections.push("CREATOR TIERS");
  sections.push("Tier,Range,Count,% Total,Avg Views,Avg Engagement %");
  analysis.creator_tiers.forEach((t) => {
    sections.push(
      [t.tier, t.range, t.count, t.pct, t.avg_views, t.avg_share_rate]
        .map((v) => csvEscape(v))
        .join(","),
    );
  });
  sections.push("");

  // Geography
  sections.push("GEOGRAPHIC SPREAD");
  sections.push("Country,% Total,Avg Views,Avg Engagement");
  analysis.geography.forEach((g) => {
    sections.push(
      [`${g.flag} ${g.country}`, g.pct, g.avgViews, g.avgShare]
        .map((v) => csvEscape(v))
        .join(","),
    );
  });
  sections.push("");

  // Top Videos
  sections.push("TOP PERFORMERS");
  sections.push("Rank,Creator,Format,Views,Share Rate,URL");
  analysis.top_videos.forEach((v) => {
    sections.push(
      [v.rank, v.creator, v.format, v.views, v.share_rate, v.url]
        .map((val) => csvEscape(val))
        .join(","),
    );
  });

  // Posting Hours
  if (analysis.posting_hours) {
    sections.push("");
    sections.push("POSTING HOURS (24H)");
    sections.push("Hour,Videos");
    const hourLabels = [
      "12am",
      "1am",
      "2am",
      "3am",
      "4am",
      "5am",
      "6am",
      "7am",
      "8am",
      "9am",
      "10am",
      "11am",
      "12pm",
      "1pm",
      "2pm",
      "3pm",
      "4pm",
      "5pm",
      "6pm",
      "7pm",
      "8pm",
      "9pm",
      "10pm",
      "11pm",
    ];
    analysis.posting_hours.forEach((count, i) => {
      sections.push(`${hourLabels[i]},${count}`);
    });
  }

  const csv = sections.join("\n");
  downloadFile(csv, `${analysis.track_name}_Full_Analysis.csv`, "text/csv");
}

function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
