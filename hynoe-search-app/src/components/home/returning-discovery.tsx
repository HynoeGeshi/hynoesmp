import { flagshipPages } from '@/data/flagship-pages';
import { RecentDiscovery } from '@/components/retention/recent-discovery';

export function ReturningDiscovery() {
  return <RecentDiscovery pages={flagshipPages} />;
}
