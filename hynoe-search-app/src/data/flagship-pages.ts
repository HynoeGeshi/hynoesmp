import type { HynoePage } from '../domain/pages/types';
import { validatePageCollection } from '../domain/pages/schema';

export const flagshipPages: readonly HynoePage[] = validatePageCollection([
  {
    id: 'hynoe-outpost', slug: 'hynoe-outpost', name: 'Hynoe Outpost', pageType: 'digital_product',
    summary: 'A Hynoe browser game built around progression, crew, strategy, and long-form play.',
    description: 'Hynoe Outpost is a first-party Hynoe game and the flagship example of an interactive digital product inside Hynoe Search.',
    categories: ['Games', 'Browser Games'], tags: ['game','browser','idle','strategy','crew','progression','outpost'],
    status: 'published', featured: true, canonicalUrl: 'https://outpost.hynoe.net', location: { onlineOnly: true },
    modules: [
      { type: 'hero', headline: 'Build deeper. Grow your crew. Keep pushing.' },
      { type: 'features', items: [
        { title: 'Progression', description: 'Long-form progression built to reward strategy and repeat play.' },
        { title: 'Crew', description: 'Collect and use crew members with different roles and advantages.' }
      ]},
      { type: 'cta', label: 'Play Hynoe Outpost', url: 'https://outpost.hynoe.net' }
    ]
  },
  {
    id: 'hynoe-smp', slug: 'hynoe-smp', name: 'Hynoe SMP', pageType: 'community',
    summary: 'A modded Minecraft survival community focused on progression, exploration, economy, bosses, and player-driven systems.',
    description: 'Hynoe SMP is an independent Hynoe-owned Minecraft community and a flagship example of a community listing on Hynoe Search.',
    categories: ['Gaming Communities', 'Minecraft'], tags: ['minecraft','server','smp','modded','survival','community','progression'],
    status: 'published', featured: true, canonicalUrl: 'https://hynoesmp.com', location: { onlineOnly: true },
    modules: [
      { type: 'hero', headline: 'A survival world built to keep progressing.' },
      { type: 'community', description: 'Explore, build, trade, progress through campaigns, fight bosses, and build player businesses.' },
      { type: 'cta', label: 'Visit Hynoe SMP', url: 'https://hynoesmp.com' }
    ]
  },
  {
    id: 'hynoe-flicks', slug: 'hynoe-flicks', name: 'Hynoe Flicks', pageType: 'service_provider',
    summary: 'Photography and visual work from Hynoe Flicks.',
    description: 'Hynoe Flicks is an independent photography brand and a flagship example of a creative service provider discovered through Hynoe Search.',
    categories: ['Photography', 'Creative Services'], tags: ['photographer','photography','photos','portraits','creative','visual'],
    status: 'published', featured: true, canonicalUrl: 'https://hynoeflicks.com',
    modules: [
      { type: 'hero', headline: 'Photography with its own point of view.' },
      { type: 'services', items: [{ name: 'Photography', description: 'View work and current service information on Hynoe Flicks.' }] },
      { type: 'cta', label: 'Visit Hynoe Flicks', url: 'https://hynoeflicks.com' }
    ]
  }
] as const satisfies readonly HynoePage[]);
