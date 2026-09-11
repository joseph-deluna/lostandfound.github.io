import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStorage, KEY, validate } from '../app/storage.js';
export const item = { name: 'Blue umbrella', location: 'Library', description: 'Small blue umbrella', surrenderedBy: 'Demo visitor' };
export const report = { name: 'Umbrella', location: 'Library', description: 'Blue', date: '2025-01-01', firstName: 'Demo', lastName: 'Visitor', contact: '09000000000', email: 'demo@example.test' };
export function memory() { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), values }; }
for (const [kind, fixture] of [['items', item], ['reports', report], ['profiles', { username: 'Demo', salt: 'salt', hash: 'hash' }]]) {
  test(`${kind}: add, read, list, update, delete and reload`, () => {
    const raw = memory(), store = createStorage(raw);
    assert.deepEqual(store.list(kind), []);
    const row = store.add(kind, fixture);
    assert.ok(row.id); assert.ok(row.createdAt);
    assert.deepEqual(createStorage(raw).get(kind, row.id), row);
    const updated = store.update(kind, row.id, kind === 'profiles' ? { username: 'Other' } : { name: 'Changed', status: 'resolved' });
    assert.equal(updated.id, row.id); assert.equal(updated.createdAt, row.createdAt);
    assert.equal(createStorage(raw).list(kind)[0].updatedAt, updated.updatedAt);
    const snapshot = store.list(kind); snapshot[0].id = 'tampered'; assert.equal(store.get(kind, row.id).id, row.id);
    store.remove(kind, row.id); assert.deepEqual(createStorage(raw).list(kind), []); assert.equal(store.get(kind, row.id), null);
    assert.throws(() => store.update(kind, row.id, fixture), /no longer exists/);
    assert.throws(() => store.remove(kind, row.id), /no longer exists/);
  });
  test(`${kind}: required fields and length validation`, () => {
    for (const field of Object.keys(fixture)) assert.throws(() => validate(kind, { ...fixture, [field]: '' }), /required/);
    assert.throws(() => validate(kind, { ...fixture, [Object.keys(fixture)[0]]: 'a'.repeat(255) }), /too long/);
  });
}
test('validation of invalid kinds, dates, statuses, contacts, attachment IDs and email', () => {
  const store = createStorage(memory());
  for (const method of ['get', 'list', 'update', 'remove']) assert.throws(() => store[method]('wrong', 'id'), /type/);
  assert.throws(() => store.add('wrong', item), /type/);
  for (const patch of [{ date: '2025-02-30' }, { date: '2999-01-01' }, { date: 'yesterday' }, { email: 'invalid' }, { contact: 'abc' }, { status: 'bad' }, { attachmentId: {} }]) assert.throws(() => validate('reports', { ...report, ...patch }));
});
test('settings persist, reject invalid values, and clear when profile removed', () => {
  const raw = memory(), store = createStorage(raw), profile = store.add('profiles', { username: 'Demo', salt: 'a', hash: 'b' });
  store.settings({ profileId: profile.id }); assert.equal(createStorage(raw).settings().profileId, profile.id);
  assert.throws(() => store.settings({ profileId: 'missing' }), /settings/);
  assert.throws(() => store.settings({ unexpected: true }), /settings/);
  store.remove('profiles', profile.id); assert.equal(store.settings().profileId, null);
});
test('duplicate profiles rejected on create and update', () => {
  const store = createStorage(memory());
  store.add('profiles', { username: 'Demo', salt: 'a', hash: 'b' });
  assert.throws(() => store.add('profiles', { username: 'demo', salt: 'c', hash: 'd' }), /already exists/);
  const other = store.add('profiles', { username: 'other', salt: 'c', hash: 'd' });
  assert.throws(() => store.update('profiles', other.id, { username: 'DEMO' }), /already exists/);
});
test('corrupted data backed up without discarding original bytes', () => {
  for (const value of ['{broken', 'null', '{"version":1,"items":{}}', '{"version":-1}']) {
    const raw = memory(), warnings = []; raw.setItem(KEY, value);
    assert.deepEqual(createStorage(raw, m => warnings.push(m)).list('items'), []);
    assert.equal(warnings.length, 1);
    assert.ok([...raw.values].some(([key, saved]) => key.startsWith(KEY + ':recovery:') && saved === value));
  }
});
test('future schemas are left unchanged and writes refused', () => {
  const raw = memory(); raw.setItem(KEY, '{"version":2}'); const store = createStorage(raw);
  assert.throws(() => store.add('items', item), /newer/); assert.equal(raw.getItem(KEY), '{"version":2}');
});
test('version zero migrates with records preserved', () => {
  const raw = memory(), store = createStorage(raw), row = store.add('items', item), data = JSON.parse(raw.getItem(KEY));
  data.version = 0; delete data.settings; raw.setItem(KEY, JSON.stringify(data));
  assert.equal(store.get('items', row.id).name, item.name);
  store.update('items', row.id, { name: 'Migrated' }); assert.equal(JSON.parse(raw.getItem(KEY)).version, 1);
});
test('quota failures and unavailable storage are actionable and do not lose records', () => {
  const raw = memory(), store = createStorage(raw), row = store.add('items', item), before = raw.getItem(KEY);
  raw.setItem = () => { throw new Error('quota'); };
  assert.throws(() => store.remove('items', row.id), /full or unavailable/); assert.equal(raw.getItem(KEY), before);
  raw.getItem = () => '{bad'; assert.throws(() => store.list('items'), /backup could not/);
  raw.getItem = () => { throw new Error('denied'); }; assert.throws(() => store.list('items'), /unavailable/);
});
