import Link from 'next/link';
import { requireUser } from '@/lib/auth/require-user';
import { listOwnedPages } from '@/lib/pages/list-owned-pages';

const PAGE_TYPES = [
  ['creator', 'Creator'],
  ['local_business', 'Local Business'],
  ['service_provider', 'Service Provider'],
  ['community', 'Community'],
  ['digital_product', 'Digital Product / Game / App'],
  ['project_brand', 'Project / Brand'],
] as const;

export default async function MyPageScreen() {
  const user = await requireUser('/command-center/my-page');
  const pages = await listOwnedPages(user.id);
  const page = pages[0];

  if (!page) {
    return (
      <div className="command-center-page-editor">
        <header className="command-center-header">
          <p className="eyebrow">My Page</p>
          <h1>Create your Hynoe Page</h1>
          <p>Start with the basics. Your Page stays private as a draft until you choose to publish it.</p>
        </header>

        <form className="command-center-form" action="/command-center/my-page/create" method="post">
          <label htmlFor="name">Page Name</label>
          <input id="name" name="name" type="text" required maxLength={120} autoComplete="organization" />

          <label htmlFor="slug">Page URL</label>
          <div className="command-center-slug-field">
            <span aria-hidden="true">hynoe.net/p/</span>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              maxLength={120}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-describedby="slug-help"
            />
          </div>
          <small id="slug-help">Use lowercase letters, numbers, and hyphens only.</small>

          <label htmlFor="pageType">Page Type</label>
          <select id="pageType" name="pageType" required defaultValue="creator">
            {PAGE_TYPES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <button type="submit">Create draft Page</button>
        </form>
      </div>
    );
  }

  return (
    <div className="command-center-page-editor">
      <header className="command-center-header command-center-header--with-action">
        <div>
          <p className="eyebrow">My Page</p>
          <h1>{page.name}</h1>
          <p>
            <span className="command-center-status">{page.publicationState}</span>
            {' · '}
            {page.role}
          </p>
        </div>
        <Link className="command-center-secondary-action" href={`/p/${page.slug}`}>
          Preview public Page
        </Link>
      </header>

      <section className="command-center-panel">
        <div>
          <p className="eyebrow">Page setup</p>
          <h2>Build out your Page</h2>
          <p>Add your summary, services, portfolio, location, links, and calls to action before publishing.</p>
        </div>
      </section>
    </div>
  );
}
