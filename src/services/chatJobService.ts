import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://kxvgbowrkmowuyezoeke.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dmdib3dya21vd3V5ZXpvZWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjUzMjUsImV4cCI6MjA3MjM0MTMyNX0.jyd5K06zFJv9yK2tj8Pj2oATohbKnMD6hXwit6T50DY";

export interface StreamCallbacks {
  onJobId?: (jobId: string) => void;
  onStatus?: (tool: string, status: string) => void;
  onDelta?: (text: string) => void;
  onError?: (error: string) => void;
  onDone?: () => void;
}

/**
 * Stream a chat message using SSE from an edge function.
 * Returns the full accumulated response text when the stream completes.
 * @param endpoint - Edge function name (default: 'artist-chat'). Use 'label-chat' for label assistant.
 */
export async function streamChatMessage(
  payload: {
    message: string;
    session_id: string;
    role?: string;
    image?: { data: string; media_type: string };
    model?: string;
  },
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
  endpoint: string = "artist-chat",
): Promise<string> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error("Not authenticated");

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      message: payload.message,
      session_id: payload.session_id,
      ...(payload.role ? { role: payload.role } : {}),
      ...(payload.image ? { image: payload.image } : {}),
      ...(payload.model ? { model: payload.model } : {}),
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Chat request failed (${response.status}): ${errorText}`);
  }

  if (!response.body) {
    throw new Error("No response body — streaming not supported");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        let eventType = "message";
        for (const line of part.split("\n")) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              switch (eventType) {
                case "job_id":
                  if (parsed.job_id) callbacks.onJobId?.(parsed.job_id);
                  break;
                case "status":
                  callbacks.onStatus?.(parsed.tool || "", parsed.status || "");
                  break;
                case "delta":
                  if (parsed.text) {
                    accumulated += parsed.text;
                    callbacks.onDelta?.(parsed.text);
                  }
                  break;
                case "error":
                  callbacks.onError?.(parsed.error || "Unknown error");
                  break;
                case "done":
                  callbacks.onDone?.();
                  break;
                default:
                  // Fallback: handle untyped data lines
                  if (parsed.text) {
                    accumulated += parsed.text;
                    callbacks.onDelta?.(parsed.text);
                  }
                  if (parsed.status)
                    callbacks.onStatus?.(null as any, parsed.status);
                  break;
              }
            } catch {}
          }
        }
      }
    }
  } catch (err) {
    if (signal?.aborted) return accumulated;
    throw err;
  } finally {
    reader.releaseLock();
  }

  return accumulated;
}

/**
 * Legacy wrapper — same signature as old sendChatMessage for any code
 * that hasn't migrated to streaming yet. Calls streamChatMessage
 * and returns the full response.
 */
export async function sendChatMessage(payload: {
  message: string;
  session_id: string;
  user_id: string;
  genre: string;
  sub_genre: string;
  role: string;
  chat_history: unknown[];
}): Promise<string> {
  return streamChatMessage(
    { message: payload.message, session_id: payload.session_id },
    {},
  );
}
