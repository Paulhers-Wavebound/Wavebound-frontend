/**
 * Deliverable Links — persistent bottom strip across all tabs
 * Links to Content Plan, 30-Day Plan, Artist Brief
 */
import { Calendar, BarChart3, BadgeCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Deliverable {
  label: string;
  available: boolean;
  column: string;
  fallbackColumn?: string;
  icon: typeof Calendar;
}

interface DeliverableLinksProps {
  artistHandle: string;
  hasContentPlan: boolean;
  has30dayPlan: boolean;
  hasArtistBrief: boolean;
}

export default function DeliverableLinks({
  artistHandle,
  hasContentPlan,
  has30dayPlan,
  hasArtistBrief,
}: DeliverableLinksProps) {
  const { toast } = useToast();

  const deliverables: Deliverable[] = [
    { label: "7-Day Content Plan", available: hasContentPlan, column: "content_plan_html", icon: Calendar },
    { label: "30-Day Plan", available: has30dayPlan, column: "content_plan_30d_html", fallbackColumn: "thirty_day_plan_html", icon: BarChart3 },
    { label: "Artist Brief", available: hasArtistBrief, column: "artist_brief_html", icon: BadgeCheck },
  ];

  const openDeliverable = async (d: Deliverable) => {
    const nh = artistHandle.replace(/^@/, "").toLowerCase().trim();
    const { data } = await (supabase as any)
      .from("artist_intelligence")
      .select("content_plan_html, intelligence_report_html, content_plan_30d_html, thirty_day_plan_html, artist_brief_html")
      .or(`artist_handle.eq.${nh},artist_handle.eq.@${nh}`)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const row = data as any;
    const html = row?.[d.column] || (d.fallbackColumn ? row?.[d.fallbackColumn] : null);
    if (!html) {
      toast({ title: "Not generated yet" });
      return;
    }
    const newTab = window.open("", "_blank");
    if (newTab) {
      newTab.document.write(html);
      newTab.document.close();
    } else {
      toast({ title: "Please allow popups to view the report" });
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
      {deliverables.map((d) => (
        <Card
          key={d.column}
          className={`p-3.5 border-border flex items-center gap-3 transition-colors cursor-pointer ${
            d.available ? "bg-card hover:bg-accent/50" : "bg-muted/30 opacity-50"
          }`}
          onClick={() => openDeliverable(d)}
        >
          <d.icon className={`w-4 h-4 shrink-0 ${d.available ? "text-foreground" : "text-muted-foreground"}`} />
          <div>
            <span className={`text-[13px] font-medium ${d.available ? "text-foreground" : "text-muted-foreground"}`}>
              {d.label}
            </span>
            {!d.available && <p className="text-[10px] text-muted-foreground">Not generated</p>}
          </div>
        </Card>
      ))}
    </div>
  );
}
