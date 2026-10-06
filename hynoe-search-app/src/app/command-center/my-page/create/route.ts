import { NextResponse } from 'next/server';
import type { HynoePageType } from '@/domain/pages/types';
import { requireUser } from '@/lib/auth/require-user';
import { createOwnedPage } from '@/lib/pages/create-owned-page';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const user = await requireUser('/command-center/my-page');
  const formData = await request.formData();

  const name = formData.get('name');
  const slug = formData.get('slug');
  const pageType = formData.get('pageType');

  const result = await createOwnedPage(user.id, {
    name: typeof name === 'string' ? name : '',
    slug: typeof slug === 'string' ? slug : '',
    pageType: (typeof pageType === 'string' ? pageType : '') as HynoePageType,
  });

  const redirect = new URL('/command-center/my-page', url.origin);
  if (!result.ok) {
    redirect.searchParams.set('error', 'create-failed');
  }

  return NextResponse.redirect(redirect, 303);
}
