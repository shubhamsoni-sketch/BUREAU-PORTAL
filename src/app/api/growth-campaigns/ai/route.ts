import { NextRequest, NextResponse } from 'next/server';
import { bearerToken, requireAdmin } from '@/lib/supabase/admin';

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function jsonError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

function isAuthError(auth: unknown): auth is { error: string; status: number } {
  return Boolean(auth && typeof auth === 'object' && 'error' in auth);
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const raw = fenced || text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object returned');
  return JSON.parse(raw.slice(start, end + 1));
}

function fallbackPlan(goal: string) {
  return {
    campaign_name: goal ? goal.slice(0, 80) : 'Loan Partner Outreach',
    audience_filter: 'Valid mobile, sales-ready leads, exclude opted-out contacts',
    template_goal: 'Start a compliant WhatsApp conversation and qualify interest.',
    message_preview:
      'Hi {{name}}, we are onboarding loan distribution partners in {{city}}. Reply YES if you want details.',
    variables: ['name', 'city'],
    followups: [
      'Follow up with interested leads after 24 hours.',
      'Ask preferred product: personal loan, business loan, home loan, or LAP.',
      'Move hot replies to callback/conversion queue.',
    ],
    guardrails: [
      'Use approved templates only.',
      'Skip invalid, duplicate and opted-out numbers.',
      'Keep daily sending cap enabled.',
    ],
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(bearerToken(request));
  if (isAuthError(auth)) return jsonError(auth.error, auth.status);

  let goal = '';
  try {
    const body = await request.json().catch(() => ({}));
    goal = clean(body.goal);
    if (goal.length < 8) return jsonError('Enter a clear campaign goal.');

    const fallback = fallbackPlan(goal);
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    if (!key) {
      return NextResponse.json({ success: true, source: 'fallback', plan: fallback });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Create a concise WhatsApp growth campaign plan for this business goal: ${goal}

Return strict JSON only:
{
  "campaign_name": "short name",
  "audience_filter": "who to target",
  "template_goal": "approved template purpose",
  "message_preview": "short compliant template body with {{name}}/{{city}} variables if useful",
  "variables": ["name","city"],
  "followups": ["short step"],
  "guardrails": ["short safety rule"]
}

Rules: no guaranteed loan, no guaranteed credit score improvement, concise business English, Indian lending/DSA context, avoid spammy wording.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 1600,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) throw new Error(`AI Assist failed: ${response.status}`);
    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = extractJson(text);
    return NextResponse.json({
      success: true,
      source: 'ai',
      plan: { ...fallback, ...parsed },
    });
  } catch (error) {
    console.error('[growth-campaigns/ai] failed:', error);
    return NextResponse.json({ success: true, source: 'fallback', plan: fallbackPlan(goal) });
  }
}
