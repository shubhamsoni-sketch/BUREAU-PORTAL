import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, pan, dob, phone, email, state } = body;

    if (!fullName || !pan || !dob || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, pan, dob, phone' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL;
    const backendToken = process.env.BACKEND_TOKEN;

    if (!backendUrl || !backendToken) {
      console.error('Missing BACKEND_URL or BACKEND_TOKEN environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const backendResponse = await fetch(`${backendUrl}/api/create-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token: backendToken,
      },
      body: JSON.stringify({ fullName, pan, dob, phone, email, state }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error:', backendResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to create profile on backend' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();

    const formId: string | null =
      data.formId ?? data.form_id ?? data.id ?? data.profileId ?? null;

    if (!formId) {
      console.error('Backend did not return a formId:', data);
      return NextResponse.json(
        { error: 'Backend did not return a formId' },
        { status: 502 }
      );
    }

    return NextResponse.json({ formId });
  } catch (error) {
    console.error('create-profile route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
