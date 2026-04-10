import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Square, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const T = {
  surface: "var(--surface-hover, #2a2a27)",
  elevated: "#323230",
  text: "var(--ink)",
  textSecondary: "var(--ink-secondary)",
  accent: "var(--accent)",
  accentHover: "var(--accent-hover)",
} as const;

export interface PendingImage {
  data: string; // base64 (no data: prefix)
  media_type: string; // "image/png" etc.
  preview: string; // full data URL for <img>
  name: string; // filename
}

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Unsupported format. Use PNG, JPEG, WebP, or GIF.";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "Image too large. Max 5MB.";
  }
  return null;
}

export function fileToBase64(file: File): Promise<PendingImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve({
        data: base64,
        media_type: file.type || "image/png",
        preview: result,
        name: file.name,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface ChatInputProps {
  onSubmit: (text: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  placeholder?: string;
  prefill?: string | null;
  pendingImage?: PendingImage | null;
  onImageAttach?: (image: PendingImage) => void;
  onImageRemove?: () => void;
}

export default function ChatInput({
  onSubmit,
  onCancel,
  isLoading,
  placeholder,
  prefill,
  pendingImage,
  onImageAttach,
  onImageRemove,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate input from prefill (e.g. navigating from Expansion Radar)
  useEffect(() => {
    if (prefill) {
      setInput(prefill);
      // Focus textarea so user can review and hit enter
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [prefill]);

  // Auto-resize textarea (up to ~4 lines)
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 4 * 24)}px`;
  }, [input]);

  const handleSubmit = useCallback(() => {
    const msg = input.trim();
    // Allow submit with image even if no text (sends "Describe this image" as fallback)
    if (isLoading) return;
    if (!msg && !pendingImage) return;
    setInput("");
    onSubmit(msg || "What's in this image?");
  }, [input, isLoading, onSubmit, pendingImage]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      const error = validateImageFile(file);
      if (error) {
        toast.error(error);
        return;
      }
      const img = await fileToBase64(file);
      onImageAttach?.(img);
    },
    [onImageAttach],
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (!file) continue;
          await handleFileSelect(file);
          break;
        }
      }
    },
    [handleFileSelect],
  );

  const hasText = input.trim().length > 0;
  const canSend = hasText || !!pendingImage;

  return (
    <div
      className="shrink-0 px-4 pt-2"
      style={{
        background: "var(--surface, #1e1e1c)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="max-w-3xl mx-auto">
        <div
          className="rounded-xl transition-shadow duration-200"
          style={{
            backgroundColor: T.surface,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          onFocusCapture={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 0 0 2px rgba(232,67,10,0.25)";
          }}
          onBlurCapture={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          {/* Image preview — card style like Claude */}
          {pendingImage && (
            <div className="px-3 pt-3">
              <div
                className="relative inline-flex flex-col w-48 rounded-lg overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {/* Filename */}
                <p
                  className="text-xs truncate px-2.5 pt-2 pb-1.5"
                  style={{ color: T.textSecondary }}
                >
                  {pendingImage.name || "Pasted image"}
                </p>
                {/* Thumbnail */}
                <div className="relative px-2.5 pb-2.5">
                  <img
                    src={pendingImage.preview}
                    alt=""
                    className="w-full h-24 rounded object-cover"
                  />
                  {/* File type badge */}
                  <span
                    className="absolute bottom-3.5 left-3.5 text-[10px] font-medium uppercase px-1.5 py-0.5 rounded"
                    style={{
                      background: "rgba(0,0,0,0.55)",
                      color: "rgba(255,255,255,0.7)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {pendingImage.media_type.split("/")[1]?.toUpperCase() ||
                      "IMG"}
                  </span>
                </div>
                {/* Remove button */}
                <button
                  onClick={onImageRemove}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full hover:bg-white/10 transition-colors"
                  style={{
                    background: "rgba(0,0,0,0.4)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <X
                    className="w-3 h-3"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Input row */}
          <div className="flex items-end gap-2 px-3 py-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setInput("");
                  textareaRef.current?.blur();
                }
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              onPaste={handlePaste}
              placeholder={
                placeholder ||
                "Ask about your roster, artists, trends, or strategy..."
              }
              className="flex-1 min-h-[42px] max-h-[96px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:outline-none px-1 py-2 text-[15px] placeholder:text-white/30"
              style={{ color: T.text }}
              rows={1}
            />

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) await handleFileSelect(file);
                e.target.value = "";
              }}
            />

            {/* Image upload button */}
            {onImageAttach && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className={cn(
                  "p-2 rounded-lg transition-colors mb-0.5",
                  isLoading
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:bg-white/5",
                )}
                title="Attach image"
              >
                <ImageIcon
                  className="w-4 h-4"
                  style={{ color: T.textSecondary }}
                />
              </button>
            )}

            {/* Send / Cancel button */}
            <Button
              size="icon"
              onClick={isLoading ? onCancel : handleSubmit}
              disabled={!isLoading && !canSend}
              className={cn(
                "h-9 w-9 rounded-full shrink-0 transition-all duration-200 mb-0.5",
                !isLoading && !canSend && "opacity-30 cursor-not-allowed",
              )}
              style={{
                backgroundColor: isLoading
                  ? "rgba(239,68,68,0.8)"
                  : canSend
                    ? T.accent
                    : T.elevated,
                color: "#FFFFFF",
                boxShadow:
                  !isLoading && canSend
                    ? "0 0 16px rgba(232,67,10,0.15)"
                    : "none",
                transition:
                  "background-color 200ms ease-out, box-shadow 200ms ease-out",
              }}
              onMouseEnter={(e) => {
                if (isLoading) return;
                if (canSend)
                  e.currentTarget.style.backgroundColor = T.accentHover;
              }}
              onMouseLeave={(e) => {
                if (isLoading) return;
                e.currentTarget.style.backgroundColor = canSend
                  ? T.accent
                  : T.elevated;
              }}
            >
              {isLoading ? (
                <Square className="w-3.5 h-3.5 fill-current" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
