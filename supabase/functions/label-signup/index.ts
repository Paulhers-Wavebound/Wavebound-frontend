// label-signup v2 — force redeploy
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, invite_code } = await req.json();

    if (!email || !password || !invite_code) {
      return new Response(
        JSON.stringify({ error: "Email, password, and invite code are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Validate invite code
    const { data: label, error: labelErr } = await adminClient
      .from("labels")
      .select("id, name")
      .eq("invite_code", invite_code.trim())
      .eq("is_active", true)
      .maybeSingle();

    if (labelErr || !label) {
      return new Response(
        JSON.stringify({ error: "Invalid invite code.", code: "INVALID_INVITE" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Create user with email_confirm: true (bypasses confirmation requirement)
    const { data: userData, error: createErr } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createErr) {
      const msg = (createErr.message || "").toLowerCase();
      // Handle duplicate email — match broadly
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists") || msg.includes("duplicate")) {
        return new Response(
          JSON.stringify({ error: "An account with this email already exists. Please sign in instead.", code: "DUPLICATE_EMAIL" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Handle weak password
      if (msg.includes("password") && (msg.includes("weak") || msg.includes("short") || msg.includes("length") || msg.includes("characters"))) {
        return new Response(
          JSON.stringify({ error: createErr.message, code: "WEAK_PASSWORD" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Handle any other known auth error gracefully
      console.error("createUser error:", createErr.message);
      return new Response(
        JSON.stringify({ error: createErr.message || "Failed to create account. Please try again.", code: "AUTH_ERROR" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;

    // 3. Link user to label via user_profiles
    const { error: profileErr } = await adminClient
      .from("user_profiles")
      .upsert({ user_id: userId, label_id: label.id }, { onConflict: "user_id" });

    if (profileErr) {
      console.error("Profile upsert error:", profileErr);
      // Don't fail signup — user can still log in, profile can be fixed later
    }

    return new Response(
      JSON.stringify({ success: true, label_name: label.name }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("label-signup error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Something went wrong" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
