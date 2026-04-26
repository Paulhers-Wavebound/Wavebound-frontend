import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { OutputType } from "./types";
import { PRESETS } from "./presets";

interface ExploreViewProps {
  onPickPreset: (preset: OutputType) => void;
}

// Stagger reveal — 40ms between cards, capped at first 12 children so the
// total never exceeds ~480ms. Each child fades + rises 10px.
const GRID_VARIANTS = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04, delayChildren: 0.04 },
  },
};
const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.36, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function ExploreView({ onPickPreset }: ExploreViewProps) {
  const live = PRESETS.filter((p) => p.status === "live");
  const soon = PRESETS.filter((p) => p.status === "soon");

  return (
    <div
      className="flex flex-col gap-8 font-['DM_Sans',sans-serif]"
      style={{ color: "var(--ink)" }}
    >
      {/* Hero band — frames the page like Higgsfield's top showcase row,
          adapted for music promotion. We don't have curated featured assets
          yet, so this is a copy-only band that explains the surface. Phase 2
          replaces it with real recent successful renders. */}
      <section
        className="relative rounded-[24px] overflow-hidden p-8 sm:p-10"
        style={{
          background:
            "linear-gradient(135deg, rgba(242,93,36,0.20) 0%, rgba(30,30,28,0.6) 50%, rgba(17,17,16,1) 100%), var(--bg-subtle)",
          border: "1px solid var(--border)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div
          className="absolute right-[-10%] top-[-30%] w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(242,93,36,0.18), transparent 60%)",
            filter: "blur(20px)",
          }}
        />
        <div className="relative max-w-2xl flex flex-col gap-3">
          <div
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full self-start text-[11px] font-semibold uppercase tracking-wide"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "var(--ink-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            <Sparkles size={12} color="var(--accent)" />
            Content Factory
          </div>
          <h1
            className="text-[36px] sm:text-[44px] font-bold leading-[1.05] tracking-tight"
            style={{ color: "var(--ink)" }}
          >
            One studio for every drop.
          </h1>
          <p
            className="text-[15px] leading-relaxed max-w-xl"
            style={{ color: "var(--ink-secondary)" }}
          >
            Pick a preset, fill in the artist + source, hit Generate. Cartoon
            shorts, lyric overlays, fan-brief edits — everything ends up in
            Assets, ready to schedule.
          </p>
        </div>
      </section>

      {/* Live tools */}
      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <div>
            <div
              className="text-[11px] font-semibold uppercase tracking-wide mb-1"
              style={{ color: "var(--ink-secondary)" }}
            >
              Tools
            </div>
            <h2
              className="text-[18px] font-semibold"
              style={{ color: "var(--ink)" }}
            >
              Generate something
            </h2>
          </div>
        </div>
        <motion.div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
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

      {/* Coming soon */}
      <section className="flex flex-col gap-3">
        <div>
          <div
            className="text-[11px] font-semibold uppercase tracking-wide mb-1"
            style={{ color: "var(--ink-secondary)" }}
          >
            Roadmap
          </div>
          <h2
            className="text-[18px] font-semibold"
            style={{ color: "var(--ink)" }}
          >
            Coming soon
          </h2>
        </div>
        <motion.div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
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

function ToolCard({
  preset,
  onClick,
}: {
  preset: (typeof PRESETS)[number];
  onClick: () => void;
}) {
  const isSoon = preset.status === "soon";
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full text-left rounded-2xl overflow-hidden transition-[transform,border-color,box-shadow,opacity] duration-[var(--dur-state)] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:scale-[0.985] active:duration-[var(--dur-instant)]"
      style={{
        aspectRatio: "1 / 1",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        opacity: isSoon ? 0.62 : 1,
      }}
    >
      {/* Status tag top-right */}
      <div className="absolute top-3 right-3 z-10">
        {isSoon ? (
          <span
            className="px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wide"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "var(--ink-tertiary)",
              border: "1px solid var(--border)",
            }}
          >
            Soon
          </span>
        ) : (
          <span
            className="px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wide"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            New
          </span>
        )}
      </div>

      {/* Hover-glow gradient that radiates from the icon corner */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 18% 22%, rgba(242,93,36,0.12), transparent 60%)",
        }}
      />

      {/* Icon tile */}
      <div className="absolute top-4 left-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border)",
          }}
        >
          <preset.icon size={20} color="var(--ink)" />
        </div>
      </div>

      {/* Title + desc bottom */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1">
        <div
          className="text-[15px] font-semibold leading-tight"
          style={{ color: "var(--ink)" }}
        >
          {preset.label}
        </div>
        <div
          className="text-[11.5px] leading-snug line-clamp-2"
          style={{ color: "var(--ink-tertiary)" }}
        >
          {preset.description}
        </div>
      </div>
    </button>
  );
}
