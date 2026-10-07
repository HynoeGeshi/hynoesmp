const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveHostRoute } = require('../../.tmp/logic/lib/host-routing.js');
test('Outpost vanity host rewrites only its root', () => { assert.deepEqual(resolveHostRoute('outpost.hynoe.net','/'), {action:'rewrite',pathname:'/p/hynoe-outpost'}); });
test('Hynoe Search hosts continue normally', () => { assert.deepEqual(resolveHostRoute('hynoe.net','/'), {action:'next'}); });
test('Render production and direct-source hosts continue normally', () => { assert.deepEqual(resolveHostRoute('hynoe-search.onrender.com','/'), {action:'next'}); assert.deepEqual(resolveHostRoute('hynoe-search-direct.onrender.com','/search'), {action:'next'}); });
test('SMP and Flicks independent domains are never proxied', () => { assert.deepEqual(resolveHostRoute('hynoesmp.com','/'), {action:'reject'}); assert.deepEqual(resolveHostRoute('hynoeflicks.com','/'), {action:'reject'}); });
test('unknown hosts are rejected', () => { assert.deepEqual(resolveHostRoute('evil.example','/'), {action:'reject'}); });
