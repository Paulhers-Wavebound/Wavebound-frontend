import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const tierConfig: Record<string, { label: string; color: string }> = {
  viral: {
    label: "Viral",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  breakout: {
    label: "Breakout",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  momentum: {
    label: "Momentum",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  stable: {
    label: "Stable",
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  },
  stalled: {
    label: "Stalled",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function postAgeColor(days: number | null): string {
  if (days == null) return "text-muted-foreground";
  if (days <= 3) return "text-green-400";
  if (days <= 7) return "text-amber-400";
  return "text-red-400";
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

  return (
    <>
      {/* Header Card */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16">
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback className="text-xl">
              {artistName?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">
                {artistName}
              </h1>
              <BadgeCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${tier.color}`}
              >
                {tier.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              @{artistHandle?.replace(/^@+/, "")}
            </p>

            {/* Platform stats */}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
              {tiktokFollowers != null && (
                <span>
                  TikTok:{" "}
                  <b className="text-foreground">{fmtNum(tiktokFollowers)}</b>
                </span>
              )}
              {instagramFollowers != null && (
                <span>
                  IG:{" "}
                  <b className="text-foreground">
                    {fmtNum(instagramFollowers)}
                  </b>
                </span>
              )}
              {monthlyListeners != null && (
                <span>
                  Spotify:{" "}
                  <b className="text-foreground">
                    {fmtNum(monthlyListeners)} listeners
                  </b>
                </span>
              )}
            </div>

            {/* Last posted */}
            <p className={`text-xs mt-2 ${postAgeColor(daysSinceLastPost)}`}>
              {daysSinceLastPost != null
                ? daysSinceLastPost === 0
                  ? "Posted today"
                  : `Posted ${daysSinceLastPost}d ago`
                : "No recent posts"}
            </p>
          </div>
        </div>
      </Card>

      {/* Artist Invite Code */}
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Artist Invite Code
            </p>
            {inviteCode ? (
              <p className="font-mono text-lg font-semibold text-foreground truncate">
                {inviteCode}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No invite code generated
              </p>
            )}
          </div>
          {inviteCode && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(inviteCode);
                toast({ title: "Copied to clipboard" });
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Share this code with the artist to give them access to their Wavebound
          app.
        </p>
      </Card>
    </>
  );
}
