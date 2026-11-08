import { expect, it, vi } from 'vitest';
import { planHynoeOverhaul, previewHynoeOverhaul } from '../src/discord/overhaul';
it('preserves SMP chat and existing forum history without scheduling deletions', () => {
  const plan = planHynoeOverhaul([{ id: '1320704486615941190', type: 0, name: '⚔️┃minecraft-chat' }, { id: 'suggestions', type: 15, name: '💡┃suggestions' }, { id: 'staff', type: 4, name: 'Admins Only', permission_overwrites: [{ id: '976637845542416476', type: 0, allow: '0', deny: '1024' }] }], []);
  expect(plan.channelPlan.find(c => c.name === '⚔️┃server-chat')?.existingId).toBe('1320704486615941190');
  expect(plan.channelPlan.find(c => c.name === '💡┃suggestions')?.existingId).toBe('suggestions');
  expect(plan.categories.find(c => c.name === 'Staff / Control')?.existingId).toBe('staff');
  expect(plan.categories.find(c => c.name === 'Future Hynoe Services')?.hidden).toBe(true);
  expect(plan.deletions).toEqual([]);
  expect(plan.categories.map(c => c.name)).toContain('Events');
});

it('prefers the correctly typed channel in the intended category independent of inventory order', () => {
  const channels = [
    { id: 'community', type: 4, name: 'Community' },
    { id: 'wrong-type', type: 0, name: 'suggestions', parent_id: 'community' },
    { id: 'other-forum', type: 15, name: 'suggestions', parent_id: 'elsewhere' },
    { id: 'correct-forum', type: 15, name: 'suggestions', parent_id: 'community' },
  ];
  for (const inventory of [channels, [...channels].reverse()]) {
    const plan = planHynoeOverhaul(inventory, []);
    expect(plan.channelPlan.find(c => c.name === '💡┃suggestions')).toMatchObject({ existingId: 'correct-forum' });
    expect(plan.manualReview.map(c => c.id)).toEqual(expect.arrayContaining(['wrong-type', 'other-forum']));
  }
});

it('flags ambiguous categories and incompatible channel types for review rather than proposing duplicates', () => {
  const plan = planHynoeOverhaul([
    { id: 'community-a', type: 4, name: 'Community' },
    { id: 'community-b', type: 4, name: 'Community' },
    { id: 'text', type: 0, name: 'suggestions', parent_id: 'community-a' },
  ], []);
  expect(plan.categories.find(c => c.name === 'Community')).toMatchObject({ review: 'ambiguous' });
  expect(plan.channelPlan.find(c => c.name === '💡┃suggestions')).toMatchObject({ review: 'type-mismatch' });
  expect(plan.channelPlan.find(c => c.name === '💡┃suggestions')).not.toHaveProperty('existingId');
  expect(plan.deletions).toEqual([]);
});

it('keeps the established SMP relay ID even after a rename and flags missing relay inventory', () => {
  const other = { id: 'other', type: 0, name: 'server-chat' };
  const relay = { id: '1320704486615941190', type: 0, name: 'custom relay' };
  const target = (inventory: typeof other[]) => planHynoeOverhaul(inventory, []).channelPlan.find(c => c.name === '⚔️┃server-chat');
  expect(target([other, relay])).toMatchObject({ existingId: relay.id });
  expect(target([other])).toMatchObject({ review: 'protected-missing' });
  expect(target([other])).not.toHaveProperty('existingId');
});

it('keeps the verified welcome and separate alert destinations and omits retired channel and role proposals', () => {
  const plan = planHynoeOverhaul([
    { id: '1557453599502630932', type: 0, name: 'welcome-and-guide' },
    { id: '1557352371942588489', type: 0, name: 'hynoe-live' },
    { id: '976639224193355818', type: 5, name: 'hynoe-streams-and-videos' },
    { id: 'lookalike', type: 5, name: 'hynoe-live' },
    { id: 'legacy-creatorops', type: 0, name: 'creatorops' },
  ], []);
  expect(plan.channelPlan.find(c => c.name === '🧭┃welcome-and-guide')).toMatchObject({ existingId: '1557453599502630932', protected: true });
  expect(plan.channelPlan.find(c => c.name === '🔴┃hynoe-live')).toMatchObject({ existingId: '1557352371942588489', type: 0, protected: true });
  expect(plan.channelPlan.find(c => c.name === '▶️┃videos-and-shorts')).toMatchObject({ existingId: '976639224193355818', protected: true });
  expect(plan.channelPlan.map(c => c.name)).not.toContain('🧰┃creatorops');
  expect(plan.rolePlan.map(role => role.name)).not.toContain('Skateboarding');
  expect(plan.manualReview.map(c => c.id)).toEqual(expect.arrayContaining(['lookalike', 'legacy-creatorops']));
  expect(plan.deletions).toEqual([]);
});

it('reads one channel and role inventory for the exact Hynoe guild only', async () => {
  const client = { listGuildChannels: vi.fn(async () => []), listGuildRoles: vi.fn(async () => []) };
  await expect(previewHynoeOverhaul('different-guild', client)).rejects.toThrow(/restricted/i);
  expect(client.listGuildChannels).not.toHaveBeenCalled();
  expect(client.listGuildRoles).not.toHaveBeenCalled();
  await expect(previewHynoeOverhaul('976637845542416476', client)).resolves.toMatchObject({ guildId: '976637845542416476', dryRun: true, deletions: [] });
  expect(client.listGuildChannels).toHaveBeenCalledTimes(1);
  expect(client.listGuildRoles).toHaveBeenCalledTimes(1);
});
