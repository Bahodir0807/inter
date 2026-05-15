# i18n Implementation Guide

## Current System

- Translation dictionaries live in `src/shared/i18n/translations.ts`.
- Runtime helpers live in `src/shared/i18n/i18n.tsx`.
- Supported languages: `ru`, `uz`, `en`.
- Fallback language: `ru`.
- Use `const { t } = useI18n()` in React components.
- Use `translate()` only in non-hook code or shared utilities.

## Rules

- Every user-facing frontend string must be a translation key.
- Every new key must be added to RU, UZ, and EN in the same change.
- Do not add hardcoded fallback strings to `t()` / `translate()` calls.
- For interpolation, use `{{name}}` in translations and call `t('key', { name })`.
- Zod validation messages should be translation keys. Translate them before rendering:

```tsx
const resolveErrorMessage = (key: string | undefined) => (key ? t(key) : undefined);

<Input error={resolveErrorMessage(errors.name?.message)} />
```

## Audit Commands

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run hygiene:check
```

The protected responsive audit requires a running frontend at `QA_BASE_URL` and an available Chrome DevTools endpoint at `QA_CDP_URL` (default `http://127.0.0.1:9222`).
