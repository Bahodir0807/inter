# Integration Stress Audit

Date: 2026-05-09

## Scope

This audit focuses on runtime integration behavior, async edge cases, auth refresh concurrency, retry logic, stale token handling, timeout handling, duplicate request safety, optimistic UI consistency, and race conditions under stress, retries, stale auth, slow network, or concurrent requests.

## Detailed Analysis

### 1. Concurrent 401 requests during token refresh

- **Mechanism**: Axios response interceptor detects `401` status and triggers `refreshAccessToken()`.
- **Deduplication**: Module-level `refreshPromise` ensures only one refresh request is made, even if multiple concurrent requests fail with `401`.
- **Behavior**: Subsequent `401` failures wait for the shared `refreshPromise`. If refresh succeeds, original requests are retried with new token. If refresh fails, all waiting requests reject.
- **Risk**: If refresh takes time, multiple requests queue up, but no race condition in refresh itself. However, if refresh fails midway, all queued requests fail simultaneously.

### 2. Multiple refresh requests racing simultaneously

- **Prevention**: `refreshPromise` is checked before starting a new refresh. If already in progress, returns the existing promise.
- **Edge Case**: If `refreshPromise` is cleared in `.finally()`, but a new `401` arrives before the promise resolves, it could start a duplicate refresh. Unlikely due to async timing, but possible in extreme concurrency.
- **Outcome**: Generally safe, but potential for brief window where duplicate refreshes could occur if timing aligns poorly.

### 3. Retry loops after failed refresh

- **Bounded Retry**: Auth interceptor retries once per request (`originalRequest._retry = true`). No infinite loops.
- **After Failure**: If refresh fails, interceptor clears tokens and dispatches `ibrat:auth-expired`. No further retries on that request.
- **React Query**: Queries retry once by default, mutations do not retry. Failed auth requests won't loop via React Query since they reject with `401`.
- **Risk**: If network issues cause intermittent `401` without token expiry, could see repeated single retries, but not loops.

### 4. Expired refresh token behavior

- **Backend Handling**: `validateRefreshToken()` checks JWT expiry and session revocation. Expired tokens revoke all user sessions.
- **Frontend Response**: Refresh failure clears `localStorage.token` and `sessionStorage.refreshToken`, dispatches `ibrat:auth-expired`.
- **SessionBootstrap**: Listens for `ibrat:auth-expired`, clears React Query cache, re-runs `bootstrap()` which fails silently and sets `bootstrapped: true` with null user.
- **UI Impact**: User is logged out, redirected to login. No stale state persists.

### 5. Logout consistency after auth failure

- **Logout Flow**: `authStore.logout()` attempts backend logout, then clears local storage regardless of backend response.
- **Auth Failure**: On `401` after refresh failure, tokens are cleared immediately. No backend logout call.
- **Consistency**: Local logout always succeeds. Backend sessions may linger but are invalidated on next use via refresh validation.
- **Race**: If logout is called while refresh is in progress, local clear wins, but backend may still have active session until expiry.

### 6. API timeout handling

- **Configuration**: `http.ts` creates Axios instance without `timeout` option. No client-side timeout.
- **Behavior**: Requests can hang indefinitely until browser/network timeout (typically 30-300 seconds).
- **Impact**: Long-running requests (e.g., slow backend) leave UI in loading state. Modals can't be closed if `closeDisabled={loading}`.
- **Risk**: Deadlocks in UI if request never completes. No way to cancel hung requests.

### 7. Request cancellation handling

- **Implementation**: No `CancelToken` or `AbortController` usage in `http.ts` or API calls.
- **Behavior**: Requests cannot be cancelled. Component unmounts or route changes don't abort in-flight requests.
- **Impact**: Stale requests continue consuming resources. UI may update with outdated data if request completes after component unmount.
- **Risk**: Memory leaks, inconsistent state if cancelled requests resolve after state changes.

### 8. Duplicate payment submission risks

- **UI Prevention**: `PaymentFormModal` disables submit button when `loading || !isValid`. Prevents rapid clicks during submission.
- **Backend Protection**: Unique index on `{ student, course }` in `payment.schema.ts`. `PaymentsService.create()` checks for existing payment and throws `ConflictException`.
- **Race Window**: If two tabs submit simultaneously, backend may allow one and reject the other with conflict.
- **Risk**: Duplicate submissions possible via multiple tabs or if UI state desyncs.

### 9. Double-click submit behavior

- **Payment Create**: Button disabled during `loading`, preventing double-clicks.
- **Payment Actions**: Confirm/delete buttons in `PaymentsPage` are not disabled during mutation. Rapid clicks can fire multiple requests.
- **Backend Handling**: Confirm/cancel use atomic `findOneAndUpdate` with status guards. Duplicate requests may succeed or fail with conflict.
- **Risk**: Multiple ledger entries or inconsistent state if duplicates slip through.

### 10. Optimistic UI rollback consistency

- **No Optimistic Updates**: All mutations use `invalidateQueries` after success. UI updates only after backend confirmation.
- **Rollback**: If mutation fails, cache remains stale until manual retry or refetch.
- **Consistency**: Conservative approach avoids rollback issues, but UI may show outdated data briefly after failures.
- **Risk**: No optimistic updates, so no rollback problems, but potential for stale UI state.

### 11. Loading state deadlocks

- **Modal Deadlock**: `PaymentFormModal` sets `closeDisabled={loading}`. If request hangs, modal cannot be closed.
- **Button Deadlock**: Submit buttons show "Saving..." indefinitely if request doesn't complete.
- **Query Deadlock**: `paymentsQuery` shows `LoadingState` until resolved. No timeout.
- **Risk**: UI becomes unresponsive if requests hang due to network issues or slow backend.

### 12. Silent async failures

- **Support Query**: `PaymentsPage.supportQuery` fetches students/courses. If it fails, `students`/`courses` default to empty arrays, rendering incomplete filters without error display.
- **Silent Impact**: Users see empty dropdowns, assume no data, without knowing fetch failed.
- **Other Queries**: Main `paymentsQuery` shows `ErrorState` with retry. Mutations show toast errors.
- **Risk**: Partial failures go unnoticed, leading to broken workflows.

### 13. Frontend/backend state desynchronization

- **Auth State**: `authStore` manages user/role. Changes via refresh/logout update store, but route guards (`RoleGate`) check store state.
- **During Refresh**: If auth expires during navigation, `ProtectedRoute` may allow access briefly before `ibrat:auth-expired` clears state.
- **Cache Staleness**: Mutations invalidate broad `['payments']` key, refetching all payment queries.
- **Risk**: Brief window where unauthorized user sees protected content during auth refresh.

### 14. React Query / fetch retry behavior

- **Query Retries**: `retry: 1` by default. Failed queries retry once before showing error.
- **Mutation Retries**: `retry: false`. Failed mutations show error immediately.
- **Auth Integration**: `401` failures trigger refresh retry, not React Query retry.
- **Behavior**: Network errors retry once. Auth errors retry via refresh, then fail.
- **Risk**: Single retry may not suffice for intermittent issues, but prevents excessive load.

### 15. Stale cache after mutations

- **Invalidation**: Mutations call `invalidateQueries({ queryKey: ['payments'] })`, clearing all payment caches.
- **Staleness**: Cache remains until invalidation. No background refetch.
- **Impact**: Other tabs/windows see stale data until manual refresh or navigation.
- **Risk**: Multi-tab inconsistency. Users may act on outdated payment lists.

### 16. Race conditions during route navigation + auth refresh

- **Navigation Guard**: `ProtectedRoute` checks `authStore.user`. If null, redirects to login.
- **During Refresh**: If navigation occurs while refresh is pending, route may render briefly before auth state updates.
- **RoleGate**: Checks `user.role` against allowed roles. If auth changes during render, may show unauthorized content momentarily.
- **SessionBootstrap**: Clears query cache on `ibrat:auth-expired`, but route may have already rendered.
- **Risk**: Flash of unauthorized content during auth transitions.

## Risk Summary

High-risk areas:
- No API timeouts; requests can hang indefinitely, causing UI deadlocks.
- No request cancellation; potential memory leaks and state inconsistencies.
- Silent support query failures in `PaymentsPage`; users see broken UI without error indication.
- Confirm/delete buttons not disabled during mutation; allows duplicate requests.
- Brief desynchronization during auth refresh and navigation.

Medium-risk areas:
- Potential duplicate refresh requests in extreme concurrency.
- Stale cache across tabs after mutations.
- Loading states that cannot be interrupted.

Low-risk areas:
- Auth refresh deduplication is generally effective.
- Backend provides strong duplicate protection for payments.
- Retry loops are bounded.

## Conclusion

The integration layer handles basic concurrency and auth refresh well, but lacks robustness for slow networks, request cancellation, and comprehensive error visibility. Key improvements needed: add timeouts, cancellation support, disable action buttons during mutations, and surface support query failures.
