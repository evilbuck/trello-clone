---
date: 2026-04-27
domains: [bugfix, auth, backend]
topics: [signout, logout, auth-cookie, redirect]
subject: 2026-04-27.auth-feature
artifacts: [app/api/auth/logout/route.ts, features/auth/routes/logout/route.ts]
related: [trello-clone-implementation-2026-04-26.md, trello-clone-registration-fix-2026-04-27.md]
priority: high
status: completed
---

# Session: 2026-04-27 - Signout Fix

## Context
- Previous work: Trello clone MVP implementation, various bug fixes
- Goal: Fix signout button that wasn't redirecting users

## Problem Identified
The signout API (`/api/auth/logout`) was returning HTTP 204 No Content but **not redirecting** the user. After clicking "Sign out", the user stayed on the same page.

## Root Cause
```typescript
// Broken - returns 204, no redirect
const response = noContentResponse();
response.cookies.delete(cookieOptions.name);
return response;
```

## Solution Applied
Changed logout route to return HTTP 302 redirect to `/login`:
```typescript
const response = NextResponse.redirect(new URL('/login', `${protocol}://${host}`), 302);
response.cookies.delete(cookieOptions.name);
return response;
```

## Files Modified
- `app/api/auth/logout/route.ts` - Added redirect + cookie deletion
- `features/auth/routes/logout/route.ts` - Same fix (feature-based route)

## Verification
- API now returns `302 Found` with `Location: /login` header
- Auth cookie properly deleted via `set-cookie: auth_token=; ...; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
- User redirected to login page after signout

## Next Steps
- [ ] Manual browser testing of full auth flow (register → login → logout)
