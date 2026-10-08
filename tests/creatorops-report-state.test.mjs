import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read = file => fs.readFileSync(new URL('../creatorops/' + file, import.meta.url), 'utf8');

test('report CSS preserves hidden states against explicit flex display', () => {
  assert.match(read('report.css'), /\.report-shell\s+\[hidden\]\s*\{\s*display\s*:\s*none\s*!important\s*;?\s*\}/);
});
for (const state of ['loading', 'invalid', 'not-found', 'network-error', 'success']) {
  test(`report renderer sets exclusive hidden attributes: ${state}`, async () => {
    const nodes = Object.fromEntries(['loading', 'error', 'content'].map(name => ['#report-' + name, { hidden: name !== 'loading' }]));
    let release;
    const pending = new Promise(resolve => { release = resolve; });
    const context = vm.createContext({
      document: { querySelector: selector => nodes[selector] || null },
      location: { pathname: '/creatorops/report/' + (state === 'invalid' ? 'invalid' : 'a'.repeat(43)) },
      fetch: async () => {
        if (state === 'loading') await pending;
        if (state === 'network-error') throw new Error('synthetic failure');
        return { ok: state !== 'not-found', json: async () => ({ report: { version: 1 } }) };
      }
    });
    vm.runInContext(read('report.js'), context);
    await new Promise(resolve => setImmediate(resolve));
    const expected = state === 'loading' ? 'loading' : state === 'success' ? 'content' : 'error';
    assert.deepEqual(Object.entries(nodes).filter(([, node]) => !node.hidden).map(([key]) => key), ['#report-' + expected]);
    release();
  });
}
