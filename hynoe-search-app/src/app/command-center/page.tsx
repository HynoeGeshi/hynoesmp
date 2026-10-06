import Link from 'next/link';

const METRICS = ['Page Views', 'Search Clicks', 'Inquiries', 'Page Health'] as const;

export default function CommandCenterOverview() {
  return (
    <div className="command-center-overview">
      <header className="command-center-header">
        <p className="eyebrow">Command Center</p>
        <h1>Overview</h1>
        <p>See what is happening with your Hynoe presence and what to improve next.</p>
      </header>

      <section className="command-center-metrics" aria-label="Page performance">
        {METRICS.map((label) => (
          <article key={label} className="command-center-metric-card">
            <span>{label}</span>
            <strong>—</strong>
            <small>Available after your Page is published.</small>
          </article>
        ))}
      </section>

      <section className="command-center-panel" aria-labelledby="recommended-actions-title">
        <div>
          <p className="eyebrow">What to do next</p>
          <h2 id="recommended-actions-title">Recommended Actions</h2>
          <p>Set up your Hynoe Page first. Once it is published, this dashboard will start showing real discovery and inquiry signals.</p>
        </div>
        <Link className="command-center-primary-action" href="/command-center/my-page">
          Set up my Page
        </Link>
      </section>
    </div>
  );
}
