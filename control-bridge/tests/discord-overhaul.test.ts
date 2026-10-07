import { expect, it } from 'vitest';
import { planHynoeOverhaul } from '../src/discord/overhaul';
it('preserves SMP chat and existing forum history without scheduling deletions', () => {
  const plan = planHynoeOverhaul([{ id: '1320704486615941190', type: 0, name: '⚔️┃minecraft-chat' }, { id: 'suggestions', type: 15, name: '💡┃suggestions' }, { id: 'staff', type: 4, name: 'Admins Only', permission_overwrites: [{ id: '976637845542416476', type: 0, allow: '0', deny: '1024' }] }], []);
  expect(plan.channelPlan.find(c => c.name === '⚔️┃server-chat')?.existingId).toBe('1320704486615941190');
  expect(plan.channelPlan.find(c => c.name === '💡┃suggestions')?.existingId).toBe('suggestions');
  expect(plan.categories.find(c => c.name === 'Staff / Control')?.existingId).toBe('staff');
  expect(plan.categories.find(c => c.name === 'Future Hynoe Services')?.hidden).toBe(true);
  expect(plan.deletions).toEqual([]);
  expect(plan.categories.map(c => c.name)).toContain('Events');
});
