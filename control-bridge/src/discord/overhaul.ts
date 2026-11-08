import type { DiscordChannel, DiscordClient, DiscordRole } from './types';

const HYNOE_GUILD_ID = '976637845542416476';
type Review = 'ambiguous' | 'type-mismatch' | 'category-ambiguous' | 'protected-missing';

export type PlannedCategory = {
  name: string;
  position: number;
  existingId?: string;
  hidden?: boolean;
  review?: Review;
};

export type PlannedChannel = {
  name: string;
  type: 0 | 2 | 5 | 15;
  category: string;
  existingId?: string;
  topic?: string;
  protected?: boolean;
  review?: Review;
};

const CATEGORY_ALIASES: Record<string, string[]> = {
  'Start Here': ['start here', 'bulletin board'],
  Community: ['community', 'hynoe community'],
  'Live / Content': ['live / content', 'hynoe live & content', 'live and content'],
  'Hynoe SMP': ['hynoe smp', 'minecraft server', 'smp'],
  'Hynoe Outpost': ['hynoe outpost', 'outpost'],
  'Hynoe Flicks': ['hynoe flicks', 'flicks', 'photography'],
  Events: ['events', 'community events'],
  Support: ['support', 'help'],
  'Staff / Control': ['staff / control', 'staff', 'admins only', 'admin'],
  'Future Hynoe Services': ['future hynoe services', 'hynoe services'],
};

const CHANNELS: Array<PlannedChannel & { aliases?: string[]; protectedId?: string }> = [
  { name: '🧭┃welcome-and-guide', type: 0, category: 'Start Here', protectedId: '1557453599502630932' },
  { name: '📜┃rules', type: 0, category: 'Start Here', aliases: ['rules'] },
  { name: '🎭┃choose-your-interests', type: 0, category: 'Start Here' },
  { name: '📢┃announcements', type: 5, category: 'Start Here', aliases: ['announcements'] },

  { name: '💬┃general', type: 0, category: 'Community', aliases: ['general'] },
  { name: '👋┃introductions', type: 0, category: 'Community' },
  { name: '😂┃memes', type: 0, category: 'Community' },
  { name: '🎮┃what-are-you-playing', type: 0, category: 'Community', aliases: ['setups'] },
  { name: '📊┃polls', type: 0, category: 'Community' },
  { name: '💡┃suggestions', type: 15, category: 'Community', aliases: ['suggestions'] },
  { name: '🖼️┃media', type: 0, category: 'Community', aliases: ['media'] },
  { name: '🔊┃general-voice', type: 2, category: 'Community' },

  { name: '🔴┃hynoe-live', type: 5, category: 'Live / Content', protectedId: '1557352371942588489' },
  { name: '▶️┃videos-and-shorts', type: 5, category: 'Live / Content', protectedId: '976639224193355818' },
  { name: '💬┃youtube-discussion', type: 0, category: 'Live / Content', aliases: ['youtube'] },
  { name: '🎬┃clips-and-highlights', type: 15, category: 'Live / Content' },
  { name: '📺┃stream-chat', type: 0, category: 'Live / Content' },
  { name: '💡┃content-suggestions', type: 15, category: 'Live / Content' },

  { name: '📌┃smp-info', type: 0, category: 'Hynoe SMP', aliases: ['minecraft info'] },
  { name: '📢┃smp-updates', type: 5, category: 'Hynoe SMP', aliases: ['minecraft announcements'] },
  { name: '⚔️┃server-chat', type: 0, category: 'Hynoe SMP', protectedId: '1320704486615941190' },
  { name: '🧰┃campaign-help', type: 0, category: 'Hynoe SMP' },
  { name: '👥┃looking-for-group', type: 0, category: 'Hynoe SMP' },
  { name: '🛒┃trading-market', type: 0, category: 'Hynoe SMP' },
  { name: '🏗️┃build-showcase', type: 15, category: 'Hynoe SMP' },
  { name: '🆘┃bugs-and-help', type: 15, category: 'Hynoe SMP', aliases: ['bug reports'] },
  { name: '🔊┃smp-voice', type: 2, category: 'Hynoe SMP' },

  { name: '📢┃outpost-news', type: 5, category: 'Hynoe Outpost' },
  { name: '💬┃outpost-chat', type: 0, category: 'Hynoe Outpost' },
  { name: '🧠┃strategies', type: 0, category: 'Hynoe Outpost' },
  { name: '🏆┃progress-and-leaderboards', type: 15, category: 'Hynoe Outpost' },
  { name: '💡┃outpost-feedback', type: 15, category: 'Hynoe Outpost' },
  { name: '🐛┃outpost-bugs', type: 15, category: 'Hynoe Outpost' },

  { name: '📸┃flicks-showcase', type: 15, category: 'Hynoe Flicks' },
  { name: '💬┃photography-chat', type: 0, category: 'Hynoe Flicks' },
  { name: '📝┃photo-feedback', type: 15, category: 'Hynoe Flicks' },
  { name: '📅┃book-a-shoot', type: 0, category: 'Hynoe Flicks' },
  { name: '🎥┃behind-the-scenes', type: 0, category: 'Hynoe Flicks' },

  { name: '📢┃event-announcements', type: 5, category: 'Events' },
  { name: '🎉┃event-chat', type: 0, category: 'Events' },
  { name: '🏅┃competitions-and-giveaways', type: 15, category: 'Events' },

  { name: '🆘┃help-desk', type: 15, category: 'Support', protectedId: '1557352545691631666' },

  { name: '🛡️┃mod-chat', type: 0, category: 'Staff / Control', aliases: ['admin chat'] },
  { name: '📋┃audit-log', type: 0, category: 'Staff / Control' },
  { name: '🤖┃bot-control', type: 0, category: 'Staff / Control', aliases: ['admin commands'] },
  { name: '🚨┃reports', type: 15, category: 'Staff / Control' },

  { name: '🌐┃services-info', type: 0, category: 'Future Hynoe Services' },
];

const PROTECTED_CHANNEL_IDS = new Set(CHANNELS.flatMap(channel => channel.protectedId ? [channel.protectedId] : []));

function normalize(name: string | undefined): string {
  return (name ?? '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

export function planHynoeOverhaul(channels: DiscordChannel[], roles: DiscordRole[]) {
  const existingCategories = channels.filter((channel) => channel.type === 4);
  const categories: PlannedCategory[] = Object.entries(CATEGORY_ALIASES).map(([name, aliases], position) => {
    const keys = [name, ...aliases].map(normalize);
    const matches = existingCategories.filter((channel) => keys.includes(normalize(channel.name)));
    const canonical = matches.filter(channel => normalize(channel.name) === normalize(name));
    const candidates = canonical.length ? canonical : matches;
    return {
      name,
      position,
      ...(candidates.length === 1 ? { existingId: candidates[0].id } : candidates.length > 1 ? { review: 'ambiguous' as const } : {}),
      ...(name === 'Future Hynoe Services' ? { hidden: true } : {}),
    };
  });
  const channelPlan: PlannedChannel[] = CHANNELS.map(({ aliases = [], protectedId, ...planned }) => {
    if (protectedId) {
      const existing = channels.find(channel => channel.id === protectedId);
      if (!existing) return { ...planned, protected: true, review: 'protected-missing' };
      // Existing alert destinations can be text or announcement channels.
      if (existing.type === planned.type || (planned.type === 5 && existing.type === 0)) {
        return { ...planned, protected: true, type: existing.type, existingId: existing.id };
      }
      return { ...planned, protected: true, review: 'type-mismatch' };
    }
    const keys = [planned.name, ...aliases].map(normalize);
    const matches = channels.filter(channel => !PROTECTED_CHANNEL_IDS.has(channel.id) && channel.type !== 4 && keys.includes(normalize(channel.name)));
    const category = categories.find(candidate => candidate.name === planned.category);
    const compatible = matches.filter(channel => channel.type === planned.type);
    const inCategory = category?.existingId ? compatible.filter(channel => channel.parent_id === category.existingId) : [];
    const candidates = inCategory.length ? inCategory : compatible;
    if (!compatible.length && matches.length) return { ...planned, review: 'type-mismatch' };
    if (category?.review) return { ...planned, review: 'category-ambiguous' };
    if (candidates.length > 1) return { ...planned, review: 'ambiguous' };
    if (candidates.length === 1) return { ...planned, existingId: candidates[0].id };
    return planned;
  });
  const plannedIds = new Set(channelPlan.flatMap((channel) => channel.existingId ? [channel.existingId] : []));
  const knownCategoryIds = new Set(categories.flatMap((category) => category.existingId ? [category.existingId] : []));
  const manualReview = channels.filter((channel) => channel.type === 4
    ? !knownCategoryIds.has(channel.id)
    : !plannedIds.has(channel.id)).map(({ id, name, type, parent_id }) => ({ id, name, type, parent_id }));
  const rolePlan = [
    'Hynoe', 'Staff', 'Moderator', 'Creator', 'Member', 'New Here',
    'Hynoe SMP', 'Hynoe Outpost', 'Hynoe Flicks', 'Streams & Content',
    'Gaming', 'Giveaways',
  ].map(name => {
    const matches = roles.filter(role => normalize(role.name) === normalize(name));
    return { name, ...(matches.length === 1 ? { existingId: matches[0].id } : matches.length > 1 ? { review: 'ambiguous' as const } : {}) };
  });

  return { categories, channelPlan, rolePlan, manualReview, deletions: [] as never[] };
}

export async function previewHynoeOverhaul(guildId: string, client: Pick<DiscordClient, 'listGuildChannels' | 'listGuildRoles'>) {
  if (guildId !== HYNOE_GUILD_ID) throw new Error('This preview is restricted to the Hynoe Discord guild');
  const [channels, roles] = await Promise.all([client.listGuildChannels(), client.listGuildRoles()]);
  return { guildId, dryRun: true, ...planHynoeOverhaul(channels, roles) };
}
