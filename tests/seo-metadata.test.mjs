import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const expected = {
  'start.html': {
    title: 'Hynoe SMP First-Day Guide | Modded Minecraft Survival',
    description: 'Start Hynoe SMP with the first-day route: learn Genesis Ages, key commands, travel, economy basics, safe storage, and your next campaign goals.'
  },
  'progression.html': {
    title: 'Hynoe SMP Progression Guide | Campaign, Genesis Ages & Gear',
    description: 'Explore Hynoe SMP progression: Genesis Ages, the 31-stage campaign, gear tiers, rare equipment, milestones, and the long-term path to endgame.'
  },
  'economy.html': {
    title: 'Hynoe SMP Economy Guide | Jobs, Dollars, Tokens & Trading',
    description: 'Learn the Hynoe SMP economy: Hynoe Dollars, Tokens, Jobs+, player trading, server selling, and how progression rewards connect to survival.'
  },
  'mca.html': {
    title: 'Hynoe SMP Village Life Guide | MCA Families & Settlements',
    description: 'Build a living settlement in Hynoe SMP with Minecraft Comes Alive: relationships, marriage, children, homes, jobs, guards, and generations.'
  },
  'bosses.html': {
    title: 'Hynoe SMP Boss Guide | Endgame Fights, Gear & Rewards',
    description: 'Prepare for Hynoe SMP bosses with encounter routes, gear goals, Token rewards, rare drops, and endgame fights built for long-term progression.'
  },
  'modpack.html': {
    title: 'Install the Hynoe SMP Modpack | Minecraft Java Fabric',
    description: 'Install the Hynoe SMP Fabric modpack for Minecraft Java with the guided Modrinth setup, required client content, and recommended shader instructions.'
  },
  'watch.html': {
    title: 'Watch Hynoe & Play Hynoe Outpost | Hynoe SMP'
  }
};

for (const [file, meta] of Object.entries(expected)) {
  test(`${file} has search-ready title and description`, () => {
    const html = readFileSync(file, 'utf8');
    assert.match(html, new RegExp(`<title>${meta.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</title>`));
    if (meta.description) {
      assert.match(html, new RegExp(`<meta name="description" content="${meta.description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
      assert.ok(meta.description.length >= 110 && meta.description.length <= 170, `${file} description length should be 110-170 chars`);
    }
    assert.ok(meta.title.length >= 40 && meta.title.length <= 65, `${file} title length should be 40-65 chars`);
  });
}
