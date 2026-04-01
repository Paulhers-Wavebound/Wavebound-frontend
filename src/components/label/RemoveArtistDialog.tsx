import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RemoveArtistDialogProps {
  artistName: string;
  artistHandle: string;
  labelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoved: () => void;
}

export default function RemoveArtistDialog({
  artistName,
  artistHandle,
  labelId,
  open,
  onOpenChange,
  onRemoved,
}: RemoveArtistDialogProps) {
  const [confirmInput, setConfirmInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const matches = confirmInput === artistHandle;

  const handleRemove = async () => {
    if (!matches) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-artist", {
        body: {
          artist_handle: artistHandle,
          label_id: labelId,
          confirm_handle: confirmInput,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to remove artist",
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Artist removed",
        description: `${artistName} has been removed from your roster`,
      });
      onRemoved();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!loading) {
          setConfirmInput("");
          onOpenChange(v);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Remove {artistName} from your roster?
          </DialogTitle>
          <DialogDescription className="pt-2">
            This will permanently delete all data for this artist including
            content plans, intelligence reports, video analysis, GIFs, and
            pipeline history.{" "}
            <span className="font-semibold text-destructive">
              This cannot be undone.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <label className="text-sm text-muted-foreground">
            Type{" "}
            <span className="font-mono font-semibold text-foreground">
              {artistHandle}
            </span>{" "}
            to confirm
          </label>
          <Input
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={artistHandle}
            disabled={loading}
            autoComplete="off"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={!matches || loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Remove Artist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
