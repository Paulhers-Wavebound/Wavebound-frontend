import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BadgeCheck, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import InfoTooltip from "@/components/label/intelligence/InfoTooltip";
import { STAT_TOOLTIPS } from "@/lib/statTooltips";

const tierConfig: Record<string, { label: string; color: string; bg: string }> =
  {
    viral: { label: "Viral", color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
    breakout: {
      label: "Breakout",
      color: "#30D158",
      bg: "rgba(48,209,88,0.12)",
    },
    momentum: {
      label: "Momentum",
      color: "#FF9F0A",
      bg: "rgba(255,159,10,0.12)",
    },
    stable: { label: "Stable", color: "#8E8E93", bg: "rgba(142,142,147,0.12)" },
    stalled: { label: "Stalled", color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
  };

function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function postAgeLabel(days: number | null): { text: string; color: string } {
  if (days == null)
    return { text: "No recent posts", color: "rgba(255,255,255,0.30)" };
  if (days === 0) return { text: "Posted today", color: "#30D158" };
  if (days <= 3) return { text: `Posted ${days}d ago`, color: "#30D158" };
  if (days <= 7) return { text: `Posted ${days}d ago`, color: "#FFD60A" };
  return { text: `Posted ${days}d ago`, color: "#FF453A" };
}

interface ProfileHeaderProps {
  artistName: string;
  artistHandle: string;
  avatarUrl: string | null;
  momentumTier: string;
  daysSinceLastPost: number | null;
  tiktokFollowers: number | null;
  instagramFollowers: number | null;
  monthlyListeners: number | null;
  inviteCode: string | null;
}

export default function ProfileHeader({
  artistName,
  artistHandle,
  avatarUrl,
  momentumTier,
  daysSinceLastPost,
  tiktokFollowers,
  instagramFollowers,
  monthlyListeners,
  inviteCode,
}: ProfileHeaderProps) {
  const { toast } = useToast();
  const tier = tierConfig[momentumTier] || tierConfig.stable;
  const postAge = postAgeLabel(daysSinceLastPost);

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      {/* Profile card */}
      <div
        style={{
          flex: "1 1 400px",
          background: "#1C1C1E",
          borderRadius: 16,
          borderTop: "0.5px solid rgba(255,255,255,0.04)",
          padding: "24px 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <Avatar className="w-14 h-14" style={{ flexShrink: 0 }}>
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback
              style={{
                fontSize: 20,
                background: "#2C2C2E",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              {artistName?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name + badges */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: 22,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.87)",
                  margin: 0,
                  lineHeight: 1.2,
                  letterSpacing: "-0.3px",
                }}
              >
                {artistName}
              </h1>
              <BadgeCheck
                size={16}
                style={{ color: "#0A84FF", flexShrink: 0 }}
              />
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 10px",
                  borderRadius: 12,
                  background: tier.bg,
                  color: tier.color,
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {tier.label}
                <InfoTooltip text={STAT_TOOLTIPS.header.momentumTier} />
              </span>
            </div>

            {/* Handle */}
            <div
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 13,
                color: "rgba(255,255,255,0.35)",
                marginTop: 3,
              }}
            >
              @{artistHandle?.replace(/^@+/, "")}
            </div>

            {/* Platform stats */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 12,
                flexWrap: "wrap",
              }}
            >
              {tiktokFollowers != null && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    color: "rgba(255,255,255,0.40)",
                  }}
                >
                  TikTok:{" "}
                  <span
                    style={{ fontWeight: 600, color: "rgba(255,255,255,0.87)" }}
                  >
                    {fmtNum(tiktokFollowers)}
                  </span>
                  <InfoTooltip text={STAT_TOOLTIPS.header.tiktokFollowers} />
                </span>
              )}
              {instagramFollowers != null && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    color: "rgba(255,255,255,0.40)",
                  }}
                >
                  IG:{" "}
                  <span
                    style={{ fontWeight: 600, color: "rgba(255,255,255,0.87)" }}
                  >
                    {fmtNum(instagramFollowers)}
                  </span>
                  <InfoTooltip text={STAT_TOOLTIPS.header.instagramFollowers} />
                </span>
              )}
              {monthlyListeners != null && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    color: "rgba(255,255,255,0.40)",
                  }}
                >
                  Spotify:{" "}
                  <span
                    style={{ fontWeight: 600, color: "rgba(255,255,255,0.87)" }}
                  >
                    {fmtNum(monthlyListeners)} listeners
                  </span>
                  <InfoTooltip text={STAT_TOOLTIPS.header.monthlyListeners} />
                </span>
              )}
            </div>

            {/* Last posted */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                color: postAge.color,
                marginTop: 8,
              }}
            >
              {postAge.text}
              <InfoTooltip text={STAT_TOOLTIPS.header.daysSinceLastPost} />
            </div>
          </div>
        </div>
      </div>

      {/* Invite code */}
      {inviteCode && (
        <div
          style={{
            flex: "0 1 auto",
            minWidth: 240,
            background: "#1C1C1E",
            borderRadius: 16,
            borderTop: "0.5px solid rgba(255,255,255,0.04)",
            padding: "24px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.30)",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  marginBottom: 6,
                }}
              >
                INVITE CODE
                <InfoTooltip text={STAT_TOOLTIPS.header.inviteCode} />
              </div>
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 18,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.87)",
                  letterSpacing: "0.5px",
                }}
              >
                {inviteCode}
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteCode);
                toast({ title: "Copied to clipboard" });
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.45)",
                transition: "background 150ms",
                flexShrink: 0,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
              }
            >
              <Copy size={15} />
            </button>
          </div>
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              color: "rgba(255,255,255,0.20)",
              marginTop: 8,
              lineHeight: 1.4,
            }}
          >
            Share with the artist for Wavebound app access
          </div>
        </div>
      )}
    </div>
  );
}
