import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { RosterMetric } from "@/components/label/RosterCard";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labelId: string | null;
  labelName: string | null;
  existingHandles: string[];
  onArtistAdded: (stub: RosterMetric) => void;
}

export default function UniversalAddArtistModal({
  open,
  onOpenChange,
  labelId,
  labelName,
  existingHandles,
  onArtistAdded,
}: Props) {
  const { toast } = useToast();
  const [handle, setHandle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cleanHandle = handle.trim().replace(/^@/, "").toLowerCase();
  const cleanIg = instagramHandle.trim().replace(/^@/, "").toLowerCase();

  // Reset on close
  useEffect(() => {
    if (!open) {
      setHandle("");
      setArtistName("");
      setInstagramHandle("");
      setError("");
    }
  }, [open]);

  async function handleSubmit() {
    if (!cleanHandle) {
      setError("handle");
      return;
    }
    if (!artistName.trim()) {
      setError("name");
      return;
    }
    setError("");

    if (!labelId) {
      toast({
        title: "Label not loaded yet",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    if (existingHandles.includes(cleanHandle)) {
      toast({
        title: "This artist is already on the roster",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase
        .from("artist_intelligence" as any)
        .insert({
          artist_handle: cleanHandle,
          label_id: labelId,
          status: "processing",
        });

      await supabase
        .from("roster_dashboard_metrics" as any)
        .insert({ artist_handle: cleanHandle, label_id: labelId });

      const { error: funcError } = await supabase.functions.invoke(
        "start-onboarding",
        {
          body: {
            tiktok_handle: cleanHandle,
            artist_name: artistName.trim(),
            instagram_handle: cleanIg || cleanHandle,
            platform: "tiktok",
            initiated_by: user?.id || null,
            label_id: labelId,
          },
        },
      );

      if (funcError) throw funcError;

      onArtistAdded({
        artist_handle: cleanHandle,
        artist_name: artistName.trim(),
        avatar_url: null,
        momentum_tier: null,
        risk_level: "ok",
        performance_ratio_current: null,
        days_since_last_post: null,
        release_readiness_score: null,
        risk_flags: null,
        pipeline_status: "processing",
      });

      toast({
        title: `Pipeline started for @${cleanHandle}`,
        description: "Analysis will be ready in ~2 hours",
      });
      onOpenChange(false);
    } catch {
      toast({
        title: "Failed to start pipeline — try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = (field?: string) => ({
    background: "#2C2C2E",
    color: "#fff",
    borderColor: error === field ? "#FF453A" : "#3A3A3C",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-0 shadow-2xl"
        style={{ background: "#1C1C1E", maxWidth: 480, borderRadius: 16 }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-base font-semibold"
            style={{ color: "#fff" }}
          >
            Add Artist{labelName ? ` to ${labelName}` : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 pt-2">
          {/* TikTok Handle */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "#8E8E93" }}>
              TikTok Handle *
            </label>
            <input
              type="text"
              placeholder="noahkahanmusic"
              value={handle}
              onChange={(e) => {
                setHandle(e.target.value);
                if (error === "handle") setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none border"
              style={inputStyle("handle")}
            />
            {error === "handle" && (
              <p className="text-xs" style={{ color: "#FF453A" }}>
                Enter a TikTok handle
              </p>
            )}
          </div>

          {/* Artist Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "#8E8E93" }}>
              Artist Name *
            </label>
            <input
              type="text"
              placeholder="Noah Kahan"
              value={artistName}
              onChange={(e) => {
                setArtistName(e.target.value);
                if (error === "name") setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none border"
              style={inputStyle("name")}
            />
            {error === "name" && (
              <p className="text-xs" style={{ color: "#FF453A" }}>
                Enter the artist name
              </p>
            )}
          </div>

          {/* Instagram Handle */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "#8E8E93" }}>
              Instagram Handle
            </label>
            <input
              type="text"
              placeholder="noahkahanmusic"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none border"
              style={inputStyle()}
            />
            <p className="text-[11px]" style={{ color: "#636366" }}>
              Defaults to TikTok handle if left empty
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !labelId}
            className="w-full rounded-lg font-medium"
            style={{ background: "#30D158", color: "#fff" }}
          >
            {submitting ? "Starting..." : "Add & Start Analysis"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
