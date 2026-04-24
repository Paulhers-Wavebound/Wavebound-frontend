import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  ExternalLink,
  Send,
  Star,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import type {
  Angle,
  AngleFamily,
  AngleFamilyFilter,
  AngleSource,
  Artist,
} from "./types";
import {
  ANGLE_FAMILY_COLOR,
  ANGLE_FAMILY_LABEL,
  MOCK_ARTISTS,
  artistInventory,
} from "./mockData";
import type { QueueItem } from "./types";

interface AnglesViewProps {
  angles: Angle[];
  queue: QueueItem[];
  onToggleFavorite: (angleId: string) => void;
  onKillAngle: (angleId: string) => void;
  onSendToCreate: (angleId: string) => void;
}

const FAMILIES: AngleFamily[] = [
  "sensational",
  "self_help",
  "tour_recap",
  "bts",
  "mini_doc",
];

export default function AnglesView({
  angles,
  queue,
  onToggleFavorite,
  onKillAngle,
  onSendToCreate,
}: AnglesViewProps) {
  const [selectedArtistId, setSelectedArtistId] = useState<string>("art-papi");
  const [familyFilter, setFamilyFilter] = useState<AngleFamilyFilter>("all");
  const [sourcedOnly, setSourcedOnly] = useState(false);

  const artist = MOCK_ARTISTS.find((a) => a.id === selectedArtistId);
  const inventory = artist
    ? artistInventory(selectedArtistId, angles, queue)
    : { unshipped: 0, scheduled: 0, killedThisWeek: 0 };

  const filteredAngles = useMemo(() => {
    return angles
      .filter((a) => a.artistId === selectedArtistId && !a.killed)
      .filter((a) =>
        familyFilter === "all" ? true : a.family === familyFilter,
      )
      .filter((a) => (sourcedOnly ? !a.speculative : true))
      .sort((a, b) => {
        if (a.favorited !== b.favorited) return a.favorited ? -1 : 1;
        if (a.speculative !== b.speculative) return a.speculative ? 1 : -1;
        return b.sourceCount - a.sourceCount;
      });
  }, [angles, selectedArtistId, familyFilter, sourcedOnly]);

  return (
    <div
      className="font-['DM_Sans',sans-serif] flex flex-col gap-6"
      style={{ color: "var(--ink)" }}
    >
      {/* Header: artist picker + generate CTA */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <label
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--ink-secondary)" }}
          >
            Artist
          </label>
          <ArtistPicker
            value={selectedArtistId}
            onChange={setSelectedArtistId}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            /* mock — already seeded */
          }}
          className="h-11 rounded-[10px] px-5 font-semibold text-[14px] transition-colors"
          style={{
            background: "var(--accent)",
            color: "#fff",
            border: "none",
          }}
        >
          Generate 20 angles
        </button>
      </div>

      {/* Inventory bar */}
      {artist && (
        <div
          className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 rounded-xl"
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border)",
          }}
        >
          <InventoryStat label="unshipped" value={inventory.unshipped} />
          <InventoryStat label="scheduled" value={inventory.scheduled} />
          <InventoryStat
            label="killed this week"
            value={inventory.killedThisWeek}
          />
          <div className="ml-auto flex items-center gap-2">
            <span
              className="text-[11px] uppercase tracking-wide"
              style={{ color: "var(--ink-tertiary)" }}
            >
              last drop
            </span>
            <span
              className="text-[12px] font-['JetBrains_Mono',monospace] tabular-nums"
              style={{ color: "var(--ink-secondary)" }}
            >
              {artist.publishedThisWeek > 0
                ? `${artist.publishedThisWeek}d · 340K views · 4.2% completion`
                : "none this week"}
            </span>
          </div>
        </div>
      )}

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterPill
          active={familyFilter === "all"}
          onClick={() => setFamilyFilter("all")}
        >
          All
        </FilterPill>
        {FAMILIES.map((f) => (
          <FilterPill
            key={f}
            active={familyFilter === f}
            onClick={() => setFamilyFilter(f)}
            color={ANGLE_FAMILY_COLOR[f]}
          >
            {ANGLE_FAMILY_LABEL[f]}
          </FilterPill>
        ))}
        <div
          className="mx-2 h-5 w-px"
          style={{ background: "var(--border)" }}
        />
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sourcedOnly}
            onChange={(e) => setSourcedOnly(e.target.checked)}
            className="w-4 h-4"
            style={{ accentColor: "var(--accent)" }}
          />
          <span
            className="text-[12px]"
            style={{ color: "var(--ink-secondary)" }}
          >
            Sourced only
          </span>
        </label>
      </div>

      {/* Angle list */}
      <div className="flex flex-col gap-3">
        {filteredAngles.length === 0 && (
          <div
            className="rounded-2xl px-5 py-10 text-center text-[14px]"
            style={{
              background: "var(--surface)",
              borderTop: "0.5px solid var(--card-edge)",
              color: "var(--ink-tertiary)",
            }}
          >
            No angles match these filters. Try clearing Sourced-only or
            switching family.
          </div>
        )}
        {filteredAngles.map((angle) => (
          <AngleCard
            key={angle.id}
            angle={angle}
            onToggleFavorite={() => onToggleFavorite(angle.id)}
            onKill={() => onKillAngle(angle.id)}
            onSendToCreate={() => onSendToCreate(angle.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ArtistPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 pl-4 pr-10 rounded-[10px] text-[14px] font-medium outline-none appearance-none cursor-pointer"
        style={{
          background: "var(--bg-subtle)",
          color: "var(--ink)",
          border: "1px solid var(--border)",
          minWidth: 260,
        }}
      >
        {MOCK_ARTISTS.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} — {a.handle} · {a.labelName}
            {a.isExample ? " · example" : ""}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        color="var(--ink-tertiary)"
      />
    </div>
  );
}

function InventoryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className="text-[22px] font-semibold font-['JetBrains_Mono',monospace] tabular-nums"
        style={{ color: "var(--ink)" }}
      >
        {value}
      </span>
      <span
        className="text-[11px] uppercase tracking-wide"
        style={{ color: "var(--ink-tertiary)" }}
      >
        {label}
      </span>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: { bg: string; fg: string };
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 h-8 rounded-full text-[12px] font-semibold transition-colors"
      style={{
        background: active
          ? color
            ? color.bg
            : "var(--accent-light)"
          : "var(--bg-subtle)",
        color: active
          ? color
            ? color.fg
            : "var(--accent)"
          : "var(--ink-secondary)",
        border: `1px solid ${
          active ? (color ? color.fg : "var(--accent)") : "var(--border)"
        }`,
      }}
    >
      {children}
    </button>
  );
}

function AngleCard({
  angle,
  onToggleFavorite,
  onKill,
  onSendToCreate,
}: {
  angle: Angle;
  onToggleFavorite: () => void;
  onKill: () => void;
  onSendToCreate: () => void;
}) {
  const fam = ANGLE_FAMILY_COLOR[angle.family];
  const isSpec = angle.speculative;
  const [auditOpen, setAuditOpen] = useState(false);

  return (
    <div
      className="rounded-2xl p-5 transition-colors"
      style={{
        background: "var(--surface)",
        borderTop: "0.5px solid var(--card-edge)",
        borderLeft: isSpec ? "2px solid rgba(220,38,38,0.6)" : "none",
        paddingLeft: isSpec ? 18 : 20,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide"
              style={{ background: fam.bg, color: fam.fg }}
            >
              {ANGLE_FAMILY_LABEL[angle.family]}
            </span>
            {isSpec ? (
              <button
                type="button"
                onClick={() => setAuditOpen((v) => !v)}
                aria-expanded={auditOpen}
                title={
                  auditOpen ? "Hide sources" : "Audit — see what's behind this"
                }
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide cursor-pointer transition-colors"
                style={{
                  background: auditOpen
                    ? "rgba(220,38,38,0.2)"
                    : "rgba(220,38,38,0.12)",
                  color: "#dc2626",
                  border: "1px solid rgba(220,38,38,0.3)",
                }}
              >
                <TriangleAlert size={11} />
                Speculative
                {auditOpen ? (
                  <ChevronUp size={11} />
                ) : (
                  <ChevronDown size={11} />
                )}
              </button>
            ) : (
              <SourceMeta angle={angle} />
            )}
            {angle.favorited && (
              <Star
                size={14}
                fill="var(--accent)"
                stroke="var(--accent)"
                style={{ flexShrink: 0 }}
              />
            )}
          </div>

          <h3
            className="text-[16px] font-semibold leading-snug mb-1.5"
            style={{ color: "var(--ink)" }}
          >
            {angle.title}
          </h3>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: "var(--ink-secondary)" }}
          >
            {angle.summary}
          </p>

          {isSpec && <SourceMeta angle={angle} className="mt-2" muted />}

          {isSpec && auditOpen && <AuditPanel angle={angle} />}
        </div>

        {/* Action column */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <IconButton
            title={angle.favorited ? "Unfavorite" : "Favorite"}
            onClick={onToggleFavorite}
          >
            <Star
              size={14}
              fill={angle.favorited ? "var(--accent)" : "none"}
              stroke={angle.favorited ? "var(--accent)" : "var(--ink-tertiary)"}
            />
          </IconButton>
          <IconButton
            title="Edit angle"
            onClick={() => {
              /* mock */
            }}
          >
            <Edit3 size={14} color="var(--ink-tertiary)" />
          </IconButton>
          <IconButton title="Send to Create" onClick={onSendToCreate} accent>
            <Send size={14} />
          </IconButton>
          <IconButton title="Kill" onClick={onKill}>
            <Trash2 size={14} color="var(--ink-tertiary)" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

function SourceMeta({
  angle,
  muted,
  className,
}: {
  angle: Angle;
  muted?: boolean;
  className?: string;
}) {
  const color = muted ? "var(--ink-tertiary)" : "var(--ink-secondary)";
  const srcLabel =
    angle.sourceCount === 0
      ? "0 sources"
      : `${angle.sourceCount} source${angle.sourceCount === 1 ? "" : "s"}`;
  const monthLabel = angle.mostRecentSourceMonth
    ? `most recent ${angle.mostRecentSourceMonth}`
    : "no dated sources";

  return (
    <span
      className={`text-[11px] font-['JetBrains_Mono',monospace] tabular-nums ${className ?? ""}`}
      style={{ color }}
    >
      {srcLabel} · {monthLabel}
    </span>
  );
}

function AuditPanel({ angle }: { angle: Angle }) {
  const sources = angle.sources ?? [];
  return (
    <div
      className="mt-3 rounded-[10px] p-3 flex flex-col gap-2"
      style={{
        background: "var(--bg-subtle)",
        border: "1px solid rgba(220,38,38,0.25)",
      }}
    >
      <div
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: "#dc2626" }}
      >
        Audit · what's behind this angle
      </div>
      {sources.length === 0 ? (
        <div
          className="text-[12px] leading-relaxed"
          style={{ color: "var(--ink-secondary)" }}
        >
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>
            No verified sources.
          </span>{" "}
          This angle was drafted from the summary context only (e.g. a fan-shot
          clip referenced on TikTok). Strongly recommend killing or routing to
          label review before publishing.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {sources.map((s, i) => (
            <SourceRow key={i} source={s} />
          ))}
        </ul>
      )}
      <div
        className="text-[11px] pt-1 mt-1 border-t"
        style={{
          color: "var(--ink-tertiary)",
          borderColor: "var(--border)",
        }}
      >
        Speculative = {sources.length === 0 ? "zero" : "sparse"} sourcing
        relative to published threshold. Backend flag set by the extraction step
        — see the raw extraction run for the threshold used.
      </div>
    </div>
  );
}

function SourceRow({ source }: { source: AngleSource }) {
  return (
    <li className="flex items-start gap-2">
      <span
        className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wide shrink-0 mt-0.5"
        style={{
          background: "var(--surface)",
          color: "var(--ink-secondary)",
          border: "1px solid var(--border)",
        }}
      >
        {source.kind}
      </span>
      <div className="flex-1 min-w-0">
        <div
          className="text-[12px] leading-snug"
          style={{ color: "var(--ink)" }}
        >
          {source.label}
        </div>
        <div
          className="text-[10px] font-['JetBrains_Mono',monospace] tabular-nums flex items-center gap-2"
          style={{ color: "var(--ink-tertiary)" }}
        >
          <span>{source.date}</span>
          {source.url && (
            <>
              <span>·</span>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
                style={{ color: "var(--accent)" }}
              >
                <ExternalLink size={10} />
                open
              </a>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function IconButton({
  title,
  onClick,
  children,
  accent,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
      style={{
        background: accent ? "var(--accent-light)" : "var(--bg-subtle)",
        border: `1px solid ${accent ? "var(--accent)" : "var(--border)"}`,
        color: accent ? "var(--accent)" : "var(--ink-tertiary)",
      }}
    >
      {children}
    </button>
  );
}

// Exported for use in CreateView's angle picker
export function getArtistById(id: string): Artist | undefined {
  return MOCK_ARTISTS.find((a) => a.id === id);
}
