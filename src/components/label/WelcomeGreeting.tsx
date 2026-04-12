import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { SignalReport } from "@/data/contentDashboardHelpers";

/* ─── Greeting logic ─────────────────────────────────────── */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function generateWelcomeMessage(
  totalArtists: number,
  report: SignalReport | null,
): { summary: string; detail: string } {
  const metrics = report?.metrics;
  const dps = report?.decisionPoints ?? [];

  const breakout = metrics?.breakoutCount ?? 0;
  const atRisk = metrics?.atRiskCount ?? 0;
  const urgentNow = dps.filter((d) => d.urgency === "now").length;
  const urgentToday = dps.filter((d) => d.urgency === "today").length;
  const totalDecisions = dps.length;

  // Summary — calm roster health
  let summary: string;
  if (atRisk === 0 && urgentNow === 0) {
    summary =
      breakout > 0
        ? `Your roster of ${totalArtists} artists is looking strong today. ${breakout} ${breakout === 1 ? "is" : "are"} on breakout momentum.`
        : `Your roster of ${totalArtists} artists is looking steady today. No fires, no surprises.`;
  } else if (atRisk > 0 && breakout > 0) {
    summary = `Your roster of ${totalArtists} artists has a mixed morning. ${atRisk} could use attention, but ${breakout} ${breakout === 1 ? "is" : "are"} riding strong momentum.`;
  } else if (atRisk > 0) {
    summary = `Your roster of ${totalArtists} artists has ${atRisk} that could use your eye today. Nothing dramatic — just worth a look.`;
  } else {
    summary = `Quiet morning across your ${totalArtists} artists. A few things to review when you're ready.`;
  }

  // Detail — what the brief contains
  let detail: string;
  if (urgentNow > 0) {
    const rest = totalDecisions - urgentNow;
    detail =
      rest > 0
        ? `${urgentNow} ${urgentNow === 1 ? "decision needs" : "decisions need"} your call today, plus ${rest} more to consider.`
        : `${urgentNow} ${urgentNow === 1 ? "decision needs" : "decisions need"} your call today.`;
  } else if (urgentToday > 0) {
    detail = `${urgentToday} ${urgentToday === 1 ? "item" : "items"} to review at your pace. Nothing that can't wait for coffee.`;
  } else if (totalDecisions > 0) {
    detail = `${totalDecisions} things on the radar this week. All manageable.`;
  } else {
    detail = "Nothing urgent on the radar. Let's take a look.";
  }

  return { summary, detail };
}

/* ─── Avatar extraction ──────────────────────────────────── */

interface AvatarPreview {
  name: string;
  avatarUrl: string;
  initial: string;
}

function extractAvatars(report: SignalReport | null): AvatarPreview[] {
  if (!report) return [];
  const seen = new Set<string>();
  const result: AvatarPreview[] = [];

  for (const dp of report.decisionPoints) {
    const name = dp.artist_name;
    if (seen.has(name) || !dp.avatar_url) continue;
    seen.add(name);
    result.push({
      name,
      avatarUrl: dp.avatar_url,
      initial: name.charAt(0).toUpperCase(),
    });
    if (result.length >= 5) break;
  }
  return result;
}

/* ─── Component ──────────────────────────────────────────── */

interface WelcomeGreetingProps {
  userName: string | null;
  totalArtists: number;
  signalReport: SignalReport | null;
  onReveal: () => void;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function WelcomeGreeting({
  userName,
  totalArtists,
  signalReport,
  onReveal,
}: WelcomeGreetingProps) {
  const greeting = getGreeting();
  const displayName = userName || "there";
  const { summary, detail } = generateWelcomeMessage(totalArtists, signalReport);
  const avatars = extractAvatars(signalReport);

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 md:py-24"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <div className="max-w-[520px] mx-auto text-center">
        {/* Greeting */}
        <motion.h2
          variants={fadeUp}
          className="mb-6"
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: "32px",
            fontWeight: 400,
            color: "rgba(255,255,255,0.87)",
            letterSpacing: "-0.01em",
          }}
        >
          {greeting}, {displayName}
        </motion.h2>

        {/* Summary */}
        <motion.p
          variants={fadeUp}
          className="mb-2"
          style={{
            fontFamily: '"Tiempos Text", Georgia, serif',
            fontSize: "17px",
            lineHeight: 1.75,
            color: "rgba(255,255,255,0.50)",
          }}
        >
          {summary}
        </motion.p>

        {/* Detail */}
        <motion.p
          variants={fadeUp}
          style={{
            fontFamily: '"Tiempos Text", Georgia, serif',
            fontSize: "16px",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          {detail}
        </motion.p>

        {/* Divider */}
        <motion.div
          variants={fadeUp}
          className="mx-auto my-8"
          style={{
            width: "60px",
            height: "1px",
            background: "rgba(255,255,255,0.08)",
          }}
        />

        {/* Avatar row */}
        {avatars.length > 0 && (
          <motion.div variants={fadeUp} className="flex flex-col items-center mb-10">
            <div className="flex items-center justify-center">
              {avatars.map((a, i) => (
                <AvatarCircle key={a.name} avatar={a} index={i} />
              ))}
            </div>
            <span
              className="mt-3 uppercase tracking-widest"
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: "11px",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              In today's brief
            </span>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div variants={fadeUp}>
          <button
            onClick={onReveal}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 transition-all duration-200"
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: "14px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.55)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "rgba(255,255,255,0.87)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(255,255,255,0.55)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
            }}
          >
            View your brief
            <ArrowRight size={14} style={{ opacity: 0.6 }} />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Avatar circle ──────────────────────────────────────── */

function AvatarCircle({ avatar, index }: { avatar: AvatarPreview; index: number }) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className="relative rounded-full overflow-hidden shrink-0"
      style={{
        width: "36px",
        height: "36px",
        border: "2px solid rgba(255,255,255,0.08)",
        marginLeft: index === 0 ? 0 : "-8px",
        zIndex: 10 - index,
      }}
      title={avatar.name}
    >
      {!failed ? (
        <img
          src={avatar.avatarUrl}
          alt={avatar.name}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background: "#2C2C2E",
            fontSize: "13px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          {avatar.initial}
        </div>
      )}
    </div>
  );
}
