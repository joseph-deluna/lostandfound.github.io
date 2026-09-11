import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { createStorage } from '../app/storage.js';
import { createFiles } from '../app/files.js';
import { createRecords, search, matches } from '../app/records.js';
const item = { name: 'Blue umbrella', location: 'Library', description: 'Blue canopy', surrenderedBy: 'Demo' };
function setup() { const map = new Map(), raw = { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }; const store = createStorage(raw), files = createFiles(new IDBFactory()); return { raw, store, files, records: createRecords(store, files) }; }
const file = () => new File(['demo'], 'demo.pdf', { type: 'application/pdf' });
test('record and attachment create, replace, remove, delete', async () => {
  const { records, store, files } = setup();
  const row = await records.save('items', item, { file: file() }); assert.ok(await files.get(row.attachmentId));
  const updated = await records.save('items', { name: 'Updated' }, { id: row.id, file: file() });
  assert.equal(await files.get(row.attachmentId), null); assert.ok(await files.get(updated.attachmentId));
  await records.save('items', {}, { id: row.id, removeAttachment: true });
  assert.equal(store.get('items', row.id).attachmentId, null); assert.equal((await files.list()).length, 0);
  const last = await records.save('items', {}, { id: row.id, file: file() });
  await records.remove('items', row.id); assert.equal(store.get('items', row.id), null); assert.equal(await files.get(last.attachmentId), null);
  await assert.rejects(records.save('items', item, { id: row.id }), /no longer exists/);
});
test('failed record commit rolls back new binary and retains previous attachment', async () => {
  const { raw, records, files, store } = setup(), row = await records.save('items', item, { file: file() });
  raw.setItem = () => { throw new Error('quota'); };
  await assert.rejects(records.save('items', item, { id: row.id, file: file() }), /full/);
  assert.equal((await files.list()).length, 1); assert.equal(store.get('items', row.id).attachmentId, row.attachmentId);
  await assert.rejects(records.remove('items', row.id), /full/); assert.ok(await files.get(row.attachmentId));
});
test('file failure never creates a record; invalid records never create a binary', async () => {
  const { store, files } = setup();
  const records = createRecords(store, { ...files, add: async () => { throw new Error('file quota'); } });
  await assert.rejects(records.save('items', item, { file: file() }), /file quota/); assert.deepEqual(store.list('items'), []);
  await assert.rejects(createRecords(store, files).save('items', {}, { file: file() }), /required/); assert.deepEqual(await files.list(), []);
});
test('cleanup errors warn while retaining the successfully committed record', async () => {
  const { store, files, records } = setup(), warnings = [], row = await records.save('items', item, { file: file() });
  const failing = createRecords(store, { ...files, remove: async () => { throw new Error('blocked'); } }, m => warnings.push(m));
  const updated = await failing.save('items', { name: 'New' }, { id: row.id, removeAttachment: true });
  assert.equal(updated.attachmentId, null); assert.equal(store.get('items', row.id).name, 'New'); assert.equal(warnings.length, 1);
});
test('search and matching derive from current records and statuses', () => {
  const rows = [{ ...item, status: 'open' }, { ...item, name: 'Wallet', status: 'resolved' }];
  assert.equal(search(rows, ' UMBRELLA ').length, 1); assert.equal(search(rows, '', 'resolved').length, 1); assert.equal(search(rows, 'missing').length, 0);
  assert.equal(matches(rows, [{ name: 'Umbrella', status: 'open' }]).length, 1);
  assert.equal(matches(rows, [{ name: 'Umbrella', status: 'resolved' }]).length, 0);
  assert.equal(matches(rows, [{ name: 'Wallet', status: 'open' }]).length, 0);
});
