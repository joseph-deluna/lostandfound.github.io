import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStorage } from '../app/storage.js';
import { createAuth } from '../app/auth.js';
test('register, sign in, reload current profile and sign out without storing passwords', async () => {
  const map = new Map(), raw = { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }, store = createStorage(raw), auth = createAuth(store);
  const profile = await auth.register('Demo', 'demo-password', 'demo-password'); assert.equal(auth.current(), null);
  assert.ok(profile.hash); assert.ok(!JSON.stringify([...map]).includes('demo-password'));
  await auth.login('DEMO', 'demo-password'); assert.equal(createAuth(createStorage(raw)).current().id, profile.id);
  await assert.rejects(auth.login('demo', 'incorrect'), /incorrect/);
  await assert.rejects(auth.login('missing', 'demo-password'), /incorrect/);
  auth.logout(); assert.equal(auth.current(), null); assert.equal(store.list('profiles').length, 1);
  await assert.rejects(auth.register('Demo', 'demo-password', 'demo-password'), /already exists/);
  await assert.rejects(auth.register('Other', 'short', 'short'), /between/);
  await assert.rejects(auth.register('Other', 'demo-password', 'wrong'), /match/);
  await assert.rejects(auth.register('', 'demo-password', 'demo-password'), /username/);
});
