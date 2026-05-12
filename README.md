# Inter CRM Frontend

React + TypeScript + Vite frontend for the Inter CRM application.

## Quick Start

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Set `VITE_API_URL` in `.env.local` to the backend API URL used for local development.

## Environment

Only safe templates should be committed:

- `.env.example`
- `.env.local.example`
- `.env.production.example`
- `.env.qa.example`
- `.env.smoke.example`

Real environment files such as `.env`, `.env.local`, `.env.production`, `.env.qa`, and `.env.staging` are ignored by Git. Store production values in the hosting provider environment settings, not in the repository.

Frontend build variables:

```env
VITE_API_URL=https://api.example.com
VITE_APP_ENV=production
VITE_APP_VERSION=0.0.0
VITE_BUILD_HASH=render
VITE_SENTRY_DSN=
```

## Commands

```bash
npm run dev
npm run build
npm run preview
npm test
npm run smoke:static
npm run smoke:live
npm run hygiene:check
```

`npm test` currently runs the static smoke checks. `npm run smoke:live` requires smoke credentials from `.env.smoke.example` or equivalent shell environment variables.

QA helpers:

```bash
npm run qa:up
npm run qa:seed
npm run qa:local:backend
npm run qa:local:seed
npm run qa:local:smoke
```

The demo/seed command is `npm run qa:seed` for the Docker QA profile, or `npm run qa:local:seed` for the local backend helper.

## Render Deployment

This repository builds a static Vite app. The production artifact is `dist/index.html` plus assets, not a Node entrypoint such as `dist/main.js`.

Recommended Render setup:

- Service type: Static Site
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Required env vars: `VITE_API_URL`, `VITE_APP_ENV`, `VITE_APP_VERSION`, `VITE_BUILD_HASH`
- Optional env var: `VITE_SENTRY_DSN`

If deployed as a web service for preview-style hosting, use:

```bash
npm run start:prod
```

## Documentation

Detailed docs live under `docs/`:

- Deploy and browser QA: `docs/deploy/`
- QA notes and summaries: `docs/qa/`
- Audits and applied fixes: `docs/audits/`
- Security planning docs: `docs/security/`

## Hygiene

Before opening a production deployment PR, run:

```bash
npm run build
npm test
npm run hygiene:check
```

Do not commit real secrets or filled env files.
