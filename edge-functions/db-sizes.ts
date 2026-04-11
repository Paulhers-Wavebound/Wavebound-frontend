/**
 * Database Table Sizes — returns storage usage per table
 * GET — returns all public tables with row counts and byte sizes
 *
 * Admin-only: validates JWT and checks user_profiles.label_role = 'admin'
 */
import { createClient } from "npm:@supabase/supabase-js@2";

var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    var supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    var serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    var anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    var dbUrl = Deno.env.get("SUPABASE_DB_URL");
    var supabase = createClient(supabaseUrl, serviceKey);

    // Auth — require admin
    var authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    var userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    var {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }

    var { data: profile } = await supabase
      .from("user_profiles")
      .select("label_role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || profile.label_role !== "admin") {
      return jsonResponse({ error: "Admin access required" }, 403);
    }

    // Query table sizes via pg_stat — works with PostgREST service_role
    // pg_total_relation_size requires direct DB connection, so we use
    // pg_stat_user_tables for row estimates + pg_class for byte sizes
    var { data: tableStats, error: statsErr } =
      await supabase.rpc("get_table_sizes");

    if (statsErr) {
      // Fallback: use pg_stat_user_tables for row counts only (no byte sizes)
      var { data: pgStats } = await supabase
        .from("pg_stat_user_tables" as any)
        .select("relname,n_live_tup,last_vacuum,last_analyze")
        .order("n_live_tup", { ascending: false });

      var tables = (pgStats || []).map(function (t: any) {
        return {
          name: t.relname,
          estimated_rows: t.n_live_tup || 0,
          total_bytes: null,
          size_pretty: null,
          last_vacuum: t.last_vacuum,
          last_analyze: t.last_analyze,
        };
      });

      return jsonResponse({
        tables: tables,
        total_bytes: null,
        total_pretty: null,
        method: "pg_stat_fallback",
        fetched_at: new Date().toISOString(),
      });
    }

    // RPC exists — use full data
    var tables = (tableStats || []).map(function (t: any) {
      return {
        name: t.table_name,
        estimated_rows: t.estimated_rows || 0,
        total_bytes: t.total_bytes || 0,
        size_pretty: t.size_pretty || "0 bytes",
        table_bytes: t.table_bytes || 0,
        index_bytes: t.index_bytes || 0,
        toast_bytes: t.toast_bytes || 0,
      };
    });

    var totalBytes = tables.reduce(function (sum: number, t: any) {
      return sum + (t.total_bytes || 0);
    }, 0);

    return jsonResponse({
      tables: tables,
      total_bytes: totalBytes,
      total_pretty: formatBytes(totalBytes),
      method: "rpc",
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  var units = ["B", "KB", "MB", "GB", "TB"];
  var i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + units[i];
}
