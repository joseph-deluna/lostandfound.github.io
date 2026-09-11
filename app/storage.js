export const KEY = 'uc-lost-found:records';
const kinds = ['items', 'reports', 'profiles'];
const empty = () => ({ version: 1, items: [], reports: [], profiles: [], settings: {} });
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const copy = value => structuredClone(value);
export function validate(kind, input) {
  if (!kinds.includes(kind) || !plain(input)) throw new Error('Invalid record type.');
  const required = kind === 'profiles' ? ['username', 'salt', 'hash'] : kind === 'items'
    ? ['name', 'location', 'description', 'surrenderedBy']
    : ['name', 'location', 'description', 'date', 'firstName', 'lastName', 'contact', 'email'];
  const result = {};
  for (const field of required) {
    if (typeof input[field] !== 'string' || !input[field].trim()) throw new Error(`${field} is required.`);
    result[field] = input[field].trim();
    if (result[field].length > (field === 'description' ? 2000 : 254)) throw new Error(`${field} is too long.`);
  }
  if (kind === 'reports') {
    if (!/^\S+@\S+\.\S+$/.test(result.email)) throw new Error('Enter a valid email address.');
    if (!/^[+\d\s()-]{7,25}$/.test(result.contact)) throw new Error('Enter a valid contact number (7–25 characters).');
    const day = new Date(`${result.date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(result.date) || !Number.isFinite(+day) || day.toISOString().slice(0, 10) !== result.date || result.date > new Date().toLocaleDateString('en-CA')) throw new Error('Enter a valid date that is not in the future.');
  }
  if (kind !== 'profiles') {
    result.status = input.status ?? 'open';
    if (!['open', 'resolved'].includes(result.status)) throw new Error('Invalid status.');
    result.attachmentId = input.attachmentId ?? null;
    if (result.attachmentId !== null && (typeof result.attachmentId !== 'string' || !result.attachmentId)) throw new Error('Invalid attachment.');
  }
  return result;
}
export function createStorage(storage, onWarning = () => {}) {
  const backend = () => storage ?? globalThis.localStorage;
  function write(data) {
    try { backend().setItem(KEY, JSON.stringify(data)); }
    catch { throw new Error('Could not save: browser storage is full or unavailable. Free space or enable site storage, then retry.'); }
  }
  function read() {
    let raw;
    try { raw = backend().getItem(KEY); }
    catch { throw new Error('Browser storage is unavailable. Enable site storage to use this demo.'); }
    if (raw === null) return empty();
    let data;
    try { data = JSON.parse(raw); } catch { /* recovered below */ }
    if (plain(data) && Number.isInteger(data.version) && data.version > 1) throw new Error('This browser contains data from a newer demo version. Update the site before changing records.');
    if (plain(data) && data.version === 0) {
      data = { ...empty(), ...data, version: 1 };
    }
    try {
      if (!plain(data) || data.version !== 1 || !plain(data.settings)) throw new Error();
      if (Object.entries(data.settings).some(([key, value]) => !['profileId'].includes(key) || (value !== null && typeof value !== 'string'))) throw new Error();
      for (const kind of kinds) {
        if (!Array.isArray(data[kind])) throw new Error();
        const ids = new Set();
        for (const record of data[kind]) {
          if (!plain(record) || typeof record.id !== 'string' || !record.id || ids.has(record.id) || !Number.isFinite(Date.parse(record.createdAt)) || !Number.isFinite(Date.parse(record.updatedAt))) throw new Error();
          validate(kind, record);
          ids.add(record.id);
        }
      }
    } catch {
      // Preserve the original bytes before recovering. Never overwrite if backup fails.
      try { backend().setItem(`${KEY}:recovery:${crypto.randomUUID()}`, raw); }
      catch { throw new Error('Stored data needs recovery, but a backup could not be saved. Free browser storage and retry. Your original data is unchanged.'); }
      data = empty();
      write(data);
      onWarning('Damaged browser data was backed up locally and a fresh workspace was opened. Backups remain in localStorage under uc-lost-found:records:recovery.');
    }
    return data;
  }
  const checkKind = kind => { if (!kinds.includes(kind)) throw new Error('Invalid record type.'); };
  function list(kind) { checkKind(kind); return copy(read()[kind]); }
  function get(kind, id) { return list(kind).find(record => record.id === id) ?? null; }
  function add(kind, input) {
    const fields = validate(kind, input), data = read();
    if (kind === 'profiles' && data.profiles.some(p => p.username.toLowerCase() === fields.username.toLowerCase())) throw new Error('That username already exists in this browser.');
    const now = new Date().toISOString();
    const record = { ...fields, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    data[kind].push(record); write(data); return copy(record);
  }
  function update(kind, id, patch) {
    checkKind(kind); const data = read(), index = data[kind].findIndex(r => r.id === id);
    if (index === -1) throw new Error('This record no longer exists. Refresh the list.');
    const old = data[kind][index];
    const fields = validate(kind, { ...old, ...patch });
    if (kind === 'profiles' && data.profiles.some(p => p.id !== id && p.username.toLowerCase() === fields.username.toLowerCase())) throw new Error('That username already exists in this browser.');
    data[kind][index] = { ...fields, id, createdAt: old.createdAt, updatedAt: new Date().toISOString() };
    write(data); return copy(data[kind][index]);
  }
  function remove(kind, id) {
    checkKind(kind); const data = read(), index = data[kind].findIndex(r => r.id === id);
    if (index === -1) throw new Error('This record no longer exists. Refresh the list.');
    data[kind].splice(index, 1);
    if (kind === 'profiles' && data.settings.profileId === id) data.settings.profileId = null;
    write(data);
  }
  function settings(patch) {
    const data = read();
    if (patch !== undefined) {
      if (!plain(patch) || Object.entries(patch).some(([key, value]) => key !== 'profileId' || (value !== null && (typeof value !== 'string' || !data.profiles.some(p => p.id === value))))) throw new Error('Invalid settings.');
      data.settings = { ...data.settings, ...patch }; write(data);
    }
    return copy(data.settings);
  }
  return { list, get, add, update, remove, settings };
}
