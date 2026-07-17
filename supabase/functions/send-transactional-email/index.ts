import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fallbackHtml(templateAlias: string, variables: Record<string, unknown>) {
  if (templateAlias === "partner-enquiry-received") {
    return `
      <h2>New Partner Enquiry</h2>
      <p>A new partner enquiry has been submitted on Credit Trust.</p>
      <p><b>Company:</b> ${escapeHtml(variables.company_name)}</p>
      <p><b>Name:</b> ${escapeHtml(variables.partner_name)}</p>
      <p><b>Email:</b> ${escapeHtml(variables.email)}</p>
      <p><b>Mobile:</b> ${escapeHtml(variables.mobile)}</p>
      <p><b>State:</b> ${escapeHtml(variables.state)}</p>
      <p><b>Business Type:</b> ${escapeHtml(variables.business_type)}</p>
      <p><b>Service Type:</b> ${escapeHtml(variables.service_type)}</p>
    `;
  }

  if (templateAlias === "crm-demo-enquiry") {
    return `
      <h2>New CRM Demo Enquiry</h2>
      <p>A new CRM demo request has been submitted on CreditTrust.</p>
      <p><b>Name:</b> ${escapeHtml(variables.full_name)}</p>
      <p><b>Email:</b> ${escapeHtml(variables.email)}</p>
      <p><b>Mobile:</b> ${escapeHtml(variables.mobile)}</p>
      <p><b>Business / DSA Name:</b> ${escapeHtml(variables.business_name)}</p>
      <p><b>City:</b> ${escapeHtml(variables.city)}</p>
      <p><b>Team Size:</b> ${escapeHtml(variables.team_size)}</p>
      <p><b>Monthly Lead Volume:</b> ${escapeHtml(variables.lead_volume)}</p>
      <p><b>Loan Products:</b> ${escapeHtml(variables.loan_products)}</p>
      <p><b>Message:</b> ${escapeHtml(variables.message)}</p>
      <p><b>Submitted At:</b> ${escapeHtml(variables.submitted_at)}</p>
      <p><b>Source:</b> ${escapeHtml(variables.source)}</p>
    `;
  }

  if (templateAlias === "low-wallet-balance-alert") {
    return `
      <h2>Low Wallet Balance</h2>
      <p>Dear ${escapeHtml(variables.partner_name || "Partner")},</p>
      <p>Your Credit Trust wallet balance is low.</p>
      <p><b>Current Balance:</b> ₹${escapeHtml(variables.wallet_balance)}</p>
      <p><b>Recommended Minimum:</b> ₹${escapeHtml(variables.minimum_balance)}</p>
      <p><a href="${escapeHtml(variables.portal_link)}">Open Partner Portal</a></p>
    `;
  }

  if (templateAlias === "wallet-recharge-success") {
    return `
      <h2>Wallet Credits Added</h2>
      <p>Dear ${escapeHtml(variables.partner_name || "Partner")},</p>
      <p>Your Credit Trust wallet has been credited successfully.</p>
      <p><b>Amount:</b> ₹${escapeHtml(variables.amount)}</p>
      <p><b>New Balance:</b> ₹${escapeHtml(variables.new_balance)}</p>
      <p><b>Reference:</b> ${escapeHtml(variables.transaction_id || variables.invoice_number || "-")}</p>
      <p><a href="${escapeHtml(variables.portal_link)}">Open Partner Portal</a></p>
    `;
  }

  return `
    <h2>${escapeHtml(variables.heading || "Credit Trust Notification")}</h2>
    <p>${escapeHtml(variables.message || "You have a new Credit Trust update.")}</p>
  `;
}

async function sendViaResend(payload: Record<string, unknown>, apiKey: string) {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = req.headers.get("Authorization") || "";
    if (serviceRoleKey && authorization !== `Bearer ${serviceRoleKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { to, subject, templateAlias, variables = {}, fallbackOnly = false } = await req.json();

    if (!to || !subject || !templateAlias) {
      return new Response(JSON.stringify({ error: "to, subject and templateAlias are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured");

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Credit Trust <support@credittrust.in>";
    const recipients = Array.isArray(to) ? to : [to];
    const basePayload = {
      from: fromEmail,
      to: recipients,
      subject,
    };

    let response = fallbackOnly ? null : await sendViaResend({
      ...basePayload,
      template: {
        id: templateAlias,
        variables,
      },
    }, resendApiKey);

    if (!response || !response.ok) {
      const templateError = response ? await response.json().catch(() => null) : null;
      response = await sendViaResend({
        ...basePayload,
        html: fallbackHtml(templateAlias, variables),
      }, resendApiKey);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`Resend API error: ${JSON.stringify(errorData || templateError)}`);
      }
    }

    const data = await response.json();
    return new Response(JSON.stringify({ success: true, emailId: data.id }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Email failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
