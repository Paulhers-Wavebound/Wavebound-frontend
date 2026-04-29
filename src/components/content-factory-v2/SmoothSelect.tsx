import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SmoothSelectOption {
  value: string;
  primary: string;
  secondary?: string;
  // Either an avatar image URL or a React node (e.g. an initials circle, an
  // icon). Rendered as the leading slot in the trigger + each row.
  leading?: { avatarUrl?: string | null; node?: React.ReactNode };
}

interface SmoothSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SmoothSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  // Show the search input only when there are at least this many options.
  // Below that the list fits without scroll and a search row is just noise.
  searchThreshold?: number;
  emptyText?: string;
  disabled?: boolean;
}

/**
 * Higgsfield-style dropdown. Custom Popover trigger with avatar/icon +
 * primary/secondary text rows. Replaces native <select> for "pick an X"
 * fields where each option has identity (artist, voice, narrator, etc).
 */
export default function SmoothSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  searchThreshold = 8,
  emptyText = "No matches.",
  disabled,
}: SmoothSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((o) => o.value === value);
  const showSearch = options.length >= searchThreshold;
  // Hide the currently-selected option from the popover list — it's already
  // shown in the trigger, so listing it again reads as a duplicate. Search
  // queries override (so users typing the selected name still see it).
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return options.filter((o) => {
      if (!q && o.value === value) return false;
      if (!q) return true;
      return (
        o.primary.toLowerCase().includes(q) ||
        (o.secondary?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [options, query, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className="group w-full h-12 px-3 pr-10 rounded-xl text-left flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:outline-none focus-visible:[border-color:var(--accent)] focus-visible:[box-shadow:0_0_0_3px_var(--accent-soft)]"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--accent-hairline)",
            color: "var(--ink)",
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--accent)";
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled) {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--accent-hairline)";
            }
          }}
        >
          {selected ? (
            <>
              {selected.leading && (
                <LeadingSlot leading={selected.leading} size={28} />
              )}
              <div className="flex-1 min-w-0">
                <div
                  className="text-[13px] font-semibold truncate"
                  style={{ color: "var(--ink)" }}
                >
                  {selected.primary}
                </div>
                {selected.secondary && (
                  <div
                    className="text-[11px] truncate"
                    style={{ color: "var(--ink-tertiary)" }}
                  >
                    {selected.secondary}
                  </div>
                )}
              </div>
            </>
          ) : (
            <span
              className="text-[13px]"
              style={{ color: "var(--ink-tertiary)" }}
            >
              {placeholder}
            </span>
          )}
          <ChevronDown
            size={14}
            color="var(--ink-tertiary)"
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform"
            style={{ transform: open ? "translateY(-50%) rotate(180deg)" : "" }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[var(--radix-popover-trigger-width)] p-0 overflow-hidden rounded-[14px]"
        style={
          {
            background: "var(--surface-2)",
            border: "1px solid var(--border-strong)",
            boxShadow: "0 24px 48px rgba(0,0,0,0.55)",
            // Override tailwindcss-animate's `enter` / `exit` keyframe vars
            // so the popover slides + fades like a real dropdown instead of
            // zooming in like a card. The scale jump (95% → 100%) is what
            // reads as "spawning card"; clamping to 1 keeps motion linear.
            // Slide distance bumped to 10px so the drop is visible, and the
            // ease-out-expo curve gives it a confident, decisive feel.
            "--tw-enter-scale": "1",
            "--tw-exit-scale": "1",
            "--tw-enter-translate-y": "-10px",
            "--tw-exit-translate-y": "-10px",
            transformOrigin: "top",
            animationDuration: "200ms",
            animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          } as React.CSSProperties
        }
      >
        {showSearch && (
          <div
            className="flex items-center gap-2 px-3 h-10"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <Search size={13} color="var(--ink-tertiary)" />
            <input
              type="text"
              value={query}
              autoFocus
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-[13px] outline-none"
              style={{ color: "var(--ink)" }}
            />
          </div>
        )}
        <div className="max-h-[280px] overflow-auto py-1">
          {filtered.length === 0 ? (
            <div
              className="px-3 py-4 text-[12px] text-center"
              style={{ color: "var(--ink-tertiary)" }}
            >
              {emptyText}
            </div>
          ) : (
            filtered.map((o) => {
              const isSelected = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="w-full px-3 py-2.5 text-left flex items-center gap-3 transition-[background-color,transform] duration-[var(--dur-state)] ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.99] active:duration-[var(--dur-instant)]"
                  style={{
                    background: isSelected
                      ? "var(--accent-soft)"
                      : "transparent",
                    borderLeft: isSelected
                      ? "2px solid var(--accent)"
                      : "2px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(255,255,255,0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "transparent";
                    }
                  }}
                >
                  {o.leading && <LeadingSlot leading={o.leading} size={28} />}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[13px] font-semibold truncate"
                      style={{
                        color: isSelected ? "var(--accent)" : "var(--ink)",
                      }}
                    >
                      {o.primary}
                    </div>
                    {o.secondary && (
                      <div
                        className="text-[11px] truncate"
                        style={{ color: "var(--ink-tertiary)" }}
                      >
                        {o.secondary}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <Check
                      size={14}
                      color="var(--accent)"
                      className="shrink-0"
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function LeadingSlot({
  leading,
  size,
}: {
  leading: NonNullable<SmoothSelectOption["leading"]>;
  size: number;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = !!leading.avatarUrl && !imgFailed;
  if (showImg) {
    return (
      <img
        src={leading.avatarUrl ?? ""}
        alt=""
        className="rounded-full object-cover shrink-0"
        style={{
          width: size,
          height: size,
          border: "1px solid var(--border)",
        }}
        onError={() => setImgFailed(true)}
      />
    );
  }
  if (leading.node != null) {
    return (
      <div
        className="shrink-0 rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid var(--border)",
          color: "var(--ink-secondary)",
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {leading.node}
      </div>
    );
  }
  return null;
}
