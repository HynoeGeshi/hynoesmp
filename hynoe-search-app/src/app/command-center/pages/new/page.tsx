import Link from 'next/link';
import { createHynoePage } from './actions';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewHynoePage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <section style={{ maxWidth: 760 }}>
      <Link href="/command-center">← Command Center</Link>
      <h1 style={{ marginTop: 20 }}>Create a Hynoe Page</h1>
      <p style={{ opacity: 0.72 }}>Start with the essentials. You can refine the Page, publish it, and add CreatorOps features afterward.</p>
      {error ? <p role="alert">We could not create that Page. Try a different name or URL slug.</p> : null}
      <form action={createHynoePage} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Page name</span>
          <input name="name" required maxLength={120} placeholder="Your business, channel, project, or community" />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Page type</span>
          <select name="page_type" defaultValue="creator">
            <option value="creator">Creator</option>
            <option value="local_business">Local business</option>
            <option value="service_provider">Service provider</option>
            <option value="community">Community</option>
            <option value="digital_product">Digital product / app / game</option>
            <option value="project_brand">Project / brand</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Hynoe URL</span>
          <input name="slug" maxLength={80} placeholder="your-name" />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Short description</span>
          <textarea name="summary" maxLength={240} rows={4} placeholder="Tell people what they can find, buy, book, join, or follow." />
        </label>
        <button type="submit" style={{ width: 'fit-content', padding: '12px 18px', fontWeight: 800 }}>Create Page</button>
      </form>
    </section>
  );
}
