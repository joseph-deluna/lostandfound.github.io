# UC Online Lost and Found

A static portfolio demo of the original UC lost-and-found application. The existing CoolAdmin theme, UC images, sidebar, header, pastel dashboard cards, tables, and two-column report form are retained. Small CSS overrides repair overlap and mobile usability.

**Live demo:** https://joseph-deluna.github.io/lostandfound.github.io/

No server, database service, paid service, runtime CDN, or real office submission. Records are private to the current browser origin, not synchronized between devices. Use fictional details and demo-only passwords. Local profiles share the workspace and are a UX demonstration, not an authorization boundary. Browser data can be inspected by anyone with access to that browser. Clearing site data removes records, profiles, and attachments.

## Original inspection

The repository had HTML/PHP forms, bundled Bootstrap and icon assets, CoolAdmin CSS, UC branding, and SQL table definitions. These assets provided the design foundation; end-to-end functionality was not available as a static site.

- `index.html` contained PHP session and database logic. GitHub Pages cannot execute PHP.
- Form actions and redirects targeted a missing `index.php`.
- Several referenced vendor scripts/fonts were absent; admin UC image paths were incorrect.
- Item creation wrote `active = 1`, while the inventory read `active = 0`.
- Report fields disagreed with the SQL schema; date handling was incomplete.
- Edit/delete handlers were missing; the inventory delete handler used an undefined database connection.
- Dashboard counts were hardcoded and navigation included unused template links.
- A database connection file contained a hardcoded credential. The obsolete backend and SQL files were removed from the current tree. Historical commits were not rewritten.

## Working demo flows

- Add, list, search, edit, resolve/reopen, and delete found items and lost reports.
- Attach or replace JPEG, PNG, WebP, GIF, or PDF files (up to 10 MB); preview images and download attachments.
- Confirm deletion with a keyboard-accessible dialog.
- Dashboard totals and suggested matches derive from current records. Matching uses a shared item-name word and only open records; it never claims ownership automatically.
- Register a local profile, sign in, sign out, and remain signed in after refreshing. Passwords are stored as salted PBKDF2 hashes, never plaintext. Visitors can explore all flows without registering.
- Show empty/search states, validation errors, saving/loading states, and storage errors. Render user content as text, not executable HTML.
- Relative asset paths and hash routes work under `/lostandfound.github.io/`, including refresh and direct links such as `/#/inventory`.

## Storage design

- `app/storage.js`: reusable `add`, `get`, `list`, `update`, `remove`, and `settings` functions. One `localStorage` key, `uc-lost-found:records`, holds a versioned envelope with `items`, `reports`, `profiles`, and `settings`. IDs and timestamps are generated internally; edits preserve identity and creation date. Every mutation re-reads current storage and commits with one `setItem`.
- `app/files.js`: IndexedDB database `uc-lost-found-files`, version 1, with a `files` object store. Reusable binary `add`, `get`, `list`, `update`, and `remove` functions wait for transaction completion.
- `app/records.js`: coordinates structured records and attachments. Writes a new binary before committing its ID to a record, rolls it back if the record commit fails, and removes old binaries after commit. Cleanup failure warns and may leave an unused binary; it never deletes a live attachment before a successful commit.
- `app/auth.js`: local profile registration, login, logout, and current-profile lookup. Sign-in state is a local setting.

Malformed data is backed up under a unique `uc-lost-found:records:recovery:*` key before opening an empty workspace. If backup cannot be written, the original data remains untouched and recovery stops with an actionable message. Version 0 (the same record format, optionally missing collections/settings) migrates to version 1 on the next save. Unknown or invalid older formats are backed up; newer versions are refused without modification. Recovery backups remain accessible through browser developer tools. This is not a cloud backup.

Other tabs refresh lists when the storage event fires; unsaved forms are preserved with a notification. Simultaneous edits to the same record use the last successful save. Browser storage quotas and eviction policies still apply.

## Develop and verify

Requires Node.js 22 or later.

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

Open `http://127.0.0.1:4173/lostandfound.github.io/`. The preview process is a development-only static file server; it is not deployed or required by the application.

Unit tests cover all storage/CRUD operations, profile functions, validation, persistence, migration, corruption recovery, duplicate users, quota failures, attachment rollback/cleanup, search, and matching. Playwright tests exercise desktop/mobile report and inventory CRUD, attachment persistence, validation, local sign-in, routing, navigation, and damaged/future storage.

## Deployment

`.github/workflows/pages.yml` tests and builds pushes to `master`. It publishes only `dist` through GitHub Actions. Pull requests run verification without deploying. In repository Settings → Pages, select **GitHub Actions** as the source.

`npm run build` copies an explicit allowlist of HTML, JS, CSS, image, and font assets. No backend source, credentials, SQL, dependencies, test data, or uploads enter the Pages artifact. Generated dependencies, build output, screenshots/test results, environment files, and uploads are ignored by Git.
