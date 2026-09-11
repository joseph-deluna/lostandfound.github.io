import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
// Explicit allowlist: no PHP, SQL, credentials, dependencies, or uploads are published.
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const path of ['index.html', 'app', 'css/theme.css', 'images/icon/uc.jpg', 'images/icon/uclogin.jpg', 'images/icon/user.jpg', 'images/icon/logo-mini.png', 'vendor/bootstrap-4.1/bootstrap.min.css', 'vendor/font-awesome-5/css', 'vendor/font-awesome-5/webfonts']) {
  await cp(path, `dist/${path}`, { recursive: true });
}
await writeFile('dist/.nojekyll', '');
await writeFile('dist/404.html', '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page not found</title><h1>Page not found</h1><p><a href="/lostandfound.github.io/#/dashboard">Return to UC Lost and Found</a></p>');
console.log('Static production build created in dist/. Uses relative assets and hash routing.');
