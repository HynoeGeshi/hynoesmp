import Link from 'next/link';
import { requireUser } from '@/lib/auth/require-user';
import { getOwnedPages } from '@/lib/pages/owned-pages';

export default async function CommandCenterPage() {
  const user = await requireUser();
  const pages = await getOwnedPages(user.id);

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'end', flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <p style={{ margin: 0, opacity: 0.62, textTransform: 'uppercase', letterSpacing: '.12em', fontSize: 12 }}>Owner workspace</p>
          <h1 style={{ margin: '8px 0 0' }}>Your Hynoe Pages</h1>
        </div>
        <Link href="/command-center/pages/new" style={{ textDecoration: 'none', fontWeight: 800 }}>Create a Hynoe Page</Link>
      </div>

      {pages.length === 0 ? (
        <div style={{ padding: 28, borderRadius: 20, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.03)' }}>
          <h2 style={{ marginTop: 0 }}>Build your first presence on Hynoe</h2>
          <p style={{ opacity: 0.7, maxWidth: 620 }}>Create a Page so people can discover what you do, understand why you are relevant, and contact you from Hynoe Search.</p>
          <Link href="/command-center/pages/new">Create your first Hynoe Page</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {pages.map((page) => (
            <article key={page.id} style={{ padding: 20, borderRadius: 18, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.03)', display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <strong>{page.name}</strong>
                  <div style={{ opacity: 0.62, fontSize: 13 }}>{page.page_type.replaceAll('_', ' ')}</div>
                </div>
                <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', opacity: page.publication_state === 'published' ? 1 : 0.64 }}>
                  {page.publication_state}
                </span>
              </div>
              {page.summary ? <p style={{ margin: 0, opacity: 0.72 }}>{page.summary}</p> : null}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Link href={`/command-center/pages/${page.id}`}>Manage</Link>
                {page.publication_state === 'published' ? <Link href={`/p/${page.slug}`}>View public Page</Link> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
