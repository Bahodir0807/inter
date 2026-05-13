# cPanel Deploy

Use this flow for a static Vite deployment to cPanel or any host where `public_html` is the web root.

## Build

```bash
npm install
npm run build
```

The build output must contain:

- `dist/index.html`
- `dist/assets/`
- `dist/.htaccess`

## Upload

1. Open cPanel File Manager or FTP.
2. Upload the contents of `dist/` into `public_html`.
3. Confirm `index.html` is directly in `public_html`.
4. Confirm the `assets/` directory is directly in `public_html`.
5. Confirm `.htaccess` is directly in `public_html`.

Do not upload the repository root, `src/`, `node_modules/`, or local env files.

## SPA Routing

Use this `.htaccess` in `public_html`:

```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

This lets direct visits and refreshes on routes such as `/app/dashboard` load the Vite SPA.

## Env

Set production values before building:

```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com
VITE_APP_ENV=production
VITE_APP_VERSION=0.0.0
VITE_BUILD_HASH=cpanel
VITE_SENTRY_DSN=
```

Vite embeds these values at build time. Rebuild and re-upload after changing them.
