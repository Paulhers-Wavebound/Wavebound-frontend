/**
 * n8n Workflow Status — returns workflow list + recent executions
 * GET — returns all workflows with active status + last 5 executions each
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

    // n8n API
    var n8nHost = Deno.env.get("N8N_HOST") || "http://46.225.104.247:5678";
    var n8nApiKey = Deno.env.get("N8N_API_KEY");

    if (!n8nApiKey) {
      return jsonResponse({
        error: "N8N_API_KEY not configured",
        workflows: [],
        executions: [],
        stats: null,
      });
    }

    var headers = { "X-N8N-API-KEY": n8nApiKey };

    // Fetch workflows and recent executions in parallel
    var [workflowsRes, executionsRes] = await Promise.all([
      fetch(`${n8nHost}/api/v1/workflows?limit=100`, { headers }),
      fetch(`${n8nHost}/api/v1/executions?limit=50`, { headers }),
    ]);

    if (!workflowsRes.ok) {
      return jsonResponse({
        error: `n8n API error: ${workflowsRes.status} ${workflowsRes.statusText}`,
        workflows: [],
        executions: [],
        stats: null,
      });
    }

    var workflowsData = await workflowsRes.json();
    var executionsData = executionsRes.ok
      ? await executionsRes.json()
      : { data: [] };

    // Process workflows
    var workflows = (workflowsData.data || []).map(function (wf: any) {
      return {
        id: wf.id,
        name: wf.name,
        active: wf.active,
        createdAt: wf.createdAt,
        updatedAt: wf.updatedAt,
        nodeCount: wf.nodes?.length || 0,
      };
    });

    // Process executions
    var executions = (executionsData.data || []).map(function (ex: any) {
      var startedAt = ex.startedAt
        ? new Date(ex.startedAt).toISOString()
        : null;
      var stoppedAt = ex.stoppedAt
        ? new Date(ex.stoppedAt).toISOString()
        : null;
      var durationMs =
        startedAt && stoppedAt
          ? new Date(stoppedAt).getTime() - new Date(startedAt).getTime()
          : null;

      return {
        id: ex.id,
        workflowId: ex.workflowId,
        workflowName: ex.workflowName || null,
        status: ex.status, // success, error, running, waiting, crashed
        mode: ex.mode, // manual, trigger, webhook, etc.
        startedAt: startedAt,
        stoppedAt: stoppedAt,
        durationMs: durationMs,
      };
    });

    // Compute stats
    var activeWorkflows = workflows.filter(function (w: any) {
      return w.active;
    }).length;
    var totalWorkflows = workflows.length;

    var now = Date.now();
    var last24h = executions.filter(function (e: any) {
      return (
        e.startedAt &&
        now - new Date(e.startedAt).getTime() < 24 * 60 * 60 * 1000
      );
    });
    var errorCount = last24h.filter(function (e: any) {
      return e.status === "error" || e.status === "crashed";
    }).length;
    var successCount = last24h.filter(function (e: any) {
      return e.status === "success";
    }).length;
    var runningCount = last24h.filter(function (e: any) {
      return e.status === "running" || e.status === "waiting";
    }).length;

    return jsonResponse({
      workflows: workflows,
      executions: executions,
      stats: {
        total_workflows: totalWorkflows,
        active_workflows: activeWorkflows,
        executions_24h: last24h.length,
        errors_24h: errorCount,
        success_24h: successCount,
        running: runningCount,
      },
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});
