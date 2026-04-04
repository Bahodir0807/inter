# Ibrat CRM Frontend

Frontend для CRM учебного центра `Ibrat`.

Это не демо-шаблон и не admin-template. Проект уже работает как реальное SPA-приложение с авторизацией, role-based доступом, app shell, рабочими CRUD-сценариями и SaaS-oriented UX для ежедневной операционной работы.

## Что это за продукт

`Ibrat CRM` решает базовые задачи учебного центра:

- управление пользователями и ролями
- управление курсами и учебными группами
- планирование расписания
- просмотр и подтверждение оплат
- навигация по рабочим сценариям в зависимости от роли

Текущее состояние проекта: ранний production-ready baseline для внутреннего использования и дальнейшего роста в сторону полноценного SaaS.

## Текущий статус

Сейчас во frontend уже реализованы:

- `React + TypeScript + Vite` SPA
- `react-router-dom` routing
- `zustand` auth/session store
- `@tanstack/react-query` для server state
- `axios` API client с Bearer token и нормализацией `id/_id`
- shared UI primitives
- app shell: sidebar, topbar, breadcrumbs, responsive layout
- protected routes и role gating
- core pages:
  - `Dashboard`
  - `Users`
  - `Courses`
  - `Groups`
  - `Schedule`
  - `Rooms`
  - `Payments`
  - `Profile`

Дополнительно уже есть:

- reusable modal forms
- inline validation
- unsaved changes guard
- confirm modals вместо `window.confirm`
- richer data tables с relation-aware cells
- единый продуктовый copy на основных экранах

## Технологический стек

- `React 19`
- `TypeScript`
- `Vite`
- `React Router`
- `TanStack Query`
- `Zustand`
- `Axios`
- `React Hook Form`
- `Zod`

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Локальный запуск

```bash
npm run dev
```

### 3. Production build

```bash
npm run build
```

### 4. Preview production build

```bash
npm run preview
```

## Переменные окружения

Frontend использует:

```env
VITE_API_URL=http://localhost:3000
```

Если переменная не задана, используется fallback из кода:

```ts
http://b.sultonoway.uz
```

См. [env.ts](./src/shared/config/env.ts).

## Auth flow

Frontend работает с реальным backend auth flow:

- `POST /auth/login`
- `GET /auth/me`

Поведение:

- после логина токен сохраняется локально
- при старте приложения выполняется bootstrap сессии
- при `401` токен сбрасывается
- доступ к страницам контролируется через protected routes и role gating

Ключевые файлы:

- [auth-store.ts](./src/features/auth/model/auth-store.ts)
- [http.ts](./src/shared/api/http.ts)
- [app-router.tsx](./src/app/router/app-router.tsx)

## Роли и доступ

Поддерживаемые роли:

- `owner`
- `admin`
- `teacher`
- `student`
- `panda`
- `guest`

### Route map

| Route | Owner | Admin | Teacher | Student | Panda |
|---|---:|---:|---:|---:|---:|
| `/app/dashboard` | yes | yes | yes | yes | yes |
| `/app/users` | yes | yes | yes | no | yes |
| `/app/courses` | yes | yes | yes | yes | no |
| `/app/groups` | yes | yes | yes | no | no |
| `/app/schedule` | yes | yes | yes | yes | no |
| `/app/rooms` | yes | yes | yes | no | no |
| `/app/payments` | yes | yes | no | yes | no |
| `/app/profile` | yes | yes | yes | yes | yes |

Примечания:

- `panda` поддерживается как ограниченная административная роль
- teacher и student видят только те сценарии, которые реально поддерживаются backend access rules

## Что уже умеют модули

### Users

- список пользователей
- фильтрация по ролям
- поиск
- просмотр карточки
- создание
- редактирование
- смена роли
- удаление

### Courses

- список курсов
- привязка преподавателя
- привязка студентов
- создание
- редактирование
- удаление

### Groups

- список групп
- связь с курсом
- назначение преподавателя
- управление составом студентов
- создание
- редактирование
- удаление

### Schedule

- список занятий
- связь с курсом, комнатой, группой, преподавателем и студентами
- фильтрация
- создание
- редактирование
- удаление

### Payments

- список оплат
- связь `student -> course`
- создание
- подтверждение
- удаление
- student read-only view через личный scope

### Rooms

- рабочая inventory-page
- просмотр доступности, типа и вместимости

### Profile

- текущая сессия
- базовые профильные данные пользователя

## UX и продуктовые принципы

Этот frontend уже следует нескольким базовым правилам:

- единый app shell и единый visual rhythm
- все критичные формы работают в modal flow
- destructive actions требуют подтверждения
- таблицы показывают не только поле, но и контекст связи
- интерфейс старается отвечать на вопрос пользователя “что это за запись и что я могу с ней сделать?” без открытия отдельной страницы

## Архитектура проекта

```text
src/
  app/
    providers/
    router/
    styles/
  entities/
    auth/
    attendance/
    course/
    grade/
    group/
    homework/
    payment/
    room/
    schedule/
    user/
  features/
    auth/
  pages/
    dashboard/
    users/
    courses/
    groups/
    schedule/
    rooms/
    payments/
    profile/
    login/
  shared/
    api/
    config/
    hooks/
    lib/
    types/
    ui/
  widgets/
    app-shell/
    page/
```

### Основные принципы структуры

- `entities` содержат API типы и entity-level contracts
- `pages` содержат route-level screens
- `shared` содержит UI primitives, utils и infra
- `widgets` собирают layout и page scaffolding
- `features` используются для user-facing flows, где нужна отдельная логика

## Ключевые файлы

Bootstrap:

- [main.tsx](./src/main.tsx)
- [app.tsx](./src/app/app.tsx)
- [app-providers.tsx](./src/app/providers/app-providers.tsx)

Routing:

- [app-router.tsx](./src/app/router/app-router.tsx)
- [navigation.tsx](./src/app/router/navigation.tsx)

API:

- [http.ts](./src/shared/api/http.ts)
- [errors.ts](./src/shared/api/errors.ts)
- [normalize.ts](./src/shared/api/normalize.ts)

Auth:

- [auth-store.ts](./src/features/auth/model/auth-store.ts)
- [login-form.tsx](./src/features/auth/ui/login-form.tsx)
- [protected-route.tsx](./src/features/auth/ui/protected-route.tsx)

Shell:

- [app-shell.tsx](./src/widgets/app-shell/app-shell.tsx)
- [sidebar.tsx](./src/widgets/app-shell/sidebar.tsx)
- [topbar.tsx](./src/widgets/app-shell/topbar.tsx)

## UI и table system

Shared UI уже даёт:

- buttons
- inputs / selects / textarea
- checkbox group
- cards
- badges
- modal shell
- confirm modal
- data table
- table shell
- table toolbar
- pagination
- loading / empty / error states
- toaster

Это текущий baseline для всех новых экранов. Если добавляется новая таблица или форма, она должна использовать существующие shared patterns, а не изобретать новые ad-hoc решения.

## Работа с backend

Frontend рассчитан на уже стабилизированный backend contract:

- JWT auth
- единый `id`
- предсказуемые error responses
- role-aware access rules

Важно:

- frontend не должен выдумывать поля или routes
- фильтрация и пагинация пока в основном client-side
- при росте данных часть table logic должна перейти на server-side query params

## Ограничения на текущем этапе

Важно понимать реальные границы проекта:

- нет frontend test suite
- нет code splitting по route-level chunks
- bundle уже не минимальный
- часть list pages всё ещё опирается на client-side pagination/filtering
- `Rooms` и `Profile` доведены до качественного baseline, но это не самые насыщенные бизнес-модули

## Рекомендации по дальнейшему развитию

Следующие разумные шаги:

1. Добавить server-driven table filters/pagination там, где это уже поддерживает backend.
2. Ввести route-level lazy loading.
3. Добавить frontend test baseline для критичных flows:
   - login
   - user create/edit/delete
   - payment confirm/delete
4. Довести dashboard до более полезного operations overview.
5. После реального использования собрать feedback по:
   - часто используемым фильтрам
   - лишним кликам
   - missing quick actions

## Команды

```bash
npm run dev
npm run build
npm run preview
```

## Проверка

На текущем этапе проект проверен production build'ом:

```bash
npm run build
```

Сборка проходит успешно.
