import { useState, useEffect, useCallback, useRef } from "react";
import { callAdminOnboarding } from "@/utils/adminOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Eye,
  Download,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LabelRow {
  id: string;
  name: string;
  slug: string;
  invite_code: string;
  is_active: boolean;
  contact_email: string;
  onboarding_status: "generating" | "pending_review" | "live";
  artist_count: number;
  approved_count: number;
  all_approved: boolean;
  created_at: string;
}

interface Phase {
  name: string;
  status: string;
}
interface PipelineJob {
  artist_handle: string;
  artist_name: string;
  status: string;
  current_phase: string;
  completed_phases: number;
  total_phases: number;
  phases: Phase[];
  plan_review_status: string;
  invite_code?: string;
}

interface ArtistInput {
  artist_name: string;
  artist_handle: string;
  instagram_handle: string;
}

type View = "list" | "form" | "detail";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const stripAt = (v: string) => v.replace(/^@/, "").toLowerCase();

function StatusBadge({
  status,
  allApproved,
  allCompleted,
}: {
  status: string;
  allApproved?: boolean;
  allCompleted?: boolean;
}) {
  if (status === "generating" && allApproved)
    return (
      <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
        Ready to Upload
      </Badge>
    );
  if (status === "generating" && allCompleted)
    return (
      <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
        Awaiting Approval
      </Badge>
    );
  if (status === "generating")
    return (
      <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30 animate-pulse">
        Generating
      </Badge>
    );
  if (status === "pending_review")
    return (
      <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
        Ready for Review
      </Badge>
    );
  if (status === "live")
    return (
      <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
        Live
      </Badge>
    );
  return (
    <Badge className="bg-[#1C1C1E] text-[#a8a29e] border-[#1C1C1E]">
      {status}
    </Badge>
  );
}

function JobStatusBadge({ status }: { status: string }) {
  if (status === "completed")
    return (
      <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">
        Completed
      </Badge>
    );
  if (status === "failed")
    return (
      <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">
        Failed
      </Badge>
    );
  if (status === "running" || status === "processing")
    return (
      <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-xs animate-pulse">
        Running
      </Badge>
    );
  return (
    <Badge className="bg-[#1C1C1E] text-[#a8a29e] border-[#1C1C1E] text-xs">
      {status}
    </Badge>
  );
}

function ReviewBadge({ status }: { status: string }) {
  if (status === "approved")
    return (
      <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">
        Approved
      </Badge>
    );
  if (status === "needs_changes")
    return (
      <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30 text-xs">
        Flagged
      </Badge>
    );
  return (
    <Badge className="bg-[#1C1C1E] text-[#a8a29e] border-[#1C1C1E] text-xs">
      Needs Review
    </Badge>
  );
}

function PhaseIcon({ status }: { status: string }) {
  if (status === "completed") return <span className="text-green-400">✅</span>;
  if (status === "failed") return <span className="text-red-400">❌</span>;
  if (status === "running")
    return <span className="animate-pulse text-blue-400">⏳</span>;
  return <span className="text-[#a8a29e]">⏳</span>;
}

function PhaseDots({
  phases,
  completedPhases,
  totalPhases,
}: {
  phases: Phase[];
  completedPhases: number;
  totalPhases: number;
}) {
  const total = totalPhases || 8;
  const dots = [];
  for (let i = 0; i < total; i++) {
    const phase = phases?.[i];
    let cls = "w-3 h-3 rounded-full border ";
    if (phase?.status === "completed") cls += "bg-green-500 border-green-500";
    else if (phase?.status === "failed") cls += "bg-red-500 border-red-500";
    else if (phase?.status === "running")
      cls += "bg-blue-500 border-blue-500 animate-pulse";
    else cls += "bg-transparent border-[#a8a29e]/40";
    dots.push(<span key={i} className={cls} />);
  }
  return <div className="flex items-center gap-1">{dots}</div>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        copy();
      }}
      className="inline-flex items-center gap-1 text-xs text-[#a8a29e] hover:text-[#ede8dc] transition-colors"
    >
      <code className="bg-[#111] px-1.5 py-0.5 rounded text-xs font-mono">
        {text}
      </code>
      {copied ? (
        <Check className="h-3 w-3 text-green-400" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function AdminOnboarding() {
  const { toast } = useToast();
  const [view, setView] = useState<View>("list");
  const [labels, setLabels] = useState<LabelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<LabelRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LabelRow | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchLabels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callAdminOnboarding("list_labels");
      setLabels(data.labels || []);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const handleDeleteLabel = async () => {
    if (!deleteTarget || confirmName !== deleteTarget.name) return;
    setDeleting(true);
    try {
      const res = await callAdminOnboarding("delete_label", {
        label_id: deleteTarget.id,
        confirm_name: confirmName,
      });
      if (!res?.success)
        throw new Error(res?.error || "Server did not confirm deletion");
      toast({
        title: `Deleted "${deleteTarget.name}"`,
        description: `${res.deleted_artists || 0} artists removed.`,
      });
      setLabels((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
      setConfirmName("");
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const openDetail = (label: LabelRow) => {
    setSelectedLabel(label);
    setView("detail");
  };

  if (view === "form")
    return (
      <OnboardingForm
        onBack={() => setView("list")}
        onSuccess={(label) => {
          fetchLabels();
          setSelectedLabel(label);
          setView("detail");
        }}
      />
    );
  if (view === "detail" && selectedLabel)
    return (
      <LabelDetail
        label={selectedLabel}
        onBack={() => {
          fetchLabels();
          setView("list");
        }}
        onRefreshLabel={(l) => setSelectedLabel(l)}
      />
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#ede8dc]">
          Label Onboarding
        </h2>
        <Button
          onClick={() => setView("form")}
          className="bg-[#e8430a] hover:bg-[#e8430a]/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" /> New Onboarding
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#a8a29e]" />
        </div>
      ) : labels.length === 0 ? (
        <div className="bg-[#1C1C1E] border border-[#1C1C1E] rounded-lg py-12 text-center text-[#a8a29e]">
          No labels onboarded yet. Click "New Onboarding" to get started.
        </div>
      ) : (
        <div className="space-y-1.5">
          {labels.map((l) => (
            <div
              key={l.id}
              className="bg-[#1C1C1E] border border-[#1C1C1E] hover:border-[#e8430a]/40 rounded-lg py-2.5 px-4 cursor-pointer transition-colors"
              onClick={() => openDetail(l)}
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-0.5">
                    <span className="font-bold text-lg text-[#ede8dc] truncate">
                      {l.name}
                    </span>
                    <StatusBadge
                      status={l.onboarding_status}
                      allApproved={l.all_approved}
                    />
                  </div>
                  <div className="text-xs text-[#a8a29e]">
                    {l.artist_count} artist{l.artist_count !== 1 ? "s" : ""} ·{" "}
                    {l.approved_count}/{l.artist_count} approved · Created{" "}
                    {formatDistanceToNow(new Date(l.created_at), {
                      addSuffix: true,
                    })}
                  </div>
                  {l.contact_email && (
                    <div className="text-xs text-[#a8a29e] mt-0.5">
                      {l.contact_email}
                    </div>
                  )}
                </div>
                <CopyButton text={l.invite_code} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(l);
                    setConfirmName("");
                  }}
                  className="p-1.5 rounded hover:bg-red-500/20 text-[#a8a29e] hover:text-red-400 transition-colors"
                  title="Delete label"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setConfirmName("");
          }
        }}
      >
        <AlertDialogContent className="bg-[#0a0a0a] border-[#1C1C1E]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">
              Delete Label
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#a8a29e]">
              This will{" "}
              <strong className="text-[#ede8dc]">permanently delete</strong> the
              label
              <strong className="text-[#ede8dc]">
                {" "}
                "{deleteTarget?.name}"
              </strong>{" "}
              and
              <strong className="text-[#ede8dc]">
                {" "}
                all {deleteTarget?.artist_count || 0} artists
              </strong>{" "}
              on it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm text-[#a8a29e]">
              Type{" "}
              <strong className="text-[#ede8dc]">{deleteTarget?.name}</strong>{" "}
              to confirm:
            </p>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={deleteTarget?.name}
              className="bg-[#1C1C1E] border-[#2a2a2a] text-[#ede8dc]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#1C1C1E] border-[#2a2a2a] text-[#a8a29e] hover:text-[#ede8dc]">
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={confirmName !== deleteTarget?.name || deleting}
              onClick={handleDeleteLabel}
            >
              {deleting ? "Deleting…" : "Delete Label & All Artists"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Onboarding Form                                                    */
/* ------------------------------------------------------------------ */

function OnboardingForm({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: (label: any) => void;
}) {
  const { toast } = useToast();
  const [labelName, setLabelName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [artists, setArtists] = useState<ArtistInput[]>([
    { artist_name: "", artist_handle: "", instagram_handle: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const updateArtist = (i: number, field: keyof ArtistInput, value: string) => {
    setArtists((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)),
    );
  };

  const handleBlur = (
    i: number,
    field: "artist_handle" | "instagram_handle",
  ) => {
    setArtists((prev) =>
      prev.map((a, idx) =>
        idx === i ? { ...a, [field]: stripAt(a[field]) } : a,
      ),
    );
  };

  const addRow = () =>
    setArtists((prev) => [
      ...prev,
      { artist_name: "", artist_handle: "", instagram_handle: "" },
    ]);
  const removeRow = (i: number) =>
    setArtists((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!labelName.trim()) {
      toast({ title: "Label name required", variant: "destructive" });
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes("@")) {
      toast({ title: "Valid email required", variant: "destructive" });
      return;
    }
    const validArtists = artists.filter(
      (a) => a.artist_name.trim() && a.artist_handle.trim(),
    );
    if (validArtists.length === 0) {
      toast({
        title: "At least 1 artist with name and handle required",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const data = await callAdminOnboarding("onboard_label", {
        label_name: labelName.trim(),
        contact_email: contactEmail.trim(),
        artists: validArtists.map((a) => ({
          artist_name: a.artist_name.trim(),
          artist_handle: stripAt(a.artist_handle),
          instagram_handle: a.instagram_handle.trim()
            ? stripAt(a.instagram_handle)
            : undefined,
        })),
      });
      toast({
        title: `Onboarding started for ${labelName}`,
        description: `${data.artists_triggered?.length || 0} pipelines fired. Welcome email sent.`,
      });
      onSuccess(
        data.label || {
          id: data.label_id,
          name: labelName,
          onboarding_status: "generating",
          invite_code: data.invite_code,
          contact_email: contactEmail,
          artist_count: validArtists.length,
          approved_count: 0,
          all_approved: false,
          created_at: new Date().toISOString(),
        },
      );
    } catch (e: any) {
      toast({
        title: "Onboarding failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-[#a8a29e] hover:text-[#ede8dc] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to labels
      </button>

      <h2 className="text-xl font-semibold text-[#ede8dc]">
        New Label Onboarding
      </h2>

      <div className="bg-[#1C1C1E] border border-[#1C1C1E] rounded-lg p-5 space-y-5">
        <div className="space-y-2">
          <Label className="text-[#a8a29e]">Label Name</Label>
          <Input
            value={labelName}
            onChange={(e) => setLabelName(e.target.value)}
            placeholder="Toothfairy Records"
            className="bg-[#111] border-[#2a2a2a] text-[#ede8dc] placeholder:text-[#a8a29e]/50"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#a8a29e]">Contact Email</Label>
          <Input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="a&r@toothfairy.com"
            className="bg-[#111] border-[#2a2a2a] text-[#ede8dc] placeholder:text-[#a8a29e]/50"
          />
        </div>

        <Separator className="bg-[#1C1C1E]" />

        <div className="space-y-3">
          <Label className="text-[#a8a29e]">Artists</Label>
          {artists.map((a, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end"
            >
              <Input
                value={a.artist_name}
                onChange={(e) => updateArtist(i, "artist_name", e.target.value)}
                placeholder="Artist Name *"
                className="bg-[#111] border-[#1C1C1E] text-[#ede8dc] placeholder:text-[#a8a29e]/50"
              />
              <Input
                value={a.artist_handle}
                onChange={(e) =>
                  updateArtist(i, "artist_handle", e.target.value)
                }
                onBlur={() => handleBlur(i, "artist_handle")}
                placeholder="TikTok handle *"
                className="bg-[#111] border-[#1C1C1E] text-[#ede8dc] placeholder:text-[#a8a29e]/50"
              />
              <Input
                value={a.instagram_handle}
                onChange={(e) =>
                  updateArtist(i, "instagram_handle", e.target.value)
                }
                onBlur={() => handleBlur(i, "instagram_handle")}
                placeholder="IG handle"
                className="bg-[#111] border-[#1C1C1E] text-[#ede8dc] placeholder:text-[#a8a29e]/50"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRow(i)}
                disabled={artists.length === 1}
                className="text-[#a8a29e] hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={addRow}
            className="mt-1 text-[#a8a29e] hover:text-[#ede8dc] hover:bg-[#1C1C1E]"
          >
            <Plus className="h-3 w-3 mr-1" /> Add Another Artist
          </Button>
        </div>
      </div>

      <Button
        onClick={submit}
        disabled={submitting}
        className="w-full h-12 bg-[#e8430a] hover:bg-[#e8430a]/90 text-white text-base font-medium"
      >
        {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
        Onboard Label
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Label Detail View                                                  */
/* ------------------------------------------------------------------ */

function LabelDetail({
  label,
  onBack,
  onRefreshLabel,
}: {
  label: LabelRow;
  onBack: () => void;
  onRefreshLabel: (l: LabelRow) => void;
}) {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<PipelineJob[]>([]);
  const [polling, setPolling] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);
  const [uploadConfirmOpen, setUploadConfirmOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showAddArtist, setShowAddArtist] = useState(false);
  const [addArtistName, setAddArtistName] = useState("");
  const [addArtistHandle, setAddArtistHandle] = useState("");
  const [addArtistIG, setAddArtistIG] = useState("");

  const [addingArtist, setAddingArtist] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPipeline = useCallback(async () => {
    try {
      setPolling(true);
      const data = await callAdminOnboarding("pipeline_status", {
        label_id: label.id,
      });
      setJobs(data.jobs || []);
    } catch {
      // silent
    } finally {
      setPolling(false);
    }
  }, [label.id]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  useEffect(() => {
    const allTerminal =
      jobs.length > 0 &&
      jobs.every((j) => j.status === "completed" || j.status === "failed");
    if (allTerminal) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(fetchPipeline, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [jobs, fetchPipeline]);

  const toggleExpand = (handle: string) => {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      next.has(handle) ? next.delete(handle) : next.add(handle);
      return next;
    });
  };

  const reviewArtist = async (
    handle: string,
    status: "approved" | "needs_changes",
  ) => {
    setReviewLoading(handle);
    try {
      await callAdminOnboarding("review_artist", {
        artist_handle: handle,
        status,
      });
      toast({ title: `${handle} marked as ${status.replace("_", " ")}` });
      await fetchPipeline();
      try {
        const data = await callAdminOnboarding("list_labels");
        const updated = (data.labels || []).find(
          (l: LabelRow) => l.id === label.id,
        );
        if (updated) onRefreshLabel(updated);
      } catch {}
    } catch (e: any) {
      toast({
        title: "Review failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setReviewLoading(null);
    }
  };

  const fetchDeliverableHtml = async (
    handle: string,
    column: string,
  ): Promise<string | null> => {
    const { data, error } = await supabase
      .from("artist_intelligence")
      .select(column)
      .eq("artist_handle", handle)
      .single();
    if (error) throw error;
    return data?.[column] || null;
  };

  const openDeliverable = async (handle: string, column: string) => {
    try {
      const html = await fetchDeliverableHtml(handle, column);
      if (!html) {
        toast({
          title: "Preview unavailable",
          description: "Deliverable may not be generated yet.",
          variant: "destructive",
        });
        return;
      }
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(html);
        w.document.close();
      }
    } catch (e: any) {
      toast({
        title: "Failed to load deliverable",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const downloadDeliverable = async (handle: string, column: string) => {
    try {
      const html = await fetchDeliverableHtml(handle, column);
      if (!html) {
        toast({
          title: "Download unavailable",
          description: "Deliverable may not be generated yet.",
          variant: "destructive",
        });
        return;
      }
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${handle}_${column.replace("_html", "")}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({
        title: "Download failed",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    setUploadLoading(true);
    try {
      await callAdminOnboarding("upload_label", { label_id: label.id });
      toast({
        title: `🎉 ${label.name} is live!`,
        description: "Portal ready email sent.",
      });
      onRefreshLabel({ ...label, onboarding_status: "live", is_active: true });
      setUploadConfirmOpen(false);
    } catch (e: any) {
      toast({
        title: "Upload failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleAddArtist = async () => {
    if (!addArtistName.trim() || !addArtistHandle.trim()) {
      toast({ title: "Name and handle required", variant: "destructive" });
      return;
    }
    setAddingArtist(true);
    try {
      await callAdminOnboarding("add_artist", {
        label_id: label.id,
        artist_name: addArtistName.trim(),
        artist_handle: stripAt(addArtistHandle),
        instagram_handle: addArtistIG.trim() ? stripAt(addArtistIG) : undefined,
      });
      toast({ title: `${addArtistName} added` });
      setAddArtistName("");
      setAddArtistHandle("");
      setAddArtistIG("");
      setShowAddArtist(false);
      fetchPipeline();
    } catch (e: any) {
      toast({
        title: "Failed to add artist",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setAddingArtist(false);
    }
  };

  const allTerminal =
    jobs.length > 0 &&
    jobs.every((j) => j.status === "completed" || j.status === "failed");
  const isPolling = !allTerminal && jobs.length > 0;

  const deliverables = [
    { col: "content_plan_html", label: "7-Day Plan" },
    { col: "intelligence_report_html", label: "Intel Report" },
    { col: "thirty_day_plan_html", label: "30-Day Plan" },
    { col: "artist_brief_html", label: "Artist Brief" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[#a8a29e] hover:text-[#ede8dc] transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to labels
          </button>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-[#ede8dc]">{label.name}</h2>
            <StatusBadge
              status={label.onboarding_status}
              allApproved={label.all_approved}
              allCompleted={allTerminal}
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-[#a8a29e]">
            <CopyButton text={label.invite_code} />
            <span>{label.contact_email}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPolling && (
            <span className="flex items-center gap-1.5 text-xs text-[#a8a29e]">
              <RefreshCw className="h-3 w-3 animate-spin" /> Refreshing…
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddArtist(!showAddArtist)}
            className="bg-[#1C1C1E] border-[#2a2a2a] text-[#a8a29e] hover:text-[#ede8dc] hover:bg-[#2a2a2a]"
          >
            <Plus className="h-3 w-3 mr-1" /> Add Artist
          </Button>
        </div>
      </div>

      {/* Add Artist Inline */}
      {showAddArtist && (
        <div className="bg-[#1C1C1E] border border-[#1C1C1E] rounded-lg p-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
            <Input
              value={addArtistName}
              onChange={(e) => setAddArtistName(e.target.value)}
              placeholder="Artist Name *"
              className="bg-[#111] border-[#1C1C1E] text-[#ede8dc] placeholder:text-[#a8a29e]/50"
            />
            <Input
              value={addArtistHandle}
              onChange={(e) => setAddArtistHandle(e.target.value)}
              onBlur={() => setAddArtistHandle(stripAt(addArtistHandle))}
              placeholder="TikTok handle *"
              className="bg-[#111] border-[#1C1C1E] text-[#ede8dc] placeholder:text-[#a8a29e]/50"
            />
            <Input
              value={addArtistIG}
              onChange={(e) => setAddArtistIG(e.target.value)}
              onBlur={() => setAddArtistIG(stripAt(addArtistIG))}
              placeholder="IG handle"
              className="bg-[#111] border-[#1C1C1E] text-[#ede8dc] placeholder:text-[#a8a29e]/50"
            />
            <Button
              onClick={handleAddArtist}
              disabled={addingArtist}
              size="sm"
              className="bg-[#e8430a] hover:bg-[#e8430a]/90 text-white"
            >
              {addingArtist ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Unified Artist List */}
      <div className="space-y-0.5">
        {jobs.length === 0 && (
          <div className="py-8 text-center text-sm text-[#a8a29e]">
            {polling ? "Loading pipeline data…" : "No pipeline jobs found."}
          </div>
        )}
        {jobs.map((job) => {
          const expanded = expandedJobs.has(job.artist_handle);
          const isCompleted = job.status === "completed";
          const isLoading = reviewLoading === job.artist_handle;

          return (
            <div
              key={job.artist_handle}
              className="bg-[#1C1C1E] border border-[#1C1C1E] rounded-lg"
            >
              {/* Main row — ~56px */}
              <div className="flex items-center gap-2 px-3 h-14">
                {/* Chevron */}
                <button
                  onClick={() => toggleExpand(job.artist_handle)}
                  className="text-[#a8a29e] hover:text-[#ede8dc] shrink-0"
                >
                  {expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {/* Name + handle */}
                <div className="min-w-0 flex items-center gap-2 shrink-0">
                  <span className="font-medium text-sm text-[#ede8dc] truncate">
                    {job.artist_name || job.artist_handle}
                  </span>
                  <span className="text-xs text-[#a8a29e]">
                    @{job.artist_handle}
                  </span>
                </div>

                {/* Status badge */}
                <JobStatusBadge status={job.status} />

                {/* Spacer */}
                <div className="flex-1" />

                {isCompleted ? (
                  /* Completed: Preview + Approve + Flag + Review badge */
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs bg-[#1C1C1E] border-[#2a2a2a] text-[#a8a29e] hover:text-[#ede8dc] hover:bg-[#2a2a2a]"
                        >
                          <Eye className="h-3 w-3 mr-1" /> Preview
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-44 p-1 bg-[#1C1C1E] border-[#2a2a2e]"
                        align="end"
                      >
                        {deliverables.map(({ col, label: lbl }) => (
                          <div key={col} className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                openDeliverable(job.artist_handle, col)
                              }
                              className="flex-1 text-left px-3 py-1.5 text-xs text-[#a8a29e] hover:text-[#ede8dc] hover:bg-[#111] rounded transition-colors flex items-center gap-2"
                            >
                              <ExternalLink className="h-3 w-3" /> {lbl}
                            </button>
                            <button
                              onClick={() =>
                                downloadDeliverable(job.artist_handle, col)
                              }
                              className="p-1.5 text-[#a8a29e] hover:text-[#ede8dc] hover:bg-[#111] rounded transition-colors"
                              title={`Download ${lbl}`}
                            >
                              <Download className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </PopoverContent>
                    </Popover>

                    <Button
                      size="sm"
                      disabled={isLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        reviewArtist(job.artist_handle, "approved");
                      }}
                      className={`h-7 text-xs ${
                        job.plan_review_status === "approved"
                          ? "bg-green-600/20 text-green-400 border border-green-600/40 hover:bg-green-600/30"
                          : "bg-transparent text-green-400 border border-green-600/40 hover:bg-green-600/20"
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "✅"
                      )}
                    </Button>

                    <Button
                      size="sm"
                      disabled={isLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        reviewArtist(job.artist_handle, "needs_changes");
                      }}
                      className={`h-7 text-xs ${
                        job.plan_review_status === "needs_changes"
                          ? "bg-orange-600/20 text-orange-400 border border-orange-600/40 hover:bg-orange-600/30"
                          : "bg-transparent text-orange-400 border border-orange-600/40 hover:bg-orange-600/20"
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "⚠️"
                      )}
                    </Button>

                    <ReviewBadge status={job.plan_review_status} />
                  </div>
                ) : (
                  /* In-progress: phase dots + phase text */
                  <div className="flex items-center gap-3">
                    <PhaseDots
                      phases={job.phases}
                      completedPhases={job.completed_phases}
                      totalPhases={job.total_phases}
                    />
                    <span className="text-xs text-[#a8a29e] whitespace-nowrap">
                      {job.current_phase ||
                        `${job.completed_phases}/${job.total_phases}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Expanded phase detail */}
              {expanded && job.phases && (
                <div className="px-3 pb-3 pt-0 ml-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {job.phases.map((p) => (
                      <div
                        key={p.name}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <PhaseIcon status={p.status} />
                        <span className="text-[#a8a29e] truncate">
                          {p.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upload Section */}
      <div className="bg-[#1C1C1E] border border-[#1C1C1E] rounded-lg p-4">
        {label.onboarding_status === "live" ? (
          <div className="text-center">
            <div className="text-green-400 font-semibold text-lg mb-1">
              ✅ Label is Live
            </div>
            <div className="text-[#a8a29e] text-sm">
              Invite code:{" "}
              <code className="bg-[#111] px-2 py-0.5 rounded font-mono">
                {label.invite_code}
              </code>
            </div>
          </div>
        ) : label.all_approved ? (
          <div className="text-center">
            <Button
              onClick={() => setUploadConfirmOpen(true)}
              className="w-full h-12 bg-[#e8430a] hover:bg-[#e8430a]/90 text-white text-base font-medium"
            >
              Upload — Go Live
            </Button>
            <p className="text-xs text-[#a8a29e] mt-2">
              Sends portal ready email to {label.contact_email}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <Button
              disabled
              className="w-full h-12 bg-[#1C1C1E] text-[#a8a29e] border border-[#1C1C1E] cursor-not-allowed opacity-60"
            >
              Approve all {label.artist_count} artists to upload
            </Button>
            <p className="text-xs text-[#a8a29e] mt-2">
              {label.approved_count}/{label.artist_count} approved
            </p>
          </div>
        )}
      </div>

      {/* Upload Confirmation */}
      <AlertDialog open={uploadConfirmOpen} onOpenChange={setUploadConfirmOpen}>
        <AlertDialogContent className="bg-[#1C1C1E] border-[#2a2a2e] text-[#ede8dc]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#ede8dc]">
              Go Live?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#a8a29e]">
              This will activate the portal for{" "}
              <strong className="text-[#ede8dc]">{label.name}</strong> and send
              the invite code{" "}
              <strong className="text-[#ede8dc]">{label.invite_code}</strong> to{" "}
              <strong className="text-[#ede8dc]">{label.contact_email}</strong>.
              Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1C1C1E] text-[#a8a29e] hover:text-[#ede8dc] hover:bg-[#111]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpload}
              disabled={uploadLoading}
              className="bg-[#e8430a] hover:bg-[#e8430a]/90 text-white"
            >
              {uploadLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Upload — Go Live
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
