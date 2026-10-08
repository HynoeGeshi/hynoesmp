import Link from 'next/link';
import { getPublicBusiness, sourceNeedsReview } from '@/data/public-businesses';

export function PublicListingNotice({ slug }: { slug: string }) {
  const business = getPublicBusiness(slug);
  if (!business) return null;
  return <aside aria-label="Public listing information" style={{ border: '1px solid #d7cfbb', borderRadius: 16, background: '#f3ede0', color: '#493e2b', padding: '22px 24px', margin: '24px 0', lineHeight: 1.8 }}>
    <strong style={{ display: 'block', fontSize: 16 }}>Unclaimed public-information listing</strong>
    <p style={{ margin: '10px 0', fontSize: 14 }}>Hynoe compiled these facts from the business website. This business has not claimed or approved this page and is not a Hynoe partner. Listing it does not imply endorsement in either direction.</p>
    <p style={{ margin: '10px 0', fontSize: 13 }}><a href={business.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>View the source ↗</a> · Reviewed <time dateTime={business.checkedAt}>{business.checkedAt}</time>. {sourceNeedsReview(business.checkedAt) ? 'This source needs a fresh review. ' : ''}Check current services and availability directly with the business.</p>
    <p style={{ margin: '10px 0', fontSize: 13 }}>No customer rating, verification badge or paid placement is attached to this listing.</p>
    <nav aria-label="Listing information and corrections" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 22px', fontSize: 14 }}>
      <Link href="/listing-policy" style={{ textDecoration: 'underline', padding: '8px 0' }}>Why is this business listed?</Link>
      <Link href={`/listing-policy?listing=${encodeURIComponent(business.slug)}#corrections`} style={{ textDecoration: 'underline', padding: '8px 0' }}>Correction, removal or ownership review</Link>
    </nav>
  </aside>;
}
