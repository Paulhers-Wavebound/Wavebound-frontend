/**
 * Agent Actions Bar — floating bottom bar on the prospect drill-down.
 * 3 action buttons: Run Studio Bot | Generate Greenlight Proposal | Nurture Manager
 */
import { Bot, FileText, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AgentActionsBar() {
  const { toast } = useToast();

  const actions = [
    {
      icon: Bot,
      label: "Run Studio Bot",
      description: "Generate full session brief",
    },
    {
      icon: FileText,
      label: "Generate Greenlight Proposal",
      description: "Shadow P&L + contract clauses",
    },
    {
      icon: Heart,
      label: "Nurture Manager",
      description: "Auto check-in template",
    },
  ];

  const handleClick = (label: string) => {
    toast({
      title: `${label}`,
      description: "Coming soon — backend not connected yet.",
    });
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.06]"
      style={{ background: "#1C1C1E" }}
    >
      <div className="flex items-center justify-center gap-3 px-6 py-3 max-w-5xl mx-auto">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => handleClick(action.label)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.06] text-white/60 hover:text-white/80 hover:border-white/[0.12] hover:bg-white/[0.02] transition-colors"
            >
              <Icon size={14} />
              <div className="text-left">
                <span className="text-[12px] font-medium block leading-tight">
                  {action.label}
                </span>
                <span className="text-[10px] text-white/30 block leading-tight">
                  {action.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
