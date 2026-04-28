import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { OutputType } from "./types";
import { PRESETS } from "./presets";

interface ExploreViewProps {
  onPickPreset: (preset: OutputType) => void;
}

// Stagger reveal — 50ms between cards, capped at first 12 children. Each
// child fades + rises 16px. Higgsfield-aesthetic motion: ease-out-expo,
// no bounce.
const GRID_VARIANTS = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.06 },
  },
};
const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
  },
};
const HERO_TILE_VARIANTS = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

// Per-preset color signature — used as the dominant tint for the tile's
// abstract backdrop. We don't have real thumbnails yet; once we surface
// recent renders from cf_jobs / cartoon_scripts these gradients become
// fallbacks while images load.
const PRESET_TINTS: Record<string, [string, string]> = {
  cartoon: ["#f25d24", "#7c1a05"],
  link_video: ["#ff005b", "#4a0017"],
  fan_brief: ["#9d4edd", "#2a0e4f"],
  short_form: ["#3a86ff", "#0a2547"],
  mini_doc: ["#06b6d4", "#053f4f"],
  sensational: ["#f97316", "#3a1605"],
  self_help: ["#10b981", "#053226"],
  tour_recap: ["#eab308", "#3d2b04"],
};

function tintFor(key: string): [string, string] {
  return PRESET_TINTS[key] ?? ["#f25d24", "#7c1a05"];
}

export default function ExploreView({ onPickPreset }: ExploreViewProps) {
  const live = PRESETS.filter((p) => p.status === "live");
  const soon = PRESETS.filter((p) => p.status === "soon");
  const heroPicks = live.slice(0, 4);

  return (
    <div className="flex flex-col gap-24" style={{ color: "var(--ink)" }}>
      {/* HERO — left oversized type, right bento mosaic of recent presets.
          When real recent-render thumbnails are wired, the mosaic tiles
          become muted videos auto-cycling through the 4 latest cf_jobs
          + cartoon_scripts with status='complete'. */}
      <motion.section
        className="grid grid-cols-12 gap-8 lg:gap-16 items-end pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="col-span-12 lg:col-span-7 flex flex-col">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "var(--display-font)",
              fontSize: "clamp(48px, 7vw, 88px)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "-0.025em",
              lineHeight: 0.95,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            Artist content,
            <br />
            <span style={{ color: "var(--accent)" }}>at factory scale.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-8 max-w-[540px] text-[16px] leading-[1.6]"
            style={{ color: "var(--ink-secondary)" }}
          >
            Pick a format. Drop in an artist. Hit Generate. Cartoon shorts,
            lyric overlays, fan-brief edits — all routed through the same
            pipeline, all landing in Assets ready to schedule.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <button
              type="button"
              onClick={() => onPickPreset("cartoon")}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-[10px] transition-transform active:scale-[0.98]"
              style={{
                background: "var(--accent)",
                color: "var(--accent-on)",
                fontFamily: "var(--display-font)",
                fontSize: 15,
                fontWeight: 700,
                boxShadow: "0 0 0 0 var(--accent-glow)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 32px var(--accent-glow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 0 var(--accent-glow)";
              }}
            >
              Start a story
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                const node = document.getElementById("cf2-tools");
                node?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-[10px] transition-colors"
              style={{
                background: "transparent",
                color: "var(--ink)",
                border: "1px solid var(--border-strong)",
                fontFamily: "var(--display-font)",
                fontSize: 15,
                fontWeight: 700,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Browse formats
            </button>
          </motion.div>
        </div>

        <motion.div
          className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-3"
          variants={GRID_VARIANTS}
          initial="hidden"
          animate="show"
        >
          {heroPicks.map((p) => {
            const [tintHi, tintLo] = tintFor(p.key);
            return (
              <motion.button
                key={p.key}
                variants={HERO_TILE_VARIANTS}
                onClick={() => onPickPreset(p.key)}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative aspect-[4/5] rounded-[14px] overflow-hidden text-left group"
                style={{ background: tintLo }}
              >
                {/* Gradient fill */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at 30% 25%, ${tintHi}, ${tintLo} 70%)`,
                  }}
                />
                {/* Diagonal noise stripes for texture */}
                <div
                  className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(115deg, transparent 0 22px, rgba(255,255,255,0.08) 22px 23px)",
                  }}
                />
                {/* Big icon — large faint silhouette */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ opacity: 0.18 }}
                >
                  <p.icon size={120} color="#fff" strokeWidth={1.5} />
                </div>
                {/* Bottom scrim */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(transparent 50%, rgba(0,0,0,0.85))",
                  }}
                />
                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-[14px] pointer-events-none opacity-0 group-hover:opacity-100"
                  style={{
                    boxShadow:
                      "inset 0 0 0 1px rgba(255,255,255,0.5), 0 0 32px rgba(255,255,255,0.18)",
                    transition: "opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
                {/* Label */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div
                    style={{
                      fontFamily: "var(--display-font)",
                      fontSize: 14,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "-0.005em",
                      color: "#fff",
                      lineHeight: 1.1,
                    }}
                  >
                    {p.label}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.section>

      {/* Tools — live presets, full-bleed content tiles */}
      <section id="cf2-tools" className="flex flex-col gap-6">
        <SectionHeader eyebrow="Live tools" title="Generate something" />
        <motion.div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          }}
          variants={GRID_VARIANTS}
          initial="hidden"
          animate="show"
        >
          {live.map((p) => (
            <motion.div key={p.key} variants={CARD_VARIANTS}>
              <ToolCard preset={p} onClick={() => onPickPreset(p.key)} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Roadmap */}
      <section className="flex flex-col gap-6">
        <SectionHeader eyebrow="Roadmap" title="Coming soon" />
        <motion.div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          }}
          variants={GRID_VARIANTS}
          initial="hidden"
          animate="show"
        >
          {soon.map((p) => (
            <motion.div key={p.key} variants={CARD_VARIANTS}>
              <ToolCard preset={p} onClick={() => onPickPreset(p.key)} />
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        style={{
          fontFamily: "var(--display-font)",
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          color: "var(--accent)",
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontFamily: "var(--display-font)",
          fontSize: "clamp(28px, 3.6vw, 40px)",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "-0.015em",
          lineHeight: 1.05,
          color: "var(--ink)",
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

function ToolCard({
  preset,
  onClick,
}: {
  preset: (typeof PRESETS)[number];
  onClick: () => void;
}) {
  const isSoon = preset.status === "soon";
  const [tintHi, tintLo] = tintFor(preset.key);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: isSoon ? 1 : 1.02 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="group relative w-full text-left rounded-[14px] overflow-hidden"
      style={{
        aspectRatio: "4 / 5",
        background: tintLo,
        boxShadow: isSoon
          ? undefined
          : "inset 0 0 0 1px var(--accent-hairline)",
      }}
    >
      {/* Gradient fill — preset's color signature */}
      <div
        className="absolute inset-0"
        style={{
          background: isSoon
            ? "linear-gradient(140deg, var(--surface) 0%, var(--bg-subtle) 100%)"
            : `radial-gradient(circle at 30% 25%, ${tintHi}, ${tintLo} 70%)`,
        }}
      />
      {/* Diagonal stripes for texture (live only) */}
      {!isSoon && (
        <div
          className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, transparent 0 24px, rgba(255,255,255,0.08) 24px 25px)",
          }}
        />
      )}
      {/* Large faint icon */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: isSoon ? 0.12 : 0.2 }}
      >
        <preset.icon
          size={140}
          color={isSoon ? "var(--ink-tertiary)" : "#fff"}
          strokeWidth={1.4}
        />
      </div>
      {/* Bottom scrim */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(transparent 35%, rgba(0,0,0,0.88) 100%)",
        }}
      />
      {/* Hover glow border */}
      {!isSoon && (
        <div
          className="absolute inset-0 rounded-[14px] pointer-events-none opacity-0 group-hover:opacity-100"
          style={{
            boxShadow:
              "inset 0 0 0 1px var(--accent), 0 0 28px var(--accent-glow)",
            transition: "opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      )}
      {/* Badge top-right */}
      <span
        className="absolute top-3 right-3 inline-flex items-center px-2.5 py-1 rounded-full"
        style={{
          fontFamily: "var(--display-font)",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          background: isSoon ? "rgba(255,255,255,0.14)" : "var(--accent)",
          color: isSoon ? "var(--ink-secondary)" : "var(--accent-on)",
          backdropFilter: isSoon ? "blur(6px)" : undefined,
        }}
      >
        {isSoon ? "Soon" : "Live"}
      </span>
      {/* Label block */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1.5">
        <div
          style={{
            fontFamily: "var(--display-font)",
            fontSize: 18,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "-0.005em",
            color: isSoon ? "var(--ink-secondary)" : "#fff",
            lineHeight: 1.1,
          }}
        >
          {preset.label}
        </div>
        <div
          className="text-[12px] leading-snug line-clamp-2"
          style={{
            color: isSoon ? "var(--ink-tertiary)" : "rgba(255,255,255,0.72)",
          }}
        >
          {preset.description}
        </div>
      </div>
    </motion.button>
  );
}
