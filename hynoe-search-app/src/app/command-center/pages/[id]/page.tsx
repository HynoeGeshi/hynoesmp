import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/require-user';
import { getManagedPage } from '@/lib/pages/manage-page';
import { updateHynoePage } from './actions';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function ManageHynoePage({ params, searchParams }: Props) {
  const user = await requireUser();
  const { id } = await params;
  const page = await getManagedPage(id, user.id);
  if (!page) notFound();
  const state = await searchParams;

  return (
    <section style={{ maxWidth: 820 }}>
      <Link href="/command-center">← Command Center</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'end', flexWrap: 'wrap', marginTop: 20 }}>
        <div>
          <p style={{ margin: 0, opacity: 0.62, textTransform: 'uppercase', letterSpacing: '.12em', fontSize: 12 }}>Manage Hynoe Page</p>
          <h1 style={{ margin: '8px 0 0' }}>{page.name}</h1>
        </div>
        {page.publication_state === 'published' ? <Link href={`/p/${page.slug}`}>View public Page</Link> : null}
      </div>
      {state.saved === '1' ? <p role="status">Saved.</p> : null}
      {state.error ? <p role="alert">That change could not be saved.</p> : null}
      <form action={updateHynoePage} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
        <input type="hidden" name="page_id" value={page.id} />
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Name</span>
          <input name="name" required maxLength={120} defaultValue={page.name} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Short description</span>
          <textarea name="summary" maxLength={240} rows={3} defaultValue={page.summary} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>About</span>
          <textarea name="description" maxLength={5000} rows={8} defaultValue={page.description} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Primary website</span>
          <input name="canonical_url" type="url" placeholder="https://" defaultValue={page.canonical_url ?? ''} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Visibility</span>
          <select name="publication_state" defaultValue={page.publication_state}>
            <option value="draft">Draft — only your team can manage it</option>
            <option value="published">Published — discoverable on Hynoe</option>
          </select>
        </label>
        <button type="submit" style={{ width: 'fit-content', padding: '12px 18px', fontWeight: 800 }}>Save Page</button>
      </form>
    </section>
  );
}
