import { validate } from './storage.js';
export function createRecords(storage, files, warning = () => {}) {
  // New binaries are written first; the record commit is the source of truth.
  // Cleanup failures leave an unreferenced binary, never a missing live attachment.
  async function cleanup(id) {
    if (!id) return;
    try { await files.remove(id); }
    catch { warning('The record was saved, but an unused attachment could not be removed from this browser.'); }
  }
  async function save(kind, input, { id, file, removeAttachment = false } = {}) {
    const previous = id ? storage.get(kind, id) : null;
    if (id && !previous) throw new Error('This record no longer exists. Refresh the list.');
    const fields = validate(kind, { ...previous, ...input });
    let newFile;
    if (file) newFile = await files.add(file);
    fields.attachmentId = newFile || (removeAttachment ? null : previous?.attachmentId ?? null);
    let result;
    try { result = id ? storage.update(kind, id, fields) : storage.add(kind, fields); }
    catch (error) { await cleanup(newFile); throw error; }
    if (previous?.attachmentId !== result.attachmentId) await cleanup(previous?.attachmentId);
    return result;
  }
  async function remove(kind, id) {
    const record = storage.get(kind, id);
    storage.remove(kind, id);
    await cleanup(record?.attachmentId);
  }
  return { save, remove };
}
export function search(records, query = '', status = 'all') {
  const text = query.trim().toLowerCase();
  return records.filter(record => (status === 'all' || record.status === status) && ['name', 'location', 'description', 'surrenderedBy', 'firstName', 'lastName', 'email', 'contact'].some(field => (record[field] || '').toLowerCase().includes(text)));
}
export function matches(items, reports) {
  const words = value => value.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return reports.filter(r => r.status === 'open').flatMap(report => items.filter(item => item.status === 'open' && words(report.name).some(word => words(item.name).includes(word))).map(item => ({ report, item })));
}
