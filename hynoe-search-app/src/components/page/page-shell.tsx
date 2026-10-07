import type { HynoePage } from '@/domain/pages/types';
import { SaveFollowControls } from '@/components/retention/save-follow-controls';
import { PageViewTracker } from '@/lib/analytics/page-view-tracker';
import { InquiryForm } from './inquiry-form';
import { ModuleRenderer } from './module-renderer';
import { PageActions } from './page-actions';
import { PageHeader } from './page-header';
import styles from './page-shell.module.css';

const pageTypeLabels = {
  local_business: 'Local business',
  service_provider: 'Service provider',
  creator: 'Creator',
  community: 'Community',
  digital_product: 'Digital product',
  project_brand: 'Project',
} as const;

export function PageShell({ page, inquiryPageId }: { page: HynoePage; inquiryPageId?: string }) {
  const location = page.location?.onlineOnly
    ? 'Online'
    : page.location
      ? [page.location.city, page.location.region, page.location.country].filter(Boolean).join(', ')
      : '';

  return <main className={`site-shell ${styles.shell}`}>
    <PageViewTracker slug={page.slug} pageType={page.pageType} />
    <PageHeader />
    <section className={styles.hero}>
      <div className="eyebrow">{page.categories.join(' · ') || pageTypeLabels[page.pageType]}</div>
      <h1>{page.name}</h1>
      <p className={styles.summary}>{page.summary}</p>
      <p className={styles.description}>{page.description}</p>
      <div className={styles.metaRow}>
        <span className={styles.metaPill}>{pageTypeLabels[page.pageType]}</span>
        {location ? <span className={styles.metaPill}>{location}</span> : null}
        {page.tags.slice(0, 3).map((tag) => <span className={styles.metaPill} key={tag}>{tag}</span>)}
      </div>
      <PageActions canonicalUrl={page.canonicalUrl} />
      <SaveFollowControls slug={page.slug} />
    </section>
    {page.modules.length > 0 ? (
      <section className={`module-stack ${styles.modules}`}>
        {page.modules.map((module, index) => <ModuleRenderer key={`${module.type}-${index}`} module={module} />)}
      </section>
    ) : null}
    {inquiryPageId ? <InquiryForm pageId={inquiryPageId} pageName={page.name} /> : null}
  </main>;
}
