import { flagshipPages } from '@/data/flagship-pages';
import { getPublishedDatabasePages } from '@/lib/pages/public-pages';
import { PublicDiscoverySection } from './public-discovery-section';

// Stream the public database content separately so search and navigation stay usable.
export async function PublicDiscovery() {
  const communityPages = await getPublishedDatabasePages(12);
  return <PublicDiscoverySection pages={[...flagshipPages, ...communityPages]} />;
}
