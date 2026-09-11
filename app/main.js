import { createStorage, KEY } from './storage.js';
import { createFiles } from './files.js';
import { createRecords, search, matches } from './records.js';
import { createAuth } from './auth.js';
const app = document.querySelector('#app');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
function notify(message) {
  const notice = document.querySelector('#notice');
  notice.innerHTML = '<button class="btn btn-sm btn-light" aria-label="Dismiss notification">×</button><span></span>';
  notice.querySelector('span').textContent = message;
  notice.querySelector('button').onclick = () => { notice.replaceChildren(); };
}
const store = createStorage(undefined, notify), files = createFiles(), records = createRecords(store, files, notify), auth = createAuth(store);
const note = '<div class="demo-note">Portfolio demo · Records and attachments stay in this browser. Nothing is sent to the UC office. Use fictional details. All local profiles share this demo workspace.</div>';
let objectURLs = [], renderID = 0;
function route() { return location.hash.slice(1) || '/dashboard'; }
function go(path) { if (route() === path) render(); else location.hash = path; }
const nav = [['dashboard', 'tachometer-alt', 'Dashboard'], ['report', 'edit', 'Report Lost Item'], ['reports', 'chart-bar', 'Reports'], ['inventory', 'table', 'Inventory'], ['matches', 'check-square', 'Matches']];
function layout(content) {
  const user = auth.current();
  app.innerHTML = `<div class="page-wrapper"><aside class="menu-sidebar" id="navigation"><div class="logo"><a href="#/dashboard"><img src="images/icon/uc.jpg" alt="University of the Cordilleras"></a></div><div class="menu-sidebar__content"><nav class="navbar-sidebar" aria-label="Main navigation"><ul class="list-unstyled navbar__list">${nav.map(([path, icon, name]) => `<li class="${route() === '/' + path ? 'active' : ''}"><a href="#/${path}" ${route() === '/' + path ? 'aria-current="page"' : ''}><i class="fas fa-${icon}" aria-hidden="true"></i>${name}</a></li>`).join('')}</ul></nav></div></aside><div class="page-container"><header class="header-desktop"><div class="section__content section__content--p30"><div class="header-wrap"><button id="menu" class="mobile-menu btn btn-light" aria-label="Toggle navigation" aria-controls="navigation" aria-expanded="false">☰</button><h2>Welcome to UC Online Lost and Found!</h2><div class="header-button"><img src="images/icon/user.jpg" alt=""><span>${esc(user?.username || 'Demo visitor')}</span>${user ? '<button id="logout" class="btn btn-sm btn-outline-secondary">Sign out</button>' : '<a class="btn btn-sm btn-outline-secondary" href="#/login">Sign in</a>'}</div></div></div></header><main id="main" tabindex="-1" class="main-content"><div class="section__content section__content--p30"><div class="container-fluid">${note}${content}</div></div></main></div></div>`;
  document.querySelector('#menu').onclick = event => { const open = document.querySelector('#navigation').classList.toggle('open'); event.currentTarget.setAttribute('aria-expanded', String(open)); };
  document.querySelector('#logout')?.addEventListener('click', () => { try { auth.logout(); render(); notify('Signed out. Your records remain in this browser.'); } catch (error) { notify(error.message); } });
}
function empty(title, text, path, label) { return `<div class="empty"><h2>${title}</h2><p>${text}</p>${path ? `<a class="btn btn-primary" href="#/${path}">${label}</a>` : ''}</div>`; }
function dashboard() {
  const items = store.list('items'), reports = store.list('reports'), pairs = matches(items, reports);
  layout(`<h1>Dashboard</h1><div class="info-box-container">${[[reports.length, 'Reported Lost', 'reports'], [items.length, 'Inventory', 'inventory'], [pairs.length, 'Suggested Matches', 'matches']].map(([count, title, path]) => `<div class="info-box"><div class="inner"><h3>${count}</h3><p>${title}</p></div><a href="#/${path}">Show all items →</a></div>`).join('')}</div><div class="mt-4">${!items.length && !reports.length ? empty('Your workspace is ready', 'Report a lost item or add a found item to start exploring the demo.', 'report', 'Report lost item') : '<p>Counts include open and resolved records. Suggested matches compare item names for open records; verify details before marking anything resolved.</p>'}</div>`);
}
const field = (name, label, value = '', type = 'text', extra = '') => `<div class="form-group"><label for="${name}">${label}</label><input id="${name}" class="form-control" name="${name}" type="${type}" value="${esc(value)}" required maxlength="254" ${extra}></div>`;
function editor(kind, id) {
  const record = id ? store.get(kind, id) : {};
  if (!record) { layout(empty('Record not found', 'It may have been deleted in another tab.', kind === 'items' ? 'inventory' : 'reports', 'Return to list')); return; }
  const report = kind === 'reports';
  const title = id ? `Edit ${report ? 'report' : 'item'}` : report ? 'Report Lost Item' : 'Add Item';
  layout(`<h1>${title}</h1><div class="container-card"><div class="card-header"><strong>${report ? 'Lost something? Fill in the details to save your report in this demo.' : 'Record an item surrendered to the office'}</strong></div><form id="record-form" class="card-body card-block"><div class="row form-grid"><div class="col-6">${field('name', 'Item Name', record.name)}${field('location', report ? 'Location Lost' : 'Location Found', record.location)}${report ? `${field('date', 'Date Lost', record.date, 'date', `max="${new Date().toLocaleDateString('en-CA')}"`)}${field('firstName', 'First Name', record.firstName)}${field('lastName', 'Last Name', record.lastName)}${field('contact', 'Contact Number', record.contact, 'tel')}${field('email', 'Email', record.email, 'email')}` : field('surrenderedBy', 'Surrendered By', record.surrenderedBy)}</div><div class="col-6"><div class="form-group"><label for="description">Description</label><textarea class="form-control" id="description" name="description" rows="9" required maxlength="2000">${esc(record.description)}</textarea></div><div class="form-group"><label for="status">Status</label><select class="form-control" id="status" name="status"><option value="open">Open</option><option value="resolved" ${record.status === 'resolved' ? 'selected' : ''}>Resolved</option></select></div><div class="form-group"><label for="attachment">Image or PDF (optional)</label><input class="form-control-file" id="attachment" type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"><small>Maximum 10 MB. Stored only in this browser.</small>${record.attachmentId ? `<div data-file="${esc(record.attachmentId)}">Loading attachment…</div><label class="mt-2"><input type="checkbox" name="removeAttachment"> Remove current attachment</label>` : ''}</div></div></div><p id="form-error" class="error" role="alert"></p><div class="actions"><button class="btn btn-${report ? 'primary' : 'success'}" type="submit">${id ? 'Save changes' : 'Submit'}</button><button class="btn btn-warning" type="reset">Reset</button><a class="btn btn-light" href="#/${report ? 'reports' : 'inventory'}">Cancel</a></div></form></div>`);
  const form = document.querySelector('#record-form');
  form.onsubmit = async event => {
    event.preventDefault(); const button = form.querySelector('[type=submit]'); button.disabled = true; button.textContent = 'Saving…';
    try {
      const data = Object.fromEntries(new FormData(form)), file = form.querySelector('#attachment').files[0];
      await records.save(kind, data, { id, file, removeAttachment: data.removeAttachment === 'on' });
      go(report ? '/reports' : '/inventory'); notify(id ? 'Changes saved.' : 'Record saved in this browser.');
    } catch (error) { form.querySelector('#form-error').textContent = error.message; button.disabled = false; button.textContent = id ? 'Save changes' : 'Submit'; }
  };
  form.onreset = () => { form.querySelector('#form-error').textContent = ''; };
}
async function attachments(epoch) {
  for (const element of document.querySelectorAll('[data-file]')) {
    try {
      const file = await files.get(element.dataset.file);
      if (epoch !== renderID || !element.isConnected) return;
      if (!file) { element.textContent = 'Attachment unavailable. Edit the record to replace it.'; continue; }
      const url = URL.createObjectURL(file.blob); objectURLs.push(url);
      element.replaceChildren();
      if (file.blob.type.startsWith('image/')) { const img = document.createElement('img'); img.src = url; img.alt = file.name; img.className = 'attachment'; element.append(img); }
      if (element.dataset.imageOnly === 'true' && file.blob.type.startsWith('image/')) continue;
      const link = document.createElement('a'); link.href = url; link.download = file.name; link.textContent = `Download ${file.name}`; element.append(link);
    } catch (error) { if (element.isConnected) element.textContent = error.message; }
  }
}
function listing(kind) {
  const report = kind === 'reports';
  layout(`<div class="toolbar"><h1 class="mb-0">${report ? 'Reports' : 'Inventory'}</h1><a class="btn btn-success" href="#/${report ? 'report' : 'add-item'}">${report ? 'Add Report' : 'Add Item'}</a></div><div class="toolbar"><input id="search" class="au-input" type="search" aria-label="Search records" placeholder="Search items, locations, or people…"><select id="filter" class="form-control" aria-label="Filter by status"><option value="all">All statuses</option><option value="open">Open</option><option value="resolved">Resolved</option></select></div><div id="results" aria-live="polite"></div>`);
  function refresh() {
    const all = store.list(kind), rows = search(all, document.querySelector('#search').value, document.querySelector('#filter').value);
    const results = document.querySelector('#results');
    if (!rows.length) { results.innerHTML = empty(all.length ? 'No matching records' : `No ${report ? 'reports' : 'inventory items'} yet`, all.length ? 'Try a different search or status filter.' : 'Add your first record to get started.', all.length ? '' : report ? 'report' : 'add-item', report ? 'Add Report' : 'Add Item'); return; }
    results.innerHTML = `<p class="mb-2">${rows.length} record${rows.length === 1 ? '' : 's'}</p><div class="table-responsive table--no-card m-b-30"><table class="table table-borderless table-striped table-earning"><thead><tr><th>${report ? 'Date lost' : 'Date added'}</th><th>Item</th><th>Location</th><th>Description</th><th>${report ? 'Reported by' : 'Surrendered by'}</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(row => `<tr><td>${esc(report ? row.date : row.createdAt.slice(0,10))}</td><td>${esc(row.name)}</td><td>${esc(row.location)}</td><td>${esc(row.description)}${row.attachmentId ? `<div data-file="${esc(row.attachmentId)}" data-image-only="${report}">Loading attachment…</div>` : ''}</td><td>${report ? `${esc(row.firstName)} ${esc(row.lastName)}<small>${esc(row.contact)}</small><small>${esc(row.email)}</small>` : esc(row.surrenderedBy)}</td><td>${row.status === 'open' ? 'Open' : 'Resolved'}</td><td class="actions-cell"><a class="btn btn-sm btn-outline-primary" href="#/edit/${kind}/${encodeURIComponent(row.id)}">Edit</a><button class="btn btn-sm btn-outline-secondary" data-status="${esc(row.id)}">${row.status === 'open' ? 'Resolve' : 'Reopen'}</button><button class="btn btn-sm btn-outline-danger" data-delete="${esc(row.id)}">Delete</button></td></tr>`).join('')}</tbody></table></div>`;
    results.querySelectorAll('[data-status]').forEach(button => { button.onclick = () => { try { const row = store.get(kind, button.dataset.status); store.update(kind, row.id, { status: row.status === 'open' ? 'resolved' : 'open' }); refresh(); notify('Status updated.'); } catch (error) { notify(error.message); } }; });
    results.querySelectorAll('[data-delete]').forEach(button => { button.onclick = async () => {
      try { const row = store.get(kind, button.dataset.delete); if (!row) throw new Error('Record already deleted.'); if (!await confirmDelete(row.name)) return; button.disabled = true; await records.remove(kind, row.id); refresh(); notify('Record deleted.'); } catch (error) { notify(error.message); button.disabled = false; }
    }; });
    objectURLs.forEach(URL.revokeObjectURL); objectURLs = []; attachments(++renderID);
  }
  document.querySelector('#search').oninput = () => { try { refresh(); } catch (error) { notify(error.message); } };
  document.querySelector('#filter').onchange = document.querySelector('#search').oninput;
  refresh();
}
function confirmDelete(name) {
  const dialog = document.querySelector('#confirmation');
  document.querySelector('#confirm-text').textContent = `“${name}” and its attachment will be removed from this browser. This cannot be undone.`;
  dialog.returnValue = ''; dialog.showModal();
  return new Promise(resolve => dialog.addEventListener('close', () => resolve(dialog.returnValue === 'delete'), { once: true }));
}
function showMatches() {
  const pairs = matches(store.list('items'), store.list('reports'));
  layout(`<h1>Matches</h1><p class="mb-4">Suggestions share a word in the item name. Compare descriptions and locations before resolving each record.</p>${pairs.length ? pairs.map(({item, report}) => `<div class="match-card"><div class="row"><div class="col-md-6"><h2>Lost: ${esc(report.name)}</h2><p>${esc(report.location)} · ${esc(report.date)}</p><p>${esc(report.description)}</p><a href="#/edit/reports/${report.id}">Review report</a></div><div class="col-md-6"><h2>Found: ${esc(item.name)}</h2><p>${esc(item.location)}</p><p>${esc(item.description)}</p><a href="#/edit/items/${item.id}">Review inventory item</a></div></div></div>`).join('') : empty('No suggested matches yet', 'Add an open lost report and a found item with a word in common in their names.', 'inventory', 'View inventory')}`);
}
function signIn(register = false) {
  app.innerHTML = `<div class="page-wrapper"><div class="page-content--bge5"><main id="main" class="container"><div class="login-wrap"><div class="login-content"><div class="login-logo"><a href="#/dashboard"><img src="images/icon/uclogin.jpg" alt="University of the Cordilleras"></a></div><h1>${register ? 'Create local profile' : 'Sign in'}</h1><div class="login-form"><form id="auth-form">${field('username', 'ID Number / Username', '', 'text', 'autocomplete="username"')}${field('password', 'Password', '', 'password', `minlength="8" autocomplete="${register ? 'new-password' : 'current-password'}"`)}${register ? field('confirmation', 'Confirm Password', '', 'password', 'minlength="8" autocomplete="new-password"') : ''}<p class="error" id="auth-error" role="alert"></p><button class="au-btn au-btn--block au-btn--green m-b-20" type="submit">${register ? 'Register' : 'Sign in'}</button></form><div class="register-link"><p>${register ? 'Already have a profile? <a href="#/login">Sign In</a>' : 'Don’t have a profile? <a href="#/register">Sign Up Here</a>'}</p><p><a href="#/dashboard">Continue as demo visitor</a></p></div>${note}<p class="small">Local profiles demonstrate sign-in only; they do not secure or isolate data. Use a demo-only password. Clearing browser data removes profiles, records, and files.</p></div></div></div></main></div></div>`;
  document.querySelector('#auth-form').onsubmit = async event => {
    event.preventDefault(); const form = event.currentTarget, data = Object.fromEntries(new FormData(form)), button = form.querySelector('button'); button.disabled = true; button.textContent = 'Please wait…';
    try {
      if (register) { await auth.register(data.username, data.password, data.confirmation); go('/login'); notify('Local profile created. Sign in with your demo password.'); }
      else { await auth.login(data.username, data.password); go('/dashboard'); notify('Signed in to your local demo profile.'); }
    } catch (error) { form.querySelector('#auth-error').textContent = error.message; button.disabled = false; button.textContent = register ? 'Register' : 'Sign in'; }
  };
}
function render() {
  renderID++; objectURLs.forEach(URL.revokeObjectURL); objectURLs = [];
  try {
    const path = route();
    document.title = `${path.split('/')[1] || 'Dashboard'} · UC Lost and Found`;
    if (path === '/dashboard') dashboard();
    else if (path === '/report') editor('reports');
    else if (path === '/add-item') editor('items');
    else if (path === '/reports') listing('reports');
    else if (path === '/inventory') listing('items');
    else if (path === '/matches') showMatches();
    else if (path === '/login' || path === '/register') signIn(path === '/register');
    else if (/^\/edit\/(items|reports)\/[^/]+$/.test(path)) { const [, , kind, id] = path.split('/'); editor(kind, decodeURIComponent(id)); }
    else layout(empty('Page not found', 'Choose a page from the navigation.', 'dashboard', 'Go to dashboard'));
    if (!['/reports', '/inventory'].includes(path)) attachments(renderID);
  } catch (error) { app.innerHTML = `<main class="p-4"><h1>Workspace unavailable</h1><p>${esc(error.message)}</p><button class="btn btn-primary mt-3" id="retry">Retry</button></main>`; document.querySelector('#retry').onclick = render; }
}
window.addEventListener('hashchange', () => { render(); document.querySelector('#main')?.focus({ preventScroll: true }); });
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  const main = document.querySelector('#main');
  main?.setAttribute('tabindex', '-1'); main?.focus(); main?.scrollIntoView();
});
window.addEventListener('storage', event => { if (event.key === KEY || event.key === null) { if (document.querySelector('#record-form, #auth-form')) notify('Workspace changed in another tab. Your unsaved form has been kept.'); else render(); } });
render();
