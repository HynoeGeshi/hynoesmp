import type { DiscordChannel, DiscordRole } from './types';

export type PlannedCategory = {
  name: string;
  position: number;
  existingId?: string;
  hidden?: boolean;
};

export type PlannedChannel = {
  name: string;
  type: 0 | 2 | 5 | 15;
  category: string;
  existingId?: string;
  topic?: string;
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

const CHANNELS: Array<PlannedChannel & { aliases?: string[] }> = [
  { name: '👋┃welcome', type: 0, category: 'Start Here' },
  { name: '🧭┃start-here', type: 0, category: 'Start Here' },
  { name: '📜┃rules', type: 0, category: 'Start Here', aliases: ['rules'] },
  { name: '🎭┃choose-your-interests', type: 0, category: 'Start Here' },
  { name: '📢┃announcements', type: 5, category: 'Start Here', aliases: ['announcements'] },

  { name: '💬┃general', type: 0, category: 'Community', aliases: ['general'] },
  { name: '👋┃introductions', type: 0, category: 'Community' },
  { name: '😂┃memes', type: 0, category: 'Community' },
  { name: '🎮┃what-are-you-playing', type: 0, category: 'Community', aliases: ['setups'] },
  { name: '📊┃polls', type: 0, category: 'Community' },
  { name: '💡┃suggestions', type: 15, category: 'Community', aliases: ['suggestions'] },
  { name: '🎵┃music', type: 0, category: 'Community', aliases: ['music'] },
  { name: '🖼️┃media', type: 0, category: 'Community', aliases: ['media'] },
  { name: '🔊┃general-voice', type: 2, category: 'Community' },

  { name: '🔴┃hynoe-live', type: 5, category: 'Live / Content', aliases: ['hynoe streams and videos', 'hynoe live'] },
  { name: '▶️┃youtube', type: 0, category: 'Live / Content' },
  { name: '🎬┃clips-and-highlights', type: 15, category: 'Live / Content' },
  { name: '📺┃stream-chat', type: 0, category: 'Live / Content' },
  { name: '💡┃content-suggestions', type: 15, category: 'Live / Content' },

  { name: '📌┃smp-info', type: 0, category: 'Hynoe SMP', aliases: ['minecraft info'] },
  { name: '📢┃smp-updates', type: 5, category: 'Hynoe SMP', aliases: ['minecraft announcements'] },
  { name: '⚔️┃server-chat', type: 0, category: 'Hynoe SMP', aliases: ['minecraft chat'] },
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

  { name: '🆘┃help-desk', type: 15, category: 'Support' },

  { name: '🛡️┃mod-chat', type: 0, category: 'Staff / Control', aliases: ['admin chat'] },
  { name: '📋┃audit-log', type: 0, category: 'Staff / Control' },
  { name: '🤖┃bot-control', type: 0, category: 'Staff / Control', aliases: ['admin commands'] },
  { name: '🚨┃reports', type: 15, category: 'Staff / Control' },

  { name: '🌐┃services-info', type: 0, category: 'Future Hynoe Services' },
  { name: '🧰┃creatorops', type: 0, category: 'Future Hynoe Services' },
  { name: '🛠️┃hynoe-net', type: 0, category: 'Future Hynoe Services' },
];

function normalize(name: string | undefined): string {
  return (name ?? '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

export function planHynoeOverhaul(channels: DiscordChannel[], roles: DiscordRole[]) {
  const existingCategories = channels.filter((channel) => channel.type === 4);
  const categories: PlannedCategory[] = Object.entries(CATEGORY_ALIASES).map(([name, aliases], position) => {
    const keys = [name, ...aliases].map(normalize);
    const found = existingCategories.find((channel) => keys.includes(normalize(channel.name)));
    return {
      name,
      position,
      ...(found ? { existingId: found.id } : {}),
      ...(name === 'Future Hynoe Services' ? { hidden: true } : {}),
    };
  });
  const channelPlan: PlannedChannel[] = CHANNELS.map(({ aliases = [], ...planned }) => {
    const keys = [planned.name, ...aliases].map(normalize);
    const found = channels.find((channel) => channel.type !== 4 && keys.includes(normalize(channel.name)));
    return { ...planned, ...(found ? { existingId: found.id } : {}) };
  });
  const plannedIds = new Set(channelPlan.flatMap((channel) => channel.existingId ? [channel.existingId] : []));
  const knownCategoryIds = new Set(categories.flatMap((category) => category.existingId ? [category.existingId] : []));
  const manualReview = channels.filter((channel) => channel.type === 4
    ? !knownCategoryIds.has(channel.id)
    : !plannedIds.has(channel.id)).map(({ id, name, type, parent_id }) => ({ id, name, type, parent_id }));
  const rolePlan = [
    'Hynoe', 'Staff', 'Moderator', 'Creator', 'Member', 'New Here',
    'Hynoe SMP', 'Hynoe Outpost', 'Hynoe Flicks', 'Streams & Content',
    'Skateboarding', 'Fitness', 'Music', 'Giveaways',
  ].map((name) => ({ name, existingId: roles.find((role) => normalize(role.name) === normalize(name))?.id }));

  return { categories, channelPlan, rolePlan, manualReview, deletions: [] as never[] };
}
