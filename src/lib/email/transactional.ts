type TransactionalEmailInput = {
  to: string | string[];
  subject: string;
  templateAlias: string;
  variables?: Record<string, unknown>;
  fallbackOnly?: boolean;
};

export async function sendTransactionalEmail(input: TransactionalEmailInput) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const authKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !authKey) {
    return { success: false, error: 'Supabase email function env is missing' };
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authKey}`,
      },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      return { success: false, error: data?.error || 'Email send failed' };
    }

    return { success: true, emailId: data.emailId as string | undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email send failed',
    };
  }
}
