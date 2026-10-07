import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/require-user';
import { getManagedPage } from '@/lib/pages/manage-page';
import { scorePageHealth } from '@/lib/pages/page-health';
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
  const health = scorePageHealth({
    pageType: page.page_type,
    publicationState: page.publication_state,
    name: page.name,
    summary: page.summary ?? '',
    description: page.description ?? '',
    canonicalUrl: page.canonical_url,
    categories: page.categories ?? [],
    tags: page.tags ?? [],
    locationLabel: page.location_label,
    serviceArea: page.service_area,
  });
  const healthLabel = health.band === 'strong' ? 'Strong' : health.band === 'building' ? 'Building' : 'Needs work';

  return (
    <section style={{ maxWidth: 900 }}>
      <Link href="/command-center">← Command Center</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'end', flexWrap: 'wrap', marginTop: 20 }}>
        <div>
          <p style={{ margin: 0, opacity: 0.62, textTransform: 'uppercase', letterSpacing: '.12em', fontSize: 12 }}>Manage Hynoe Page</p>
          <h1 style={{ margin: '8px 0 0' }}>{page.name}</h1>
        </div>
        {page.publication_state === 'published' ? <Link href={`/p/${page.slug}`}>View public Page</Link> : null}
      </div>

      <section style={{ marginTop: 24, padding: 20, border: '1px solid rgba(255,255,255,.12)', borderRadius: 18, background: 'rgba(255,255,255,.035)' }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, opacity: 0.66, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.12em' }}>Discovery readiness</p>
            <h2 style={{ margin: '6px 0 0' }}>Page Health: {health.score}/100</h2>
            <p style={{ margin: '6px 0 0', opacity: 0.72 }}>{healthLabel}. Aim for 90+ before pushing the Page hard.</p>
          </div>
          <div aria-label={`Page Health ${health.score} out of 100`} style={{ minWidth: 180, flex: '0 1 280px' }}>
            <div style={{ height: 10, borderRadius: 999, overflow: 'hidden', background: 'rgba(255,255,255,.1)' }}>
              <div style={{ width: `${health.score}%`, height: '100%', background: 'currentColor' }} />
            </div>
          </div>
        </div>
        {health.recommendations.length ? (
          <div style={{ marginTop: 16 }}>
            <strong>Next fixes</strong>
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              {health.recommendations.slice(0, 5).map((recommendation) => <li key={recommendation} style={{ marginTop: 8 }}>{recommendation}</li>)}
            </ul>
          </div>
        ) : <p style={{ marginBottom: 0 }}>This Page has the core discovery signals Hynoe needs.</p>}
      </section>

      {state.saved === '1' ? <p role="status">Saved. Page Health has been recalculated.</p> : null}
      {state.error === 'publish_incomplete' ? <p role="alert">Add both a short description and an About section before publishing.</p> : state.error ? <p role="alert">That change could not be saved.</p> : null}

      <form action={updateHynoePage} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
        <input type="hidden" name="page_id" value={page.id} />
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Name</span>
          <input name="name" required maxLength={120} defaultValue={page.name} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Short description</span>
          <textarea name="summary" maxLength={240} rows={3} defaultValue={page.summary} placeholder="What can people find, buy, book, join, or follow?" />
          <small style={{ opacity: 0.65 }}>60–240 characters is the strongest target for discovery.</small>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>About</span>
          <textarea name="description" maxLength={5000} rows={8} defaultValue={page.description} placeholder="Explain what you do, who it is for, proof or specialties, and what someone should do next." />
          <small style={{ opacity: 0.65 }}>Aim for at least 200 useful characters.</small>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Categories</span>
          <input name="categories" maxLength={600} defaultValue={(page.categories ?? []).join(', ')} placeholder="Photography, Creative Services" />
          <small style={{ opacity: 0.65 }}>Comma-separated. Use 2–4 precise categories.</small>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Search tags</span>
          <input name="tags" maxLength={1200} defaultValue={(page.tags ?? []).join(', ')} placeholder="photographer, portraits, events, chicago" />
          <small style={{ opacity: 0.65 }}>Comma-separated phrases people would realistically search.</small>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Location</span>
            <input name="location_label" maxLength={160} defaultValue={page.location_label ?? ''} placeholder="Chicago, IL" />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Service area</span>
            <input name="service_area" maxLength={240} defaultValue={page.service_area ?? ''} placeholder="Chicago south suburbs and nearby areas" />
          </label>
        </div>
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
