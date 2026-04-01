import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useLabelPermissions, LabelRole } from "@/hooks/useLabelPermissions";
import LabelLayout from "./LabelLayout";
import {
  Copy,
  Check,
  Users,
  Music,
  Calendar,
  Mail,
  Link2,
  RefreshCw,
  Pencil,
  Power,
  ChevronDown,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/label/ConfirmDialog";

interface LabelInfo {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  invite_code: string;
  is_active: boolean;
  created_at: string;
  contact_email: string | null;
  onboarding_status: string;
}

interface TeamMember {
  user_id: string;
  email: string;
  account_type: string | null;
  label_role: string;
  joined_at: string;
}

interface RosterArtist {
  artist_handle: string;
}

const ROLE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  admin: { label: "Admin", color: "#e8430a", bg: "rgba(232,67,10,0.12)" },
  member: { label: "Member", color: "#0A84FF", bg: "rgba(10,132,255,0.12)" },
  viewer: {
    label: "Viewer",
    color: "var(--ink-tertiary)",
    bg: "rgba(255,255,255,0.06)",
  },
};

export default function LabelSettings() {
  const { labelId } = useUserProfile();
  const { canManage } = useLabelPermissions();
  const { toast } = useToast();

  const [label, setLabel] = useState<LabelInfo | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [artists, setArtists] = useState<RosterArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Admin editing state
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null);

  // Artist assignment state
  interface Assignment {
    user_id: string;
    email: string;
    label_role: string;
    artist_handle: string;
  }
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assigningMember, setAssigningMember] = useState<string | null>(null); // user_id being edited
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    variant: "default" | "destructive";
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    confirmLabel: "Confirm",
    variant: "default",
    onConfirm: () => {},
  });

  const fetchData = useCallback(async () => {
    if (!labelId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const [labelRes, membersRes, artistsRes, assignRes] = await Promise.all([
      supabase
        .from("labels")
        .select(
          "id, name, slug, logo_url, invite_code, is_active, created_at, contact_email, onboarding_status",
        )
        .eq("id", labelId)
        .maybeSingle(),
      supabase.rpc("get_label_members", { p_label_id: labelId }),
      supabase
        .from("artist_intelligence")
        .select("artist_handle")
        .eq("label_id", labelId),
      supabase.rpc("get_artist_assignments", { p_label_id: labelId }),
    ]);

    if (labelRes.data) setLabel(labelRes.data);
    if (membersRes.data) setMembers(membersRes.data as unknown as TeamMember[]);
    if (artistsRes.data) setArtists(artistsRes.data);
    if (assignRes.data)
      setAssignments(assignRes.data as unknown as Assignment[]);
    setLoading(false);
  }, [labelId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Close role dropdown on outside click
  useEffect(() => {
    if (!roleDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-role-dropdown]"))
        setRoleDropdownOpen(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [roleDropdownOpen]);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const updateLabel = async (updates: Partial<LabelInfo>) => {
    if (!label) return;
    setSaving(true);
    const { error } = await supabase
      .from("labels")
      .update(updates)
      .eq("id", label.id);
    setSaving(false);

    if (error) {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
    setLabel({ ...label, ...updates });
    toast({ title: "Updated successfully" });
    return true;
  };

  const handleSaveEmail = async () => {
    const trimmed = emailDraft.trim() || null;
    const ok = await updateLabel({
      contact_email: trimmed,
    } as Partial<LabelInfo>);
    if (ok) setEditingEmail(false);
  };

  const handleToggleActive = () => {
    if (!label) return;
    const next = !label.is_active;
    setConfirmDialog({
      open: true,
      title: next ? "Reactivate this label?" : "Deactivate this label?",
      description: next
        ? "This will restore access for all team members."
        : "Team members will lose access immediately.",
      confirmLabel: next ? "Reactivate" : "Deactivate",
      variant: next ? "default" : "destructive",
      onConfirm: () => updateLabel({ is_active: next }),
    });
  };

  const handleRegenerateInvite = () => {
    if (!label) return;
    setConfirmDialog({
      open: true,
      title: "Regenerate invite code?",
      description:
        "The old code will stop working immediately. Anyone with the old link will no longer be able to join.",
      confirmLabel: "Regenerate",
      variant: "destructive",
      onConfirm: async () => {
        const prefix =
          label.name
            .split(/\s+/)
            .filter(Boolean)
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 4) || "WB";
        const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const newCode = `${prefix}-${suffix}`;
        await updateLabel({ invite_code: newCode });
      },
    });
  };

  const handleChangeRole = async (targetUserId: string, newRole: LabelRole) => {
    if (!labelId) return;
    setRoleDropdownOpen(null);
    setSaving(true);
    const { error } = await supabase.rpc("update_label_member_role", {
      p_label_id: labelId,
      p_target_user_id: targetUserId,
      p_new_role: newRole,
    });
    setSaving(false);

    if (error) {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setMembers((prev) =>
      prev.map((m) =>
        m.user_id === targetUserId ? { ...m, label_role: newRole } : m,
      ),
    );
    toast({ title: `Role updated to ${ROLE_CONFIG[newRole].label}` });
  };

  const handleRemoveMember = (member: TeamMember) => {
    if (!labelId) return;
    setConfirmDialog({
      open: true,
      title: `Remove ${member.email}?`,
      description: "They will lose access to this label immediately.",
      confirmLabel: "Remove",
      variant: "destructive",
      onConfirm: async () => {
        setSaving(true);
        const { error } = await supabase.rpc("remove_label_member", {
          p_label_id: labelId,
          p_target_user_id: member.user_id,
        });
        setSaving(false);

        if (error) {
          toast({
            title: "Failed to remove member",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
        setMembers((prev) => prev.filter((m) => m.user_id !== member.user_id));
        toast({ title: `${member.email} removed` });
      },
    });
  };

  const handleAssignArtist = async (userId: string, artistHandle: string) => {
    if (!labelId) return;
    setSaving(true);
    const { error } = await supabase.rpc("assign_artist_to_member", {
      p_label_id: labelId,
      p_user_id: userId,
      p_artist_handle: artistHandle,
    });
    setSaving(false);
    if (error) {
      toast({
        title: "Failed to assign",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    const member = members.find((m) => m.user_id === userId);
    setAssignments((prev) => [
      ...prev,
      {
        user_id: userId,
        email: member?.email || "",
        label_role: member?.label_role || "",
        artist_handle: artistHandle,
      },
    ]);
    toast({ title: `@${artistHandle} assigned` });
  };

  const handleUnassignArtist = async (userId: string, artistHandle: string) => {
    if (!labelId) return;
    setSaving(true);
    const { error } = await supabase.rpc("remove_artist_assignment", {
      p_label_id: labelId,
      p_user_id: userId,
      p_artist_handle: artistHandle,
    });
    setSaving(false);
    if (error) {
      toast({
        title: "Failed to remove assignment",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setAssignments((prev) =>
      prev.filter(
        (a) => !(a.user_id === userId && a.artist_handle === artistHandle),
      ),
    );
  };

  const handleAssignAll = async (userId: string) => {
    if (!labelId) return;
    setSaving(true);
    const { error } = await supabase.rpc("assign_all_artists_to_member", {
      p_label_id: labelId,
      p_user_id: userId,
    });
    setSaving(false);
    if (error) {
      toast({
        title: "Failed to assign all",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    const member = members.find((m) => m.user_id === userId);
    const newAssigns = artists.map((a) => ({
      user_id: userId,
      email: member?.email || "",
      label_role: member?.label_role || "",
      artist_handle: a.artist_handle,
    }));
    setAssignments((prev) => [
      ...prev.filter((a) => a.user_id !== userId),
      ...newAssigns,
    ]);
    toast({ title: `All ${artists.length} artists assigned` });
  };

  const joinUrl = label
    ? `${window.location.origin}/join/${label.invite_code}`
    : "";

  if (loading) {
    return (
      <LabelLayout>
        <div className="p-6 md:p-8 lg:p-10 space-y-5">
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 24,
              fontWeight: 700,
              color: "var(--ink)",
            }}
          >
            Settings
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  background: "var(--surface)",
                  borderRadius: 16,
                  height: 120,
                  border: "1px solid var(--border)",
                }}
              />
            ))}
          </div>
        </div>
      </LabelLayout>
    );
  }

  if (!label) {
    return (
      <LabelLayout>
        <div className="p-6 md:p-8 lg:p-10">
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 24,
              fontWeight: 700,
              color: "var(--ink)",
              marginBottom: 16,
            }}
          >
            Settings
          </div>
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 14,
              color: "var(--ink-secondary)",
            }}
          >
            No label found. Contact support if this is unexpected.
          </div>
        </div>
      </LabelLayout>
    );
  }

  return (
    <LabelLayout>
      <div className="p-6 md:p-8 lg:p-10 space-y-6">
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 24,
            fontWeight: 700,
            color: "var(--ink)",
          }}
        >
          Settings
        </div>

        {/* Label Info Card */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 16,
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          {/* Header with logo */}
          <div
            style={{
              padding: "24px 24px 20px",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            {label.logo_url ? (
              <img
                src={label.logo_url}
                alt={label.name}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  objectFit: "contain",
                  border: "2px solid var(--border)",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background:
                    "linear-gradient(135deg, rgba(232,67,10,0.15) 0%, rgba(232,67,10,0.05) 100%)",
                  border: "2px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#e8430a",
                  }}
                >
                  {label.name
                    .split(" ")
                    .filter(Boolean)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "??"}
                </span>
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                {label.name}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: label.is_active
                      ? "rgba(48,209,88,0.12)"
                      : "rgba(255,69,58,0.12)",
                    color: label.is_active ? "#30D158" : "#FF453A",
                  }}
                >
                  {label.is_active ? "Active" : "Inactive"}
                </span>
                {label.slug && (
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 12,
                      color: "var(--ink-tertiary)",
                    }}
                  >
                    /{label.slug}
                  </span>
                )}
              </div>
            </div>
            {canManage && (
              <button
                onClick={handleToggleActive}
                disabled={saving}
                title={
                  label.is_active ? "Deactivate label" : "Reactivate label"
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.03)",
                  cursor: "pointer",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  fontWeight: 500,
                  color: label.is_active ? "#FF453A" : "#30D158",
                  transition: "all 150ms",
                  opacity: saving ? 0.5 : 1,
                }}
              >
                <Power size={14} />
                {label.is_active ? "Deactivate" : "Reactivate"}
              </button>
            )}
          </div>

          <div style={{ height: 1, background: "var(--border)" }} />

          {/* Info grid */}
          <div
            style={{
              padding: 24,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 20,
            }}
          >
            <InfoField
              icon={Calendar}
              label="Created"
              value={format(new Date(label.created_at), "MMM d, yyyy")}
            />

            {/* Contact email — editable for admins */}
            {editingEmail ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "var(--ink-tertiary)",
                  }}
                >
                  Contact Email
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="email"
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    placeholder="contact@label.com"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEmail();
                      if (e.key === "Escape") setEditingEmail(false);
                    }}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--border)",
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 13,
                      color: "var(--ink)",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleSaveEmail}
                    disabled={saving}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: "#e8430a",
                      color: "#fff",
                      cursor: "pointer",
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 12,
                      fontWeight: 600,
                      opacity: saving ? 0.5 : 1,
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingEmail(false)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "none",
                      color: "var(--ink-tertiary)",
                      cursor: "pointer",
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 12,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Mail
                  size={16}
                  style={{ color: "var(--ink-tertiary)", flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "var(--ink-tertiary)",
                      marginBottom: 2,
                    }}
                  >
                    Contact
                  </div>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 14,
                      fontWeight: 500,
                      color: label.contact_email
                        ? "var(--ink)"
                        : "var(--ink-tertiary)",
                    }}
                  >
                    {label.contact_email || "Not set"}
                  </div>
                </div>
                {canManage && (
                  <button
                    onClick={() => {
                      setEmailDraft(label.contact_email || "");
                      setEditingEmail(true);
                    }}
                    title="Edit contact email"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                      color: "var(--ink-tertiary)",
                      transition: "color 150ms",
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            )}

            <InfoField
              icon={Users}
              label="Team Members"
              value={String(members.length)}
            />
            <InfoField
              icon={Music}
              label="Artists on Roster"
              value={String(artists.length)}
            />
          </div>

          <div style={{ height: 1, background: "var(--border)" }} />

          {/* Invite code + Join link + Label ID */}
          <div
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "flex-end",
              }}
            >
              <CopyField
                label="Invite Code"
                value={label.invite_code}
                copied={copiedField === "invite"}
                onCopy={() => copyToClipboard(label.invite_code, "invite")}
              />
              {canManage && (
                <button
                  onClick={handleRegenerateInvite}
                  disabled={saving}
                  title="Generate a new invite code"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.03)",
                    cursor: "pointer",
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--ink-secondary)",
                    transition: "all 150ms",
                    opacity: saving ? 0.5 : 1,
                    height: 42,
                  }}
                >
                  <RefreshCw size={14} />
                  Regenerate
                </button>
              )}
            </div>

            <CopyField
              label="Join Link"
              value={joinUrl}
              copied={copiedField === "join"}
              onCopy={() => copyToClipboard(joinUrl, "join")}
              icon={Link2}
              mono
            />

            {canManage && (
              <CopyField
                label="Label ID"
                value={label.id}
                copied={copiedField === "id"}
                onCopy={() => copyToClipboard(label.id, "id")}
                mono
              />
            )}
          </div>
        </div>

        {/* Team Members */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 16,
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Users size={18} style={{ color: "var(--ink-tertiary)" }} />
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 15,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              Team Members
            </span>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                fontWeight: 500,
                color: "var(--ink-tertiary)",
                marginLeft: "auto",
              }}
            >
              {members.length} {members.length === 1 ? "member" : "members"}
            </span>
          </div>
          <div style={{ height: 1, background: "var(--border)" }} />

          {/* Role legend */}
          {canManage && members.length > 0 && (
            <>
              <div
                style={{
                  padding: "12px 24px",
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                {(["admin", "member", "viewer"] as const).map((r) => (
                  <div
                    key={r}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: ROLE_CONFIG[r].bg,
                        color: ROLE_CONFIG[r].color,
                      }}
                    >
                      {ROLE_CONFIG[r].label}
                    </span>
                    <span
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 11,
                        color: "var(--ink-tertiary)",
                      }}
                    >
                      {r === "admin"
                        ? "Full access + team management"
                        : r === "member"
                          ? "Full analytics, no team management"
                          : "Read-only access"}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
            </>
          )}

          {members.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center" }}>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  color: "var(--ink-tertiary)",
                }}
              >
                No team members yet. Share your invite code to add people.
              </span>
            </div>
          ) : (
            <div>
              {members.map((member, i) => {
                const rc = ROLE_CONFIG[member.label_role] || ROLE_CONFIG.viewer;
                return (
                  <div
                    key={member.user_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 24px",
                      background:
                        i % 2 === 1 ? "rgba(255,255,255,0.015)" : "transparent",
                      borderBottom:
                        i < members.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Mail
                        size={14}
                        style={{ color: "var(--ink-tertiary)" }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--ink)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {member.email}
                      </div>
                    </div>

                    {/* Role badge / dropdown */}
                    {canManage ? (
                      <div data-role-dropdown style={{ position: "relative" }}>
                        <button
                          onClick={() =>
                            setRoleDropdownOpen(
                              roleDropdownOpen === member.user_id
                                ? null
                                : member.user_id,
                            )
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            padding: "3px 8px",
                            borderRadius: 6,
                            border: "none",
                            cursor: "pointer",
                            background: rc.bg,
                            color: rc.color,
                            transition: "all 150ms",
                          }}
                        >
                          {rc.label}
                          <ChevronDown size={12} />
                        </button>

                        {roleDropdownOpen === member.user_id && (
                          <div
                            style={{
                              position: "absolute",
                              right: 0,
                              top: "100%",
                              marginTop: 4,
                              background: "#2C2C2E",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: 10,
                              padding: 4,
                              zIndex: 50,
                              minWidth: 140,
                              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                            }}
                          >
                            {(["admin", "member", "viewer"] as const).map(
                              (r) => (
                                <button
                                  key={r}
                                  onClick={() =>
                                    handleChangeRole(member.user_id, r)
                                  }
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    width: "100%",
                                    padding: "8px 10px",
                                    borderRadius: 6,
                                    border: "none",
                                    cursor: "pointer",
                                    background:
                                      member.label_role === r
                                        ? "rgba(255,255,255,0.04)"
                                        : "none",
                                    textAlign: "left",
                                    transition: "background 150ms",
                                  }}
                                  onMouseEnter={(e) => {
                                    (
                                      e.currentTarget as HTMLButtonElement
                                    ).style.background =
                                      "rgba(255,255,255,0.06)";
                                  }}
                                  onMouseLeave={(e) => {
                                    (
                                      e.currentTarget as HTMLButtonElement
                                    ).style.background =
                                      member.label_role === r
                                        ? "rgba(255,255,255,0.04)"
                                        : "none";
                                  }}
                                >
                                  <span
                                    style={{
                                      fontFamily: '"DM Sans", sans-serif',
                                      fontSize: 11,
                                      fontWeight: 600,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      padding: "2px 6px",
                                      borderRadius: 4,
                                      background: ROLE_CONFIG[r].bg,
                                      color: ROLE_CONFIG[r].color,
                                    }}
                                  >
                                    {ROLE_CONFIG[r].label}
                                  </span>
                                  {member.label_role === r && (
                                    <Check
                                      size={12}
                                      color="#e8430a"
                                      style={{ marginLeft: "auto" }}
                                    />
                                  )}
                                </button>
                              ),
                            )}
                            <div
                              style={{
                                height: 1,
                                background: "rgba(255,255,255,0.06)",
                                margin: "4px 0",
                              }}
                            />
                            <button
                              onClick={() => {
                                setRoleDropdownOpen(null);
                                handleRemoveMember(member);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                width: "100%",
                                padding: "8px 10px",
                                borderRadius: 6,
                                border: "none",
                                cursor: "pointer",
                                background: "none",
                                textAlign: "left",
                                transition: "background 150ms",
                              }}
                              onMouseEnter={(e) => {
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.background = "rgba(255,69,58,0.08)";
                              }}
                              onMouseLeave={(e) => {
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.background = "none";
                              }}
                            >
                              <UserMinus size={14} color="#FF453A" />
                              <span
                                style={{
                                  fontFamily: '"DM Sans", sans-serif',
                                  fontSize: 12,
                                  fontWeight: 500,
                                  color: "#FF453A",
                                }}
                              >
                                Remove
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: rc.bg,
                          color: rc.color,
                        }}
                      >
                        {rc.label}
                      </span>
                    )}

                    <span
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 12,
                        color: "var(--ink-tertiary)",
                      }}
                    >
                      {format(new Date(member.joined_at), "MMM d, yyyy")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Artist Assignments — only for admins with non-admin members */}
        {canManage && members.some((m) => m.label_role !== "admin") && (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 16,
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <UserPlus size={18} style={{ color: "var(--ink-tertiary)" }} />
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--ink)",
                }}
              >
                Artist Access
              </span>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "var(--ink-tertiary)",
                  marginLeft: "auto",
                }}
              >
                Members & viewers only see assigned artists
              </span>
            </div>
            <div style={{ height: 1, background: "var(--border)" }} />

            {members
              .filter((m) => m.label_role !== "admin")
              .map((member, mi) => {
                const rc = ROLE_CONFIG[member.label_role] || ROLE_CONFIG.viewer;
                const memberAssigns = assignments.filter(
                  (a) => a.user_id === member.user_id,
                );
                const assignedHandles = new Set(
                  memberAssigns.map((a) => a.artist_handle),
                );
                const unassigned = artists.filter(
                  (a) => !assignedHandles.has(a.artist_handle),
                );
                const isEditing = assigningMember === member.user_id;

                return (
                  <div
                    key={member.user_id}
                    style={{
                      padding: "16px 24px",
                      background:
                        mi % 2 === 1
                          ? "rgba(255,255,255,0.015)"
                          : "transparent",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {/* Member header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom:
                          memberAssigns.length > 0 || isEditing ? 10 : 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--ink)",
                          flex: 1,
                        }}
                      >
                        {member.email}
                      </span>
                      <span
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: rc.bg,
                          color: rc.color,
                        }}
                      >
                        {rc.label}
                      </span>
                      <span
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 11,
                          color: "var(--ink-tertiary)",
                        }}
                      >
                        {memberAssigns.length} / {artists.length} artists
                      </span>
                      {memberAssigns.length < artists.length && (
                        <button
                          onClick={() => handleAssignAll(member.user_id)}
                          disabled={saving}
                          style={{
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#e8430a",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "2px 6px",
                            opacity: saving ? 0.5 : 1,
                          }}
                        >
                          Assign all
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setAssigningMember(isEditing ? null : member.user_id)
                        }
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 11,
                          fontWeight: 500,
                          color: isEditing ? "#FF453A" : "var(--ink-secondary)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "2px 6px",
                        }}
                      >
                        {isEditing ? "Done" : "Edit"}
                      </button>
                    </div>

                    {/* Assigned artists chips */}
                    {(memberAssigns.length > 0 || isEditing) && (
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                      >
                        {memberAssigns.map((a) => (
                          <span
                            key={a.artist_handle}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 11,
                              fontWeight: 500,
                              color: "var(--ink-secondary)",
                              padding: "4px 8px",
                              borderRadius: 6,
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            @{a.artist_handle.replace(/^@+/, "")}
                            {isEditing && (
                              <button
                                onClick={() =>
                                  handleUnassignArtist(
                                    member.user_id,
                                    a.artist_handle,
                                  )
                                }
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: 0,
                                  display: "flex",
                                  color: "#FF453A",
                                }}
                              >
                                <X size={12} />
                              </button>
                            )}
                          </span>
                        ))}

                        {/* Add dropdown when editing */}
                        {isEditing && unassigned.length > 0 && (
                          <div
                            style={{ position: "relative" }}
                            data-role-dropdown
                          >
                            <button
                              onClick={() =>
                                setAssignDropdownOpen(!assignDropdownOpen)
                              }
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontFamily: '"DM Sans", sans-serif',
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#e8430a",
                                padding: "4px 8px",
                                borderRadius: 6,
                                background: "rgba(232,67,10,0.08)",
                                border: "1px dashed rgba(232,67,10,0.3)",
                                cursor: "pointer",
                              }}
                            >
                              <UserPlus size={12} /> Add artist
                            </button>
                            {assignDropdownOpen && (
                              <div
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: "100%",
                                  marginTop: 4,
                                  background: "#2C2C2E",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  borderRadius: 10,
                                  padding: 4,
                                  zIndex: 50,
                                  minWidth: 200,
                                  maxHeight: 240,
                                  overflowY: "auto",
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                                }}
                              >
                                {unassigned.map((a) => (
                                  <button
                                    key={a.artist_handle}
                                    onClick={() => {
                                      handleAssignArtist(
                                        member.user_id,
                                        a.artist_handle,
                                      );
                                      setAssignDropdownOpen(false);
                                    }}
                                    style={{
                                      display: "block",
                                      width: "100%",
                                      padding: "7px 10px",
                                      borderRadius: 6,
                                      border: "none",
                                      cursor: "pointer",
                                      background: "none",
                                      textAlign: "left",
                                      transition: "background 150ms",
                                      fontFamily: '"DM Sans", sans-serif',
                                      fontSize: 12,
                                      color: "var(--ink-secondary)",
                                    }}
                                    onMouseEnter={(e) => {
                                      (
                                        e.currentTarget as HTMLButtonElement
                                      ).style.background =
                                        "rgba(255,255,255,0.06)";
                                    }}
                                    onMouseLeave={(e) => {
                                      (
                                        e.currentTarget as HTMLButtonElement
                                      ).style.background = "none";
                                    }}
                                  >
                                    @{a.artist_handle.replace(/^@+/, "")}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {memberAssigns.length === 0 && !isEditing && (
                          <span
                            style={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 11,
                              color: "var(--ink-tertiary)",
                              fontStyle: "italic",
                            }}
                          >
                            No artists assigned — this user won't see any data
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* Roster */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 16,
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Music size={18} style={{ color: "var(--ink-tertiary)" }} />
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 15,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              Artist Roster
            </span>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                fontWeight: 500,
                color: "var(--ink-tertiary)",
                marginLeft: "auto",
              }}
            >
              {artists.length} {artists.length === 1 ? "artist" : "artists"}
            </span>
          </div>
          <div style={{ height: 1, background: "var(--border)" }} />

          {artists.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center" }}>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  color: "var(--ink-tertiary)",
                }}
              >
                No artists on roster yet. Add artists from the Dashboard.
              </span>
            </div>
          ) : (
            <div
              style={{ padding: 16, display: "flex", flexWrap: "wrap", gap: 8 }}
            >
              {artists.map((a) => (
                <span
                  key={a.artist_handle}
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--ink-secondary)",
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border)",
                  }}
                >
                  @{a.artist_handle.replace(/^@+/, "")}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
      />
    </LabelLayout>
  );
}

/* ---------- Sub-components ---------- */

function InfoField({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon: any;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Icon size={16} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
      <div>
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--ink-tertiary)",
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            fontWeight: 500,
            color: muted ? "var(--ink-tertiary)" : "var(--ink)",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function CopyField({
  label,
  value,
  copied,
  onCopy,
  mono,
  icon: CustomIcon,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  mono?: boolean;
  icon?: any;
}) {
  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "var(--ink-tertiary)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <button
        onClick={onCopy}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: "10px 14px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--border)",
          cursor: "pointer",
          transition: "all 150ms",
        }}
      >
        {CustomIcon && (
          <CustomIcon
            size={14}
            style={{ color: "var(--ink-tertiary)", flexShrink: 0 }}
          />
        )}
        <span
          style={{
            fontFamily: mono
              ? '"JetBrains Mono", monospace'
              : '"DM Sans", sans-serif',
            fontSize: mono ? 12 : 14,
            fontWeight: 600,
            color: "var(--ink)",
            flex: 1,
            textAlign: "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </span>
        {copied ? (
          <Check size={16} style={{ color: "#30D158", flexShrink: 0 }} />
        ) : (
          <Copy
            size={16}
            style={{ color: "var(--ink-tertiary)", flexShrink: 0 }}
          />
        )}
      </button>
    </div>
  );
}
