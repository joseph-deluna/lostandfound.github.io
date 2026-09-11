export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export function validateFile(file) {
  if (!(file instanceof Blob) || !file.size) throw new Error('Choose a non-empty image or PDF.');
  if (file.size > MAX_FILE_SIZE) throw new Error('Attachments must be 10 MB or smaller.');
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'].includes(file.type)) throw new Error('Choose a JPEG, PNG, WebP, GIF, or PDF file.');
}
export function createFiles(indexedDB, name = 'uc-lost-found-files') {
  function open() {
    return new Promise((resolve, reject) => {
      let request;
      try {
        const backend = indexedDB === undefined ? globalThis.indexedDB : indexedDB;
        if (!backend) throw new Error();
        request = backend.open(name, 1);
      } catch { return reject(new Error('File storage is unavailable in this browser.')); }
      let abandoned = false;
      request.onupgradeneeded = () => request.result.createObjectStore('files', { keyPath: 'id' });
      request.onerror = () => reject(new Error('Unable to open file storage. Enable site storage and retry.'));
      request.onblocked = () => { abandoned = true; reject(new Error('File storage is blocked. Close other tabs for this site and retry.')); };
      request.onsuccess = () => { if (abandoned) request.result.close(); else resolve(request.result); };
    });
  }
  async function transaction(mode, action) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', mode); let result;
      tx.oncomplete = () => { db.close(); resolve(result); };
      tx.onabort = tx.onerror = () => { db.close(); reject(new Error('Unable to save or read attachment. Browser storage may be full.')); };
      try { const request = action(tx.objectStore('files')); request.onsuccess = () => { result = request.result; }; }
      catch (error) { db.close(); reject(error); }
    });
  }
  const get = async id => (await transaction('readonly', store => store.get(id))) ?? null;
  const list = () => transaction('readonly', store => store.getAll());
  async function add(file) {
    validateFile(file);
    const record = { id: crypto.randomUUID(), name: file.name || 'attachment', blob: file };
    await transaction('readwrite', store => store.add(record)); return record.id;
  }
  async function update(id, file) {
    validateFile(file);
    if (!await get(id)) throw new Error('Attachment no longer exists.');
    await transaction('readwrite', store => store.put({ id, name: file.name || 'attachment', blob: file })); return id;
  }
  const remove = id => transaction('readwrite', store => store.delete(id));
  return { add, get, list, update, remove };
}
