/**
 * Forward a Signal Report decision point to a teammate, an external email,
 * or a Slack channel. Also persists an audit row in decision_point_actions.
 *
 * POST body: {
 *   target: 'user' | 'email' | 'slack',
 *   target_value: string,          // user_id | email address | slack channel name
 *   label_id: string,
 *   brief_date: string,            // YYYY-MM-DD
 *   decision_point_key: string,
 *   decision_point_snapshot: {
 *     category: string,
 *     artist_name: string,
 *     artist_handle: string,
 *     signal: string,
 *     decision: string,
 *     urgency: string,
 *     evidence?: Array<{label: string, value: string}>,
 *   },
 *   note?: string,
 * }
 *
 * Auth: requires caller's JWT (reads user_id via supabase.auth.getUser()).
 * Env: SLACK_WEBHOOK_URL (optional), RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface DecisionPointSnapshot {
  category: string;
  artist_name: string;
  artist_handle: string;
  signal: string;
  decision: string;
  urgency: string;
  evidence?: Array<{ label: string; value: string }>;
}

interface ForwardRequest {
  target: "user" | "email" | "slack";
  target_value: string;
  label_id: string;
  brief_date: string;
  decision_point_key: string;
  decision_point_snapshot: DecisionPointSnapshot;
  note?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderEmailHtml(
  dp: DecisionPointSnapshot,
  note: string | undefined,
  senderName: string,
  briefDate: string,
): string {
  const evidenceHtml =
    dp.evidence && dp.evidence.length > 0
      ? `<div style="margin-top:16px;padding-top:16px;border-top:1px solid #eee;">
           <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#888;margin-bottom:8px;">Evidence</div>
           ${dp.evidence
             .map(
               (e) =>
                 `<div style="font-size:13px;color:#444;margin-bottom:4px;"><strong>${escapeHtml(e.label)}:</strong> ${escapeHtml(e.value)}</div>`,
             )
             .join("")}
         </div>`
      : "";

  const noteHtml = note
    ? `<div style="margin-bottom:24px;padding:16px;background:#fff8f3;border-left:3px solid #e8430a;border-radius:4px;">
         <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#e8430a;margin-bottom:6px;">Note from ${escapeHtml(senderName)}</div>
         <div style="font-size:14px;color:#333;white-space:pre-wrap;">${escapeHtml(note)}</div>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;line-height:1.5;color:#333;max-width:600px;margin:0 auto;padding:24px;">
  <div style="margin-bottom:24px;">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#888;">Wavebound Signal Report — ${escapeHtml(briefDate)}</div>
    <h1 style="font-size:20px;margin:8px 0 0 0;color:#1c1c1e;">${escapeHtml(senderName)} forwarded you a decision point</h1>
  </div>

  ${noteHtml}

  <div style="padding:20px;background:#f8f9fa;border-radius:12px;margin-bottom:24px;">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#e8430a;font-weight:600;margin-bottom:8px;">${escapeHtml(dp.category)} · ${escapeHtml(dp.urgency)}</div>
    <div style="font-size:16px;font-weight:600;color:#1c1c1e;margin-bottom:12px;">${escapeHtml(dp.artist_name)} <span style="color:#888;font-weight:400;font-size:13px;">${escapeHtml(dp.artist_handle)}</span></div>
    <div style="font-size:14px;color:#444;margin-bottom:12px;"><strong>Signal:</strong> ${escapeHtml(dp.signal)}</div>
    <div style="font-size:14px;color:#444;"><strong>Recommended decision:</strong> ${escapeHtml(dp.decision)}</div>
    ${evidenceHtml}
  </div>

  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;text-align:center;color:#999;font-size:12px;">
    <p>Wavebound — Label intelligence portal</p>
  </div>
</body>
</html>`;
}

function renderSlackPayload(
  dp: DecisionPointSnapshot,
  note: string | undefined,
  senderName: string,
  briefDate: string,
) {
  const headerText = `*${senderName}* forwarded a decision point from the Signal Report (${briefDate})`;
  const evidenceLines =
    dp.evidence && dp.evidence.length > 0
      ? dp.evidence.map((e) => `• *${e.label}:* ${e.value}`).join("\n")
      : "";

  const blocks: unknown[] = [
    {
      type: "section",
      text: { type: "mrkdwn", text: headerText },
    },
  ];

  if (note) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `> ${note.replace(/\n/g, "\n> ")}` },
    });
  }

  blocks.push({ type: "divider" });

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        `*${dp.category.toUpperCase()} · ${dp.urgency.toUpperCase()}*\n` +
        `*${dp.artist_name}* \`${dp.artist_handle}\`\n\n` +
        `*Signal:* ${dp.signal}\n` +
        `*Decision:* ${dp.decision}` +
        (evidenceLines ? `\n\n${evidenceLines}` : ""),
    },
  });

  return { text: headerText, blocks };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json()) as ForwardRequest;

    if (
      !body.target ||
      !body.target_value ||
      !body.label_id ||
      !body.brief_date ||
      !body.decision_point_key ||
      !body.decision_point_snapshot
    ) {
      return jsonResponse({ error: "Missing required fields" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } =
      await userClient.auth.getUser(token);
    if (userErr || !userData.user) {
      return jsonResponse({ error: "Invalid auth token" }, 401);
    }
    const senderUserId = userData.user.id;
    const senderEmail = userData.user.email ?? "";

    // Resolve sender display name from user_profiles (service role bypasses RLS)
    const serviceClient = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await serviceClient
      .from("user_profiles")
      .select("artist_handle")
      .eq("user_id", senderUserId)
      .maybeSingle();
    const senderName =
      profile?.artist_handle || senderEmail.split("@")[0] || "A teammate";

    // Dispatch
    let dispatchResult: Record<string, unknown> = {};

    if (body.target === "email") {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      const html = renderEmailHtml(
        body.decision_point_snapshot,
        body.note,
        senderName,
        body.brief_date,
      );
      const sendRes = await resend.emails.send({
        from: "Wavebound <hello@contact.wavebound.ai>",
        to: [body.target_value],
        subject: `${senderName} forwarded you a Wavebound decision point — ${body.decision_point_snapshot.artist_name}`,
        html,
      });
      dispatchResult = { resend: sendRes };
    } else if (body.target === "slack") {
      const webhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
      if (!webhookUrl) {
        return jsonResponse(
          {
            error:
              "Slack forwarding is not configured. Set SLACK_WEBHOOK_URL in Supabase secrets.",
          },
          501,
        );
      }
      const payload = renderSlackPayload(
        body.decision_point_snapshot,
        body.note,
        senderName,
        body.brief_date,
      );
      const slackRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!slackRes.ok) {
        const text = await slackRes.text();
        throw new Error(`Slack webhook failed: ${slackRes.status} ${text}`);
      }
      dispatchResult = { slack: "ok" };
    } else if (body.target === "user") {
      // Validate recipient shares a label with sender, via teammate helper
      const { data: teammates, error: tmErr } = await serviceClient.rpc(
        "get_label_teammates",
        { p_label_id: body.label_id },
      );
      if (tmErr) throw tmErr;
      const recipient = (teammates as Array<{ user_id: string }> | null)?.find(
        (t) => t.user_id === body.target_value,
      );
      if (!recipient) {
        return jsonResponse({ error: "Recipient is not on this label" }, 403);
      }
      dispatchResult = { user: body.target_value };
    } else {
      return jsonResponse({ error: "Invalid target" }, 400);
    }

    // Audit row — always written, even for external sends
    const insertRow = {
      user_id: senderUserId,
      label_id: body.label_id,
      brief_date: body.brief_date,
      decision_point_key: body.decision_point_key,
      decision_point_snapshot: body.decision_point_snapshot,
      action_type: "forwarded" as const,
      forwarded_to_user_id: body.target === "user" ? body.target_value : null,
      forwarded_to_email: body.target === "email" ? body.target_value : null,
      forwarded_to_slack_channel:
        body.target === "slack" ? body.target_value : null,
      forward_note: body.note ?? null,
    };

    const { error: insertErr } = await serviceClient
      .from("decision_point_actions")
      .insert(insertRow);

    if (insertErr) {
      console.error("Audit insert failed:", insertErr);
      // Don't fail the request — the external send already succeeded.
    }

    return jsonResponse({ success: true, ...dispatchResult });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("forward-decision-point error:", msg);
    return jsonResponse({ error: msg }, 500);
  }
};

Deno.serve(handler);
