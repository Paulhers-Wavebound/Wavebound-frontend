import { useState } from "react";
import { Send, Mail, Hash, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/contexts/UserProfileContext";
import {
  useDecisionPointActions,
  useLabelTeammates,
  type ForwardTarget,
} from "@/hooks/useDecisionPointActions";
import type { DecisionPoint } from "@/data/contentDashboardHelpers";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisionPoint: DecisionPoint;
  briefDate: string;
}

export default function ForwardDecisionDialog({
  open,
  onOpenChange,
  decisionPoint,
  briefDate,
}: Props) {
  const { labelId } = useUserProfile();
  const { forward } = useDecisionPointActions(briefDate);
  const teammates = useLabelTeammates(labelId);

  const [tab, setTab] = useState<ForwardTarget>("user");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [slackChannel, setSlackChannel] = useState("");
  const [note, setNote] = useState("");

  const reset = () => {
    setTab("user");
    setSelectedUser(null);
    setEmail("");
    setSlackChannel("");
    setNote("");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const canSubmit = (() => {
    if (forward.isPending) return false;
    if (tab === "user") return !!selectedUser;
    if (tab === "email") return /^\S+@\S+\.\S+$/.test(email);
    if (tab === "slack") return slackChannel.trim().length > 0;
    return false;
  })();

  const handleSubmit = async () => {
    let targetValue = "";
    if (tab === "user") targetValue = selectedUser ?? "";
    if (tab === "email") targetValue = email.trim();
    if (tab === "slack")
      targetValue = slackChannel.trim().startsWith("#")
        ? slackChannel.trim()
        : `#${slackChannel.trim()}`;

    forward.mutate(
      {
        dp: decisionPoint,
        target: tab,
        targetValue,
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => handleClose(false),
      },
    );
  };

  const visibleTeammates = (teammates.data ?? []).filter(
    (t) => !!t.user_id, // skip nulls
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] bg-[#1C1C1E] border-white/[0.06] text-white/87">
        <DialogHeader>
          <DialogTitle className="text-white/87 font-normal">
            Forward decision point
          </DialogTitle>
          <DialogDescription className="text-white/55">
            <span className="font-medium text-white/75">
              {decisionPoint.artist_name}
            </span>
            {" — "}
            {decisionPoint.signal}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as ForwardTarget)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 bg-white/[0.04]">
            <TabsTrigger
              value="user"
              className="data-[state=active]:bg-white/[0.08]"
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Teammate
            </TabsTrigger>
            <TabsTrigger
              value="email"
              className="data-[state=active]:bg-white/[0.08]"
            >
              <Mail className="w-3.5 h-3.5 mr-1.5" />
              Email
            </TabsTrigger>
            <TabsTrigger
              value="slack"
              className="data-[state=active]:bg-white/[0.08]"
            >
              <Hash className="w-3.5 h-3.5 mr-1.5" />
              Slack
            </TabsTrigger>
          </TabsList>

          <TabsContent value="user" className="mt-4">
            {teammates.isLoading ? (
              <div className="text-[12px] text-white/55 py-4 text-center">
                Loading teammates…
              </div>
            ) : visibleTeammates.length === 0 ? (
              <div className="text-[12px] text-white/55 py-4 text-center">
                No teammates on this label yet.
              </div>
            ) : (
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {visibleTeammates.map((t) => {
                  const display =
                    t.artist_handle || t.email || t.user_id.slice(0, 8);
                  const isSelected = selectedUser === t.user_id;
                  return (
                    <button
                      key={t.user_id}
                      type="button"
                      onClick={() => setSelectedUser(t.user_id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-[13px] transition ${
                        isSelected
                          ? "bg-[#e8430a]/15 border border-[#e8430a]/40"
                          : "bg-white/[0.03] border border-transparent hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="text-white/87">{display}</div>
                      {t.email && t.artist_handle && (
                        <div className="text-[11px] text-white/40">
                          {t.email}
                        </div>
                      )}
                      {t.label_role && (
                        <div className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">
                          {t.label_role}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="email" className="mt-4">
            <Input
              type="email"
              placeholder="name@label.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/[0.04] border-white/[0.08] text-white/87 placeholder:text-white/30"
            />
            <p className="text-[11px] text-white/40 mt-2">
              Sends a formatted email via Wavebound.
            </p>
          </TabsContent>

          <TabsContent value="slack" className="mt-4">
            <Input
              type="text"
              placeholder="#content-strategy"
              value={slackChannel}
              onChange={(e) => setSlackChannel(e.target.value)}
              className="bg-white/[0.04] border-white/[0.08] text-white/87 placeholder:text-white/30"
            />
            <p className="text-[11px] text-white/40 mt-2">
              Posts to your label's configured Slack workspace. The webhook
              decides the actual channel — this name is recorded for audit.
            </p>
          </TabsContent>
        </Tabs>

        <div className="space-y-1.5">
          <label className="text-[11px] uppercase tracking-wider text-white/40">
            Note (optional)
          </label>
          <Textarea
            placeholder="Why are you forwarding this?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="bg-white/[0.04] border-white/[0.08] text-white/87 placeholder:text-white/30 resize-none"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleClose(false)}
            className="text-white/55 hover:bg-white/[0.06] hover:text-white/87"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-[#e8430a] hover:bg-[#e8430a]/90 text-white"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            {forward.isPending ? "Sending…" : "Forward"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
