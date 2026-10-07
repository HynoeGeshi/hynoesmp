'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';
import { HYNOE_SEARCH_TABLES } from '@/lib/supabase/table-names';

const allowedStatuses = new Set(['new', 'read', 'replied', 'closed', 'spam']);

export async function updateInquiryStatus(formData: FormData) {
  await requireUser();
  const inquiryId = String(formData.get('inquiry_id') ?? '');
  const requestedStatus = String(formData.get('status') ?? '');
  if (!inquiryId || !allowedStatuses.has(requestedStatus)) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from(HYNOE_SEARCH_TABLES.inquiries)
    .update({ status: requestedStatus, updated_at: new Date().toISOString() })
    .eq('id', inquiryId);

  if (!error) revalidatePath('/command-center/inquiries');
}
