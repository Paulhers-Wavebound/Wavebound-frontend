import { ChevronLeft, ChevronRight } from "lucide-react";

interface RailArrowProps {
  direction: "left" | "right";
  onClick: () => void;
  /** Vertical offset from rail center, in px. Defaults to 0 (true center). */
  yOffset?: number;
}

/**
 * Higgsfield-style frosted-glass scroll arrow for horizontal rails. Hidden
 * below `lg` (1024px); fades in on `group:hover` of the parent rail container.
 * The parent must be `position: relative` and have the `group` Tailwind class.
 */
export default function RailArrow({
  direction,
  onClick,
  yOffset = 0,
}: RailArrowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Scroll left" : "Scroll right"}
      className={`hidden lg:grid place-items-center absolute size-10 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity ${
        direction === "left" ? "left-1" : "right-1"
      }`}
      style={{
        top: `calc(50% + ${yOffset}px)`,
        transform: "translateY(-50%)",
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        color: "var(--ink)",
        border: "1px solid var(--border)",
      }}
    >
      {direction === "left" ? (
        <ChevronLeft size={18} />
      ) : (
        <ChevronRight size={18} />
      )}
    </button>
  );
}
