import ComingSoon from "@/components/coming-soon/ComingSoon";

export default function SoundIntelligencePreview() {
  return (
    <div style={{ padding: "32px 24px 80px" }}>
      <ComingSoon label="Q2 2026">
        <div
          style={{
            textAlign: "center",
            padding: "60px 24px",
            fontFamily: '"DM Sans", sans-serif',
            color: "var(--ink-tertiary)",
            fontSize: 14,
          }}
        >
          Sound Intelligence — AI-powered TikTok sound analysis
        </div>
      </ComingSoon>
    </div>
  );
}
