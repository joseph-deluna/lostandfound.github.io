const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
async function digest(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256)));
}
export function createAuth(storage) {
  async function register(username, password, confirmation) {
    if (!username.trim()) throw new Error('Enter a username.');
    if (password.length < 8 || password.length > 128) throw new Error('Use a password between 8 and 128 characters.');
    if (password !== confirmation) throw new Error('Passwords do not match.');
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const profile = storage.add('profiles', { username, salt, hash: await digest(password, salt) });
    return profile;
  }
  async function login(username, password) {
    const profile = storage.list('profiles').find(p => p.username.toLowerCase() === username.trim().toLowerCase());
    if (!profile || profile.hash !== await digest(password, profile.salt)) throw new Error('Username or password is incorrect. Create a profile if this is your first visit on this browser.');
    storage.settings({ profileId: profile.id }); return profile;
  }
  const logout = () => storage.settings({ profileId: null });
  const current = () => storage.get('profiles', storage.settings().profileId);
  return { register, login, logout, current };
}
