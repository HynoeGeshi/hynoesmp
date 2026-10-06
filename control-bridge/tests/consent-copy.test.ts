import { expect, it } from 'vitest';
import { CONTROL_PERMISSION_ITEMS } from '../src/components/ConsentClient';

it('describes guild-wide Discord management without implying destructive actions are automatic', () => {
  expect(CONTROL_PERMISSION_ITEMS.join(' ')).toMatch(/guild-wide Discord/i);
  expect(CONTROL_PERMISSION_ITEMS.join(' ')).toMatch(/reversible/i);
  expect(CONTROL_PERMISSION_ITEMS.join(' ')).toMatch(/confirmation/i);
  expect(CONTROL_PERMISSION_ITEMS.join(' ')).toMatch(/Bloom/i);
  expect(CONTROL_PERMISSION_ITEMS.join(' ')).not.toMatch(/approved Discord channels/i);
});
