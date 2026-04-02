import { motion } from "framer-motion";
import { AlertTriangle, Zap } from "lucide-react";
import type { LanguageData } from "./mockData";

interface LanguageSignalProps {
  languages: LanguageData[];
}

export default function LanguageSignal({ languages }: LanguageSignalProps) {
  // Languages that don't match the artist's native content language(s)
  // Assume first 2 are "native" and the rest are mismatch
  const nativeLanguages = languages.slice(0, 2).map((l) => l.language);
  const mismatchPct = languages
    .filter((l) => !nativeLanguages.includes(l.language))
    .reduce((sum, l) => sum + l.pct, 0);
  const mismatchNames = languages
    .filter((l) => !nativeLanguages.includes(l.language))
    .map((l) => l.language)
    .join(", ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
    >
      {/* Language bars */}
      <div
        style={{
          background: "var(--surface, #1C1C1E)",
          border: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            fontWeight: 500,
            color: "var(--ink-tertiary, rgba(255,255,255,0.55))",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            display: "block",
            marginBottom: 20,
          }}
        >
          Comment Language Distribution
        </span>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {languages.map((lang) => (
            <div
              key={lang.language}
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>
                {lang.flag}
              </span>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--ink, rgba(255,255,255,0.87))",
                  width: 90,
                }}
              >
                {lang.language}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  background: "var(--card-edge, rgba(255,255,255,0.04))",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${lang.pct}%`,
                    height: "100%",
                    background: lang.color,
                    borderRadius: 4,
                    transition: "width 400ms ease",
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--ink-tertiary, rgba(255,255,255,0.55))",
                  width: 38,
                  textAlign: "right",
                }}
              >
                {lang.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mismatch alert + quick win */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            background: "var(--surface, #1C1C1E)",
            border: "1px solid rgba(255, 69, 58, 0.2)",
            borderRadius: 16,
            padding: 24,
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={16} color="var(--red, #FF453A)" />
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: "var(--red, #FF453A)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Content vs Audience Mismatch
            </span>
          </div>
          <div
            style={{
              background: "rgba(255, 69, 58, 0.06)",
              border: "1px solid rgba(255, 69, 58, 0.12)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <p
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                color: "var(--ink-secondary, rgba(255,255,255,0.8))",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              <strong style={{ color: "var(--red, #FF453A)" }}>100%</strong> of
              content is in {nativeLanguages.join("/")} but{" "}
              <strong style={{ color: "var(--red, #FF453A)" }}>
                {mismatchPct}%
              </strong>{" "}
              of engagement comes from {mismatchNames} speakers.
            </p>
          </div>
        </div>

        <div
          style={{
            background: "var(--surface, #1C1C1E)",
            border: "1px solid rgba(48, 209, 88, 0.15)",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Zap size={16} color="var(--green, #30D158)" />
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: "var(--green, #30D158)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Quick Win
            </span>
          </div>
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              color: "var(--ink-secondary, rgba(255,255,255,0.7))",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Add subtitles in the top non-native language to your next 3 TikTok
            posts. Fans are already engaging in the comments — native-language
            hooks could unlock the next top city within 4 weeks.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
