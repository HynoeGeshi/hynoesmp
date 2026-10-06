import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

  const pageId = clean(body.pageId, 80);
  const senderName = clean(body.senderName, 100);
  const senderEmail = clean(body.senderEmail, 320).toLowerCase();
  const message = clean(body.message, 4000);
  const requestType = clean(body.requestType, 80) || null;

  if (!pageId || !senderName || !senderEmail.includes('@') || !message) {
    return NextResponse.json({ ok: false, error: 'invalid_fields' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('id, publication_state')
      .eq('id', pageId)
      .eq('publication_state', 'published')
      .maybeSingle();

    if (pageError || !page) return NextResponse.json({ ok: false, error: 'page_not_found' }, { status: 404 });

    const { error } = await supabase.from('inquiries').insert({
      page_id: page.id,
      sender_name: senderName,
      sender_email: senderEmail,
      message,
      request_type: requestType,
      status: 'new',
    });

    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: 'service_unavailable' }, { status: 503 });
  }
}
