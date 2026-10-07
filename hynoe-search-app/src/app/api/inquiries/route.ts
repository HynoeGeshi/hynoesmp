import { NextResponse } from 'next/server';

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }

  if (clean(body.website, 120)) return NextResponse.json({ ok: true }, { status: 202 });

  const payload = {
    pageId: clean(body.pageId, 80),
    senderName: clean(body.senderName, 100),
    senderEmail: clean(body.senderEmail, 320).toLowerCase(),
    message: clean(body.message, 4000),
    requestType: clean(body.requestType, 80) || null,
  };

  if (!payload.pageId || !payload.senderName || !payload.senderEmail.includes('@') || !payload.message) {
    return NextResponse.json({ ok: false, error: 'invalid_fields' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const inquiryGateKey = process.env.HYNOE_INQUIRY_GATE_KEY;
  if (!supabaseUrl || !publishableKey || !inquiryGateKey) {
    return NextResponse.json({ ok: false, error: 'service_unavailable' }, { status: 503 });
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/submit-hynoe-inquiry`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: publishableKey,
        authorization: `Bearer ${publishableKey}`,
        'x-hynoe-inquiry-key': inquiryGateKey,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const result = await response.json().catch(() => ({ ok: false, error: 'service_unavailable' }));
    return NextResponse.json(result, { status: response.status });
  } catch {
    return NextResponse.json({ ok: false, error: 'service_unavailable' }, { status: 503 });
  }
}
