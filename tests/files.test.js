import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { createFiles, validateFile, MAX_FILE_SIZE } from '../app/files.js';
const pdf = () => new File(['demo'], 'demo.pdf', { type: 'application/pdf' });
test('IndexedDB add, get, list, update, delete and persistence across connections', async () => {
  const factory = new IDBFactory(), files = createFiles(factory);
  assert.deepEqual(await files.list(), []);
  const id = await files.add(pdf());
  assert.equal((await files.get(id)).name, 'demo.pdf');
  assert.equal(await (await createFiles(factory).get(id)).blob.text(), 'demo');
  assert.equal((await files.list()).length, 1);
  await files.update(id, new File(['changed'], 'new.png', { type: 'image/png' }));
  assert.equal(await (await files.get(id)).blob.text(), 'changed');
  await files.remove(id); assert.equal(await files.get(id), null); await files.remove(id);
  await assert.rejects(files.update(id, pdf()), /no longer exists/);
});
test('reject empty, oversized and unsupported attachments', async () => {
  for (const file of [new Blob([]), new Blob(['text'], { type: 'text/html' }), new Blob([new Uint8Array(MAX_FILE_SIZE + 1)], { type: 'image/png' }), {}]) assert.throws(() => validateFile(file));
  assert.doesNotThrow(() => validateFile(pdf()));
});
test('unavailable IndexedDB returns a helpful error', async () => {
  await assert.rejects(createFiles(null).add(pdf()), /unavailable/);
});
