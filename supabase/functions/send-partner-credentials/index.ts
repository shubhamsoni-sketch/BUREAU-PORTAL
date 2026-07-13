import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

serve(async (req) => {
  if (req?.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const { partnerName, partnerEmail, tempPassword, loginUrl } = await req?.json();

    const RESEND_API_KEY = Deno?.env?.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const fromEmail = Deno?.env?.get("RESEND_FROM_EMAIL") || "Credit Trust <support@credittrust.in>";
    const templateId = Deno?.env?.get("RESEND_PARTNER_WELCOME_TEMPLATE") || "partner-welcome-mail";
    const partnerLoginUrl = loginUrl || "https://credittrust.in/partner-login";
    const subject = Deno?.env?.get("RESEND_PARTNER_WELCOME_SUBJECT") || "Welcome to Credit Trust Partner Portal";
    const variables = {
      PARTNER_NAME: partnerName,
      PARTNER_EMAIL: partnerEmail,
      TEMP_PASSWORD: tempPassword,
      LOGIN_URL: partnerLoginUrl,
      partner_name: partnerName,
      partner_email: partnerEmail,
      temporary_password: tempPassword,
      portal_link: partnerLoginUrl,
      partnerName,
      partnerEmail,
      tempPassword,
      loginUrl: partnerLoginUrl,
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [partnerEmail],
        subject,
        template: {
          id: templateId,
          variables,
        },
      }),
    });

    if (!response?.ok) {
      const errorData = await response?.json();
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response?.json();

    return new Response(JSON.stringify({ success: true, emailId: data.id }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
