# Browser QA Checklist

Use this checklist on the deployed frontend against the intended deployed backend. Record browser, viewport, role, and any failed step with a screenshot and URL.

## Setup

- [ ] Confirm backend health endpoint is passing before browser QA.
- [ ] Confirm frontend is using the production API base URL.
- [ ] Open DevTools Network tab and keep it visible during role checks.
- [ ] Verify no unexpected 401, 403, 404, or 500 responses on allowed pages.
- [ ] Test desktop, tablet, and mobile widths.

## Owner/Admin Walkthrough

- [ ] Log in with an owner or admin account.
- [ ] Dashboard loads and shows operational sections: attention queue, upcoming lessons, pending payments, recent payments, active groups, teacher workload, academic alerts, and quick actions.
- [ ] Users page opens from navigation.
- [ ] Users list is readable, search/filter controls work, user details/forms are readable, and save/cancel paths behave correctly.
- [ ] Courses page opens from navigation.
- [ ] Courses list is readable, create/edit/delete permissions match admin expectations, and course teacher/student data displays correctly.
- [ ] Groups page opens from navigation.
- [ ] Groups list is readable, rosters display correctly, and create/edit/delete controls are available only where expected.
- [ ] Schedule page opens from navigation.
- [ ] Schedule list is readable, lesson create/edit/delete flows are usable, and course/teacher/room/group fields display correctly.
- [ ] Rooms page opens from navigation.
- [ ] Rooms list is readable and room create/edit/delete flows are usable.
- [ ] Payments page opens from navigation.
- [ ] Payments list is readable, status filters work, pending payments are visible, and confirm/delete actions behave correctly.
- [ ] Profile page opens and profile details are readable.
- [ ] Language switch works for Russian, Uzbek, and English.
- [ ] Theme switch works for light and dark themes.
- [ ] Logout returns to the login screen and protected URLs require authentication afterward.

## Teacher Walkthrough

- [ ] Log in with a teacher account.
- [ ] Dashboard shows only the teacher workspace, not admin/owner payment or system-management widgets.
- [ ] Today lessons are visible when assigned.
- [ ] Own groups are visible and unrelated groups are not shown.
- [ ] Own students are visible through the allowed students view.
- [ ] Own schedule is visible through the allowed schedule view.
- [ ] Academic shortcuts lead to attendance, homework, and grades workflows.
- [ ] Navigation does not expose admin tools, rooms management, payments management, roles, or statistics links.
- [ ] Manually opening `/app/admin-tools` is blocked or redirected.
- [ ] Manually opening `/app/rooms` is blocked or redirected.
- [ ] Manually opening `/app/payments` is blocked or redirected.
- [ ] Manually opening backend-only forbidden resources through the UI is not possible.
- [ ] Logout returns to the login screen.

## Student Walkthrough

- [ ] Log in with a student account.
- [ ] Dashboard shows only the student portal, not teacher/admin operational workspace.
- [ ] Next lesson or empty state is visible.
- [ ] Own schedule is visible.
- [ ] Own homework is visible.
- [ ] Own grades are visible.
- [ ] Own payment status is visible.
- [ ] Teacher and group info displays only from the student's own data.
- [ ] Navigation does not expose users, courses/groups/schedule management, rooms, admin tools, or staff payment management.
- [ ] Student cannot see unrelated groups.
- [ ] Student cannot see unrelated students.
- [ ] Student cannot see unrelated teachers beyond their own assigned lesson/group context.
- [ ] Manually opening `/app/users` is blocked or redirected.
- [ ] Manually opening `/app/rooms` is blocked or redirected.
- [ ] Manually opening `/app/admin-tools` is blocked or redirected.
- [ ] Manually opening management-only pages is blocked or redirected.
- [ ] Logout returns to the login screen.

## Visual QA

- [ ] Russian mode has no English labels in primary navigation, dashboards, tables, forms, modals, buttons, empty states, and errors.
- [ ] Uzbek mode has no broken labels, raw translation keys, or missing interpolation values.
- [ ] English mode works across all pages.
- [ ] Light theme looks clean: contrast, cards, tables, modals, inputs, buttons, badges, and hover states are readable.
- [ ] Dark theme looks clean: contrast, cards, tables, modals, inputs, buttons, badges, and hover states are readable.
- [ ] Mobile layout does not break at narrow widths.
- [ ] Tablet layout does not break.
- [ ] Dashboard is not visually empty for seeded/real operational data.
- [ ] Empty states are clear when no data exists.
- [ ] Modals are readable and usable on desktop and mobile.
- [ ] Tables are readable on desktop and collapse/scroll acceptably on mobile.
- [ ] Error states are readable and include useful retry or recovery options where available.
- [ ] Text does not overflow buttons, cards, table cells, modals, or topbar/sidebar regions.
- [ ] No overlapping UI elements appear during loading, empty, success, or error states.

## Final Sign-Off

- [ ] Owner/admin role passed.
- [ ] Teacher role passed.
- [ ] Student role passed.
- [ ] Visual QA passed in Russian, Uzbek, and English.
- [ ] Light and dark themes passed.
- [ ] Desktop, tablet, and mobile passed.
- [ ] Any defects are recorded with severity and deployment decision.
