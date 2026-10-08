import type { HynoePage } from '../domain/pages/types';
import { validatePageCollection } from '../domain/pages/schema';

// These are ordinary published pages. Ownership confers no Search ranking boost.
export const flagshipPages: readonly HynoePage[] = validatePageCollection([
  {
    id: 'hynoe-outpost', slug: 'hynoe-outpost', name: 'Hynoe Outpost', pageType: 'digital_product',
    summary: 'A Hynoe browser game built around progression, crew, strategy, and long-form play.',
    description: 'Hynoe Outpost is a first-party Hynoe browser game. Play at the existing Watch & Play hub so local progress stays at its current address.',
    categories: ['Games', 'Browser Games'], tags: ['game','browser','idle','strategy','crew','progression','outpost'],
    status: 'published', featured: false, canonicalUrl: 'https://hynoesmp.com/watch.html#game', location: { onlineOnly: true },
    modules: [
      { type: 'hero', headline: 'Build deeper. Grow your crew. Keep pushing.' },
      { type: 'features', items: [
        { title: 'Progression', description: 'Progress through the browser game at your own pace.' },
        { title: 'Crew', description: 'Collect and use crew members with different roles and advantages.' }
      ]},
      { type: 'cta', label: 'Play Hynoe Outpost', url: 'https://hynoesmp.com/watch.html#game' }
    ]
  },
  {
    id: 'hynoe-smp', slug: 'hynoe-smp', name: 'Hynoe SMP', pageType: 'community',
    summary: 'A modded Minecraft survival community focused on progression, exploration, economy, bosses, and player-driven systems.',
    description: 'Hynoe SMP is a Hynoe-owned Minecraft community. It is not affiliated with Mojang or Microsoft.',
    categories: ['Gaming Communities', 'Minecraft'], tags: ['minecraft','server','smp','modded','survival','community','progression'],
    status: 'published', featured: false, canonicalUrl: 'https://hynoesmp.com', location: { onlineOnly: true },
    modules: [
      { type: 'hero', headline: 'A survival world built to keep progressing.' },
      { type: 'community', description: 'Explore, build, trade, progress through campaigns, fight bosses, and build player businesses.' },
      { type: 'cta', label: 'Visit Hynoe SMP', url: 'https://hynoesmp.com' }
    ]
  },
  {
    id: 'hynoe-flicks', slug: 'hynoe-flicks', name: 'Hynoe Flicks', pageType: 'service_provider',
    summary: 'Photography and visual work from Hynoe Flicks.',
    description: 'The photography side of Hynoe. This profile is available while the separate portfolio website is being restored.',
    categories: ['Photography', 'Creative Services'], tags: ['photographer','photography','photos','portraits','creative','visual'],
    status: 'published', featured: false, canonicalUrl: 'https://hynoe-search-direct.onrender.com/p/hynoe-flicks',
    modules: [
      { type: 'hero', headline: 'Photography with its own point of view.' },
      { type: 'services', items: [{ name: 'Photography', description: 'Portfolio and booking details will be shown here when the destination is ready.' }] }
    ]
  },
  {
    id: 'hynoe-creatorops', slug: 'hynoe-creatorops', name: 'Hynoe CreatorOps', pageType: 'service_provider',
    summary: 'Creator audits, publishing systems and growth-planning tools from Hynoe.',
    description: 'A Hynoe-owned service for creator operations. Start with the free audit or explore the Growth Sprint. Account access requires owner authorization; results are not guaranteed.',
    categories: ['Creator Services', 'Creative Services'], tags: ['creatorops','creator','audit','content','growth','monetization','youtube','tiktok','services'],
    status: 'published', featured: false, canonicalUrl: 'https://hynoe-creatorops.onrender.com/creatorops', location: { onlineOnly: true },
    modules: [
      { type: 'hero', headline: 'You make the work. We help it go further.' },
      { type: 'cta', label: 'Explore CreatorOps', url: 'https://hynoe-creatorops.onrender.com/creatorops' },
      { type: 'cta', label: 'Open Growth Sprint tools', url: 'https://hynoe-creatorops.onrender.com/creatorops/growth.html' }
    ]
  },
  {
    id: 'hynoe', slug: 'hynoe', name: 'Hynoe', pageType: 'creator',
    summary: 'Gaming streams and the creator behind the Hynoe network.',
    description: 'The Hynoe creator page connects the YouTube channel with the Watch & Play community hub. This is a first-party Hynoe page, not an outside endorsement.',
    categories: ['Gaming Creators', 'Livestreaming'], tags: ['creator','youtube','hynoe','stream','gaming','minecraft','gears'],
    status: 'published', featured: false, canonicalUrl: 'https://www.youtube.com/@Hynoe', location: { onlineOnly: true },
    modules: [
      { type: 'hero', headline: 'Good games. Better company.' },
      { type: 'cta', label: 'Visit Hynoe on YouTube', url: 'https://www.youtube.com/@Hynoe' },
      { type: 'cta', label: 'Open Watch & Play', url: 'https://hynoesmp.com/watch.html' }
    ]
  }
] as const satisfies readonly HynoePage[]);
