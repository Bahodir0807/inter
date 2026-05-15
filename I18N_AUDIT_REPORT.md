# Frontend i18n / Localization Audit Report

Date: 2026-05-16
Status: complete

## Scope

Audited frontend user-facing text across pages, widgets, forms, modals, dialogs, toasts, navigation, dashboard, tables, filters, placeholders, validation errors, loading states, empty states, auth, users, groups, courses, schedule, rooms, academic, payments, profile, and admin tools.

## Results

- Translation dictionaries are aligned: 880 keys in RU, 880 keys in UZ, 880 keys in EN.
- Missing translation keys: 0.
- Duplicate translation keys: 0.
- Missing static `t()` / `translate()` keys in source: 0.
- Hardcoded UI strings found and fixed: 25.
- Remaining hardcoded text findings: 2 brand-name occurrences of `Inter CRM`, intentionally not translated.

## Main Fixes

- Added complete EN/RU/UZ translations for validation messages, schedule form text, group teacher constraints, user group assignment text, placeholders, checkbox summaries, support-load errors, academic empty states, and admin metadata placeholder.
- Removed hardcoded fallbacks from `t()` and `translate()` calls.
- Converted Zod validation messages from raw UI text to translation keys and translated them before rendering.
- Converted form placeholders and loading/empty state labels to i18n keys.
- Fixed untranslated room type, no-linked-users, checkbox summary, and route loading copy.

## Verification

- `npm.cmd run typecheck`: passed.
- `npm.cmd test`: passed (`smoke:static`).
- `npm.cmd run build`: passed.
- `npm.cmd run hygiene:check`: passed.
- Protected responsive audit was not run because Chrome DevTools Protocol was not available at `http://127.0.0.1:9222`.

## Notes

API-provided values and product names are not translated by the frontend i18n layer. Backend/API messages may still appear in their original language when surfaced directly from server errors.
