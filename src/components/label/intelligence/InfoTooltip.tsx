import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

export default function InfoTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "help",
              color: "var(--ink-tertiary)",
              transition: "color 150ms",
              flexShrink: 0,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--ink-secondary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--ink-tertiary)")
            }
          >
            <HelpCircle size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
