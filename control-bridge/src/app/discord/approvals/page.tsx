import { loadOAuthPublicConfig } from '../../../auth/public-config';
import { DiscordApprovalClient } from '../../../components/DiscordApprovalClient';
export const dynamic = 'force-dynamic';
export default function DiscordApprovalsPage() { return <DiscordApprovalClient {...loadOAuthPublicConfig()} />; }
