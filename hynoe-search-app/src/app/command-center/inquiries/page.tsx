import Link from 'next/link';
import { getOwnedInquiries } from '@/lib/inquiries/owned-inquiries';
import { updateInquiryStatus } from './actions';

const statusOptions = ['new', 'read', 'replied', 'closed', 'spam'] as const;

export default async function InquiriesPage() {
  const inquiries = await getOwnedInquiries();

  return (
    <section>
      <div style={{ marginBottom: 24 }}>
        <p style={{ margin: 0, opacity: 0.62, textTransform: 'uppercase', letterSpacing: '.12em', fontSize: 12 }}>Leads</p>
        <h1 style={{ margin: '8px 0 6px' }}>Inquiries</h1>
        <p style={{ margin: 0, opacity: 0.7 }}>People who contacted one of your Hynoe Pages appear here.</p>
      </div>

      {inquiries.length === 0 ? (
        <div style={{ padding: 28, border: '1px solid rgba(255,255,255,.12)', borderRadius: 20, background: 'rgba(255,255,255,.03)' }}>
          <h2 style={{ marginTop: 0 }}>No inquiries yet</h2>
          <p style={{ opacity: 0.7, maxWidth: 620 }}>Publish a Hynoe Page and visitors can contact you directly from it.</p>
          <Link href="/command-center">Back to your Pages</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {inquiries.map((inquiry) => (
            <article key={inquiry.id} style={{ display: 'grid', gap: 14, padding: 20, border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, background: inquiry.status === 'new' ? 'rgba(244,199,100,.06)' : 'rgba(255,255,255,.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', flexWrap: 'wrap' }}>
                <div>
                  <strong>{inquiry.sender_name}</strong>
                  <div style={{ opacity: 0.65, fontSize: 14 }}>{inquiry.sender_email}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, opacity: 0.68 }}>
                  <div>{new Date(inquiry.created_at).toLocaleString()}</div>
                  {inquiry.page_slug ? <Link href={`/p/${inquiry.page_slug}`}>{inquiry.page_name}</Link> : inquiry.page_name}
                </div>
              </div>
              <p style={{ margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{inquiry.message}</p>
              <form action={updateInquiryStatus} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="hidden" name="inquiry_id" value={inquiry.id} />
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, opacity: 0.7 }}>Status</span>
                  <select name="status" defaultValue={inquiry.status} style={{ borderRadius: 10, padding: '8px 10px', background: '#101119', color: 'inherit', border: '1px solid rgba(255,255,255,.14)' }}>
                    {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
                <button type="submit" style={{ borderRadius: 999, padding: '8px 12px', border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: 'inherit', fontWeight: 700 }}>Update</button>
              </form>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
