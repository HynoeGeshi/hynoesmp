import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../lib/dashboard-core.mjs';

const now = new Date('2026-10-08T18:00:00Z');
const ready = (id, created_at = '2026-10-08T16:00:00Z', rest = {}) =>
  ({id, created_at, render_status:'ready', preview_uri:`${id}.mp4`, ...rest});

test('today counts only newly created ready media, using New York midnight', () => {
  assert.equal(typeof core.todayReadyCount, 'function');
  const rows = [
    ready('previous-day', '2026-10-08T03:59:59Z'),
    ready('today-start', '2026-10-08T04:00:00Z'),
    ready('today-end', '2026-10-09T03:59:59Z'),
    ready('tomorrow', '2026-10-09T04:00:00Z'),
  ];
  assert.equal(core.todayReadyCount(rows, now), 2);
});

test('render queue, missing media, quality holds, and invalid records are not delivered Shorts', () => {
  const rows = [
    ready('pending', undefined, {render_status:'pending', score:100, approval_state:'approved'}),
    ready('rendering', undefined, {render_status:'rendering'}),
    ready('failed', undefined, {render_status:'failed'}),
    ready('missing', undefined, {preview_uri:null, render_uri:null}),
    ready('empty', undefined, {preview_uri:'   ', render_uri:''}),
    ready('invalid-media', undefined, {preview_uri:{path:'clip.mp4'}}),
    ready('invalid-date', 'bad timestamp'),
    ready('missing-date', null),
    ready('', undefined),
    null,
    ready('render-fallback', undefined, {preview_uri:null, render_uri:'private-render.mp4'}),
  ];
  assert.equal(core.todayReadyCount(rows, now), 1);
});

test('unique deliveries remain counted after approval, rejection, private upload, or posting', () => {
  const rows = [
    ready('review', undefined, {approval_state:'pending'}),
    ready('approved', undefined, {approval_state:'approved'}),
    ready('rejected', undefined, {approval_state:'rejected'}),
    ready('private', undefined, {publishing_jobs:[{state:'uploaded_private'}]}),
    ready('posted', undefined, {publishing_jobs:[{state:'published'}]}),
    ready('posted', undefined, {publishing_jobs:[{state:'published'}]}),
  ];
  const original = structuredClone(rows);
  assert.equal(core.todayReadyCount(rows, now), 5);
  assert.deepEqual(rows, original);
  assert.equal(core.todayReadyCount([], now), 0);
});

test('daily target does not cap actual delivery count at 15', () => {
  assert.equal(core.todayReadyCount(Array.from({length:17}, (_,i) => ready(`new-${i}`)), now), 17);
});

test('spring DST uses the actual 23-hour New York day', () => {
  const rows = [
    ready('before', '2026-03-08T04:59:59Z'),
    ready('start', '2026-03-08T05:00:00Z'),
    ready('end', '2026-03-09T03:59:59Z'),
    ready('after', '2026-03-09T04:00:00Z'),
  ];
  assert.equal(core.todayReadyCount(rows, new Date('2026-03-08T16:00:00Z')), 2);
});

test('fall DST counts both repeated hours within the 25-hour New York day', () => {
  const rows = [
    ready('before', '2026-11-01T03:59:59Z'),
    ready('start', '2026-11-01T04:00:00Z'),
    ready('first-0130', '2026-11-01T05:30:00Z'),
    ready('second-0130', '2026-11-01T06:30:00Z'),
    ready('end', '2026-11-02T04:59:59Z'),
    ready('after', '2026-11-02T05:00:00Z'),
  ];
  assert.equal(core.todayReadyCount(rows, new Date('2026-11-01T17:00:00Z')), 4);
});
