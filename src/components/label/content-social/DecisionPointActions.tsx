import { useState } from "react";
import { Forward, Check, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useDecisionPointActions } from "@/hooks/useDecisionPointActions";
import { SNOOZE_PRESETS } from "@/utils/decisionPointKey";
import type { DecisionPoint } from "@/data/contentDashboardHelpers";
import ForwardDecisionDialog from "./ForwardDecisionDialog";

interface Props {
  decisionPoint: DecisionPoint;
  briefDate: string;
}

export default function DecisionPointActions({
  decisionPoint,
  briefDate,
}: Props) {
  const { acknowledge, snooze } = useDecisionPointActions(briefDate);
  const [forwardOpen, setForwardOpen] = useState(false);

  const buttonClass =
    "inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md text-white/55 hover:text-white/87 hover:bg-white/[0.06] transition disabled:opacity-40 disabled:pointer-events-none";

  return (
    <>
      <div className="flex items-center gap-1 mt-3">
        <button
          type="button"
          onClick={() => setForwardOpen(true)}
          className={buttonClass}
          aria-label="Forward decision point"
        >
          <Forward className="w-3 h-3" />
          Forward
        </button>

        <button
          type="button"
          onClick={() => acknowledge.mutate(decisionPoint)}
          disabled={acknowledge.isPending}
          className={buttonClass}
          aria-label="Mark decision point as handled"
        >
          <Check className="w-3 h-3" />
          Got it
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={buttonClass}
              aria-label="Snooze decision point"
              disabled={snooze.isPending}
            >
              <Clock className="w-3 h-3" />
              Snooze
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-[#1C1C1E] border-white/[0.06] text-white/87"
          >
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
              Remind me
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            {SNOOZE_PRESETS.map((preset) => (
              <DropdownMenuItem
                key={preset.label}
                onSelect={() =>
                  snooze.mutate({
                    dp: decisionPoint,
                    snoozeUntilIso: preset.resolve(),
                  })
                }
                className="text-[12px] text-white/75 focus:bg-white/[0.06] focus:text-white/87 cursor-pointer"
              >
                {preset.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ForwardDecisionDialog
        open={forwardOpen}
        onOpenChange={setForwardOpen}
        decisionPoint={decisionPoint}
        briefDate={briefDate}
      />
    </>
  );
}
