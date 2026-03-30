import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function extractFirstOutput(payload: any): string {
  if (!payload) return "";

  if (Array.isArray(payload)) {
    for (const item of payload) {
      if (item && typeof item === "object" && typeof (item as any).output === "string") {
        return (item as any).output;
      }
    }
    return "";
  }

  if (payload && typeof payload === "object" && typeof (payload as any).output === "string") {
    return (payload as any).output;
  }

  return "";
}

function extractHiddenDataJson(output: string): any[] {
  if (!output) return [];
  const match = output.match(/<hidden_data>\s*([\s\S]*?)(?:\s*<\/hidden_data>|$)/i);
  if (!match) return [];

  const json = match[1].trim();
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Failed to parse <hidden_data> JSON:", e);
    return [];
  }
}

function toContentPlanItems(hiddenItems: any[]): any[] {
  return hiddenItems.map((item: any, index: number) => {
    const videoId = String(item.video_embed_id || item.id || "").trim();
    return {
      day: index + 1,
      title: item.title || `Day ${index + 1} Content`,
      action: item.action || "",
      why_it_works: item.why_it_works || item.action || "",
      video_embed_id: videoId,
      hook: item.hook || item.title || "",
      effort: "",
    };
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userData?.user) {
      console.error(`[${requestId}] Unauthorized`, userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;
    const body = await req.json().catch(() => ({}));
    const video_id = String(body?.video_id || body?.audioId || "").trim();

    if (!video_id) {
      return new Response(JSON.stringify({ error: "video_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify ownership + get audio_url
    const { data: uploaded, error: uploadedErr } = await supabase
      .from("user_uploaded_videos")
      .select("id, user_id, video_url, storage_path")
      .eq("id", video_id)
      .maybeSingle();

    if (uploadedErr) {
      console.error(`[${requestId}] Failed to load user_uploaded_videos`, uploadedErr);
      return new Response(JSON.stringify({ error: "Failed to load audio record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!uploaded) {
      return new Response(JSON.stringify({ error: "Audio record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (uploaded.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!uploaded.video_url) {
      return new Response(JSON.stringify({ error: "Audio URL missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure analysis row exists + mark processing
    const { data: existingAnalysis } = await supabase
      .from("video_analysis_results")
      .select("id, status, updated_at")
      .eq("video_id", video_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingAnalysis) {
      await supabase
        .from("video_analysis_results")
        .insert({ video_id, user_id: user.id, status: "processing" });
    } else {
      await supabase
        .from("video_analysis_results")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("video_id", video_id)
        .eq("user_id", user.id);
    }

    const n8nUrl = "https://paulhers.app.n8n.cloud/webhook/19ad0c68-3f4b-4f0f-a12c-25d05fb5655f";
    const formData = new FormData();
    formData.append("audio_url", uploaded.video_url);
    formData.append("user_id", user.id);
    formData.append("video_id", video_id);
    formData.append("filename", uploaded.storage_path || "audio.mp3");
    formData.append("chatId", `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

    console.log(`[${requestId}] Triggering n8n`, {
      video_id,
      user_id: user.id,
      audio_url: uploaded.video_url,
    });

    const backgroundTask = async () => {
      try {
        const res = await fetch(n8nUrl, { method: "POST", body: formData });
        const responseText = await res.text();
        console.log(`[${requestId}] n8n status=${res.status} bodyLen=${responseText.length}`);

        if (!res.ok) {
          console.error(`[${requestId}] n8n failed`, responseText.slice(0, 800));
          return;
        }

        let payload: any;
        try {
          payload = JSON.parse(responseText);
        } catch (e) {
          console.error(`[${requestId}] n8n returned invalid JSON`, e);
          return;
        }

        const audioAnalysis = Array.isArray(payload) && payload.length > 0 ? payload[0] : payload;
        const contentPlanOutput = extractFirstOutput(payload);
        const hiddenItems = extractHiddenDataJson(contentPlanOutput);
        const content_plan = toContentPlanItems(hiddenItems);

        const content_plan_text = contentPlanOutput
          ? contentPlanOutput.replace(/<hidden_data>[\s\S]*?(<\/hidden_data>|$)/gi, "").trim()
          : "";

        const hooks_captions = [
          {
            type: "audio_analysis",
            content_plan,
            content_plan_text,
            ai_response: contentPlanOutput,
            audio_analysis: {
              bpm: null,
              genre: audioAnalysis?.genre ?? null,
              sub_genre: audioAnalysis?.sub_genre ?? null,
              mood: audioAnalysis?.mood ?? null,
              instruments: audioAnalysis?.instruments ?? null,
              voices: audioAnalysis?.voices ?? null,
              emotional_profile: audioAnalysis?.emotional_profile ?? null,
              technical_feedback: audioAnalysis?.technical_feedback ?? null,
              lyric_analysis: audioAnalysis?.lyric_analysis ?? null,
            },
          },
        ];

        const { error: updateErr } = await supabase
          .from("video_analysis_results")
          .update({
            status: "completed",
            hooks_captions,
            genre: audioAnalysis?.genre ?? null,
            sub_genre: audioAnalysis?.sub_genre ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("video_id", video_id)
          .eq("user_id", user.id);

        if (updateErr) {
          console.error(`[${requestId}] Failed to persist analysis`, updateErr);
          return;
        }

        console.log(`[${requestId}] Analysis persisted`, { video_id, content_plan_len: content_plan.length });
      } catch (e) {
        console.error(`[${requestId}] Background task error`, e);
      }
    };

    try {
      // @ts-ignore
      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
        // @ts-ignore
        EdgeRuntime.waitUntil(backgroundTask());
      } else {
        void backgroundTask();
      }
    } catch {
      void backgroundTask();
    }

    return new Response(JSON.stringify({ success: true, video_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("trigger-audio-analysis-proxy error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
