// v2 — reads secrets from env, deployed 2026-02-19
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    // 1. Validate JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers },
      );
    }

    // 2. Rate limiting — max 30 requests per minute per user
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { count } = await supabase
      .from("chat_jobs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", oneMinuteAgo);

    if (count && count >= 30) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again in a minute." }),
        { status: 429, headers },
      );
    }

    // 3. Parse request
    const body = await req.json();
    const { message, session_id, user_id, genre, sub_genre, role, chat_history } = body;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message required" }),
        { status: 400, headers },
      );
    }

    // 4. Create job
    const { data: job, error: insertError } = await supabase
      .from("chat_jobs")
      .insert({
        user_id: user.id,
        message,
        chat_history: chat_history || [],
        genre: genre || null,
        slug: sub_genre || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: "Failed to create job" }),
        { status: 500, headers },
      );
    }

    // 5. Fire n8n webhook (non-blocking)
    const n8nUrl = Deno.env.get("N8N_CHAT_WEBHOOK_URL");
    const n8nSecret = Deno.env.get("N8N_WEBHOOK_SECRET");

    if (!n8nUrl) {
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 500, headers },
      );
    }

    fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(n8nSecret ? { "X-Webhook-Secret": n8nSecret } : {}),
      },
      body: JSON.stringify({
        job_id: job.id,
        user_id: user.id,
        message,
        session_id: session_id || null,
        chat_history: chat_history || [],
        genre: genre || null,
        sub_genre: sub_genre || null,
        role: role || null,
        ...(n8nSecret ? { webhook_secret: n8nSecret } : {}),
      }),
    }).catch(async (err) => {
      await supabase
        .from("chat_jobs")
        .update({
          status: "error",
          error_message: `n8n unreachable: ${err.message}`,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    });

    // 6. Return job_id immediately
    return new Response(
      JSON.stringify({ job_id: job.id }),
      { status: 202, headers },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers },
    );
  }
});
