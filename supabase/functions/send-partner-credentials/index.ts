import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

serve(async (req) => {
  // ✅ CORS preflight
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

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 8px;">
        <div style="background: #1e293b; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Insight</h1>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 14px;">Partner Portal</p>
        </div>
        <div style="background: #ffffff; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">Welcome, ${partnerName}!</h2>
          <p style="color: #475569; line-height: 1.6;">
            Your partner account has been approved. You can now access the Insight Partner Portal using the credentials below.
          </p>
          <div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Your Login Credentials</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 120px;">Email</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600; font-size: 14px;">${partnerEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Password</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600; font-size: 14px; font-family: monospace;">${tempPassword}</td>
              </tr>
            </table>
          </div>
          <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #92400e; font-size: 13px;">
              ⚠️ This is a temporary password. You will be required to change it on your first login.
            </p>
          </div>
          <a href="${loginUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 15px;">
            Login to Partner Portal →
          </a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; margin-bottom: 0;">
            If you did not request this account, please ignore this email or contact support.
          </p>
        </div>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: [partnerEmail],
        subject: "Your Insight Partner Account is Approved",
        html: emailHtml,
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
