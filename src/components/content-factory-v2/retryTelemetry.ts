import { supabase } from "@/integrations/supabase/client";
import type { OutputType } from "./types";

// Lightweight retry-attempt logger for Content Factory v2. Two sinks:
//
//   1. console.info — always fires with a `[cf-retry-telemetry]` tag so devs
//      can scrape it locally and Sentry/LogRocket can pick it up in prod
//      without any extra wiring.
//   2. cf_retry_telemetry (Supabase) — best-effort insert. The table doesn't
//      exist yet in production; the insert silently no-ops on PGRST205 so
//      the client doesn't error before the backend migration ships. Once the
//      table is created the same code starts populating it without redeploy.
//
// Backend-todo: see docs/handoffs/backend-todo.md (cf_retry_telemetry).

export interface RetryAttempt {
  itemId: string;
  outputType: OutputType;
  // Whatever was sitting in jobError or renderError when the user clicked
  // Retry. Null when the failure was silent (rare — usually we have *some*
  // error string by the time the card hits status=failed).
  originalError: string | null;
  // 1-indexed; first retry is 1, capped at RETRY_MAX upstream.
  attempt: number;
}

export function logRetryAttempt(event: RetryAttempt): void {
  console.info("[cf-retry-telemetry]", {
    ...event,
    at: new Date().toISOString(),
  });

  void writeToSupabase(event);
}

async function writeToSupabase(event: RetryAttempt): Promise<void> {
  try {
    const session = (await supabase.auth.getSession()).data.session;
    const { error } = await supabase.from("cf_retry_telemetry").insert({
      item_id: event.itemId,
      output_type: event.outputType,
      original_error: event.originalError,
      attempt: event.attempt,
      user_id: session?.user?.id ?? null,
    });
    if (error) {
      console.warn("[cf-retry-telemetry] insert failed", error);
    }
  } catch (err) {
    console.warn("[cf-retry-telemetry] insert threw", err);
  }
}
