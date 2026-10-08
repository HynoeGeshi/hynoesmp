import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as changeApi from '../lib/owner-change.mjs';

const source = await readFile(new URL('../public/changes.mjs', import.meta.url), 'utf8');
const requestId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const approvalId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const exactPackage = {action: 'public_video_metadata', resource_id: 'publicVideo', before: {snippet: {title: 'Current title'}}, after: {title: 'Reviewed title'}};

class Element {
  constructor(tag = 'div') {
    this.tagName = tag; this.children = []; this.listeners = new Map();
    this.value = ''; this.checked = false; this.disabled = false;
    const classes = new Set();
    this.classList = {add: name => classes.add(name), remove: name => classes.delete(name), toggle: (name, force) => {
      const add = force === undefined ? !classes.has(name) : force;
      if (add) classes.add(name); else classes.delete(name);
      return add;
    }};
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = [...children]; }
  addEventListener(name, handler) { this.listeners.set(name, handler); }
  setAttribute(name, value) { this[name] = value; }
}
async function harness() {
  const elements = new Map();
  const calls = [];
  const session = {user: {id: 'owner-session', email: 'owner@example.test'}};
  const query = {select() {return this;}, eq() {return this;}, not() {return this;}, gte() {return this;}, lt() {return this;}, order: async () => ({data: []})};
  const client = {
    auth: {getSession: async () => ({data: {session}}), onAuthStateChange() {}, signOut: async () => ({})},
    from: () => query,
    rpc: async (name, args) => {
      calls.push({name, args});
      return {data: name === 'is_original_youtube_change_owner' ? true : approvalId};
    },
    functions: {invoke: async (name, {body}) => {
      calls.push({name, body});
      return {data: body.operation === 'prepare' ? {id: requestId, package: structuredClone(exactPackage), state: 'awaiting_review'} : {ok: true, verified: true, state: 'applied'}};
    }}
  };
  const document = {getElementById(id) {if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id);}, createElement: tag => new Element(tag), querySelectorAll: () => []};
  const window = {__HYNOE_YOUTUBE_AGENT_CONFIG__: {supabaseUrl: 'https://example.test', supabaseAnonKey: 'test'}, confirm() {throw Error('Native confirm must not be used');}};
  const proposals = {channel: [], playlists: [], videos: [{key: 'fixture', action: 'public_video_metadata', resource_id: 'publicVideo', title: 'Reviewed title', target: {title: 'Reviewed title'}}]};
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const run = new AsyncFunction('createClient', 'CHANGE_CHANNEL', 'CHANGE_CONFIRMATION', 'prepareExactChange', 'recordExactChange', 'applyExactChange', 'verifyReviewHold', 'PUBLIC_CHANGE_DRAFTS', 'HOME_DRAFTS', 'document', 'window',
    source.replace(/^import .*;\r?\n/gm, '') + '\nreturn {rows, operate, controls, showPackage, reset};');
  const api = await run(() => client, changeApi.CHANGE_CHANNEL, changeApi.CHANGE_CONFIRMATION, changeApi.prepareExactChange, changeApi.recordExactChange, changeApi.applyExactChange, changeApi.verifyReviewHold, proposals, [], document, window);
  return {api, row: api.rows.get('fixture'), calls};
}

test('owner change review works without native JavaScript confirmation dialogs', () => {
  assert.doesNotMatch(source, /window\.confirm\s*\(/);
});

test('prepared exact consent stays unchecked and unrecorded until the owner chooses it', async () => {
  const {api, row, calls} = await harness();
  await api.operate(row, 'prepare');
  assert.equal(row.consent.type, 'checkbox');
  assert.equal(row.consent.checked, false);
  assert.equal(row.consentLabel.textContent, changeApi.CHANGE_CONFIRMATION);
  assert.equal(row.packageText.textContent, JSON.stringify(exactPackage, null, 2));
  assert.equal(row.packageReview.open, true);
  assert.equal(row.approve.disabled, true);
  assert.equal(row.apply.disabled, true);
  assert.equal(calls.filter(x => x.name === 'approve_youtube_owner_change').length, 0);
  assert.equal(calls.filter(x => x.body?.operation === 'apply').length, 0);
  await api.operate(row, 'approve');
  assert.equal(calls.filter(x => x.name === 'approve_youtube_owner_change').length, 0);
});

test('checking exact consent enables recording; application still waits for an actual approval UUID', async () => {
  const {api, row, calls} = await harness();
  await api.operate(row, 'prepare');
  row.consent.checked = true;
  row.consent.listeners.get('change')();
  assert.equal(row.approve.disabled, false);
  assert.equal(row.apply.disabled, true);
  await api.operate(row, 'apply');
  assert.equal(calls.filter(x => x.body?.operation === 'apply').length, 0);
  await api.operate(row, 'approve');
  assert.equal(row.approvalId, approvalId);
  assert.equal(row.apply.disabled, false);
  assert.equal(calls.filter(x => x.body?.operation === 'apply').length, 0);
  const recorded = calls.find(x => x.name === 'approve_youtube_owner_change');
  assert.deepEqual(recorded.args.p_expected_package, exactPackage);
  assert.equal(recorded.args.p_confirmation_text, changeApi.CHANGE_CONFIRMATION);
  await api.operate(row, 'apply');
  assert.deepEqual(calls.find(x => x.body?.operation === 'apply').body, {
    channel_id: changeApi.CHANGE_CHANNEL, operation: 'apply', request_id: requestId, approval_id: approvalId
  });
});

test('a fresh prepared package and session reset clear prior consent', async () => {
  const {api, row} = await harness();
  await api.operate(row, 'prepare');
  row.consent.checked = true;
  await api.operate(row, 'approve');
  await api.operate(row, 'prepare');
  assert.equal(row.consent.checked, false);
  assert.equal(row.approvalId, null);
  assert.equal(row.approve.disabled, true);
  assert.equal(row.apply.disabled, true);
  row.consent.checked = true;
  row.request.package = {...exactPackage, after: {title: 'Different package'}};
  api.showPackage(row);
  assert.equal(row.consent.checked, false);
  api.reset();
  assert.equal(row.consent.checked, false);
  assert.equal(row.approvalId, null);
  assert.equal(api.rows.size, 0);
});

