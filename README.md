# Inter CRM Frontend

React + TypeScript + Vite frontend for the Inter CRM application.

## Local Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Set `VITE_API_BASE_URL` in `.env.local` to the backend URL used for local development.

## Env Setup

Only safe templates are tracked:

- `.env.example`
- `.env.local.example`
- `.env.production.example`
- `.env.qa.example`
- `.env.smoke.example`

Real env files such as `.env`, `.env.local`, `.env.production`, `.env.qa`, `.env.staging`, and `.env.*.local` are ignored. Do not commit filled env files or secrets.

Frontend build variables:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_ENV=local
VITE_APP_VERSION=0.0.0
VITE_BUILD_HASH=local
VITE_SENTRY_DSN=
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm test
npm run lint
npm run typecheck
npm run smoke:static
npm run smoke:live
npm run hygiene:check
```

`npm test` currently runs `npm run smoke:static`. `npm run lint` is a TypeScript-only check because this project does not have ESLint configured. `npm run smoke:live` requires smoke credentials from `.env.smoke.example` or equivalent shell environment variables.

QA helpers:

```bash
npm run qa:up
npm run qa:seed
npm run qa:local:backend
npm run qa:local:seed
npm run qa:local:smoke
```

## Build

```bash
npm run build
```

The production artifact is `dist/index.html` plus `dist/assets/`. `dist/` is generated output and is ignored by Git.

## cPanel Deploy

1. Run `npm install`.
2. Set production env values, especially `VITE_API_BASE_URL`.
3. Run `npm run build`.
4. Upload the contents of `dist/` into `public_html`.
5. Confirm `index.html` is directly inside `public_html`, not nested under `dist`.
6. Include the generated `.htaccess` in `public_html` for SPA routing.

See [docs/deploy/CPANEL_DEPLOY.md](docs/deploy/CPANEL_DEPLOY.md).

## QA And Smoke

```bash
npm run build
npm test
npm run lint
npm run typecheck
npm run smoke:static
```

For live smoke, copy `.env.smoke.example` to `.env.smoke` locally or set the same `SMOKE_*` variables in your shell. Keep `SMOKE_ALLOW_MUTATION=false` for production.

## Documentation

- Deploy docs: [docs/deploy/](docs/deploy/)
- Browser QA: [docs/qa/CHECKLIST_BROWSER_QA.md](docs/qa/CHECKLIST_BROWSER_QA.md)
- QA notes: [docs/qa/QA_README.md](docs/qa/QA_README.md)
- Audits and applied fixes: [docs/audits/](docs/audits/)
