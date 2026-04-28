---
date: 2026-04-27
domains: [auth, backend, frontend]
topics: [forgot-password, password-reset, email, brevo, jwt]
subject: 2026-04-27.forgot-password
artifacts: [plan-forgot-password.md]
related: []
priority: high
status: completed
---

# Session: Forgot Password Feature Implementation

## Context
- Implemented the complete forgot-password flow as specified in `.context/2026-04-27.forgot-password/plan-forgot-password.md`
- No prior work on this feature

## Decisions Made
- Used crypto.randomBytes for secure token generation and SHA-256 for token hashing (same as plan spec)
- Console.log fallback for email in dev when RESEND_API_KEY is missing
- Tokens are single-use and invalidated on new request
- Suspense boundary wrapped around ResetPasswordForm to satisfy Next.js CSR bailout requirement

## Implementation Notes

### Files Modified
| File | Action |
|------|--------|
| `lib/db/schema.ts` | Added `passwordResetTokens` table |
| `lib/db/index.ts` | Added `password_reset_tokens` table creation + indexes in `initializeDatabase()` |
| `features/auth/schemas/auth.schemas.ts` | Added `forgotPasswordSchema` and `resetPasswordSchema` |
| `features/auth/services/auth.service.ts` | Added `forgotPassword()` and `resetPassword()` service functions |
| `components/auth/LoginForm.tsx` | Added "Forgot password?" link below password field |
| `package.json` | Removed `resend`, no new dependency (uses native fetch) |

### Files Created
| File | Purpose |
|------|---------|
| `lib/email.ts` | Brevo API via fetch + `sendPasswordResetEmail()` with dev fallback |
| `app/api/auth/forgot-password/route.ts` | POST endpoint to request reset email |
| `app/api/auth/reset-password/route.ts` | POST endpoint to verify token and reset password |
| `components/auth/ForgotPasswordForm.tsx` | Email form with success state |
| `app/(auth)/forgot-password/page.tsx` | Forgot password page |
| `components/auth/ResetPasswordForm.tsx` | New password form with confirm password + token validation |
| `app/(auth)/reset-password/page.tsx` | Reset password page with Suspense boundary |

### Verification Results
- ✅ Build passes (`npm run build`)
- ✅ TypeScript compiles (`npx tsc --noEmit`)
- ✅ `/api/auth/forgot-password` returns success silently for unknown emails
- ✅ `/api/auth/forgot-password` generates token and logs reset URL in dev
- ✅ `/api/auth/reset-password` updates password and returns JWT + user
- ✅ Old password no longer works after reset
- ✅ New password works after reset
- ✅ Reusing same token returns "Invalid or expired reset link"
- ✅ Login page shows "Forgot password?" link
- ✅ Forgot password page renders correctly
- ✅ Reset password page renders correctly

## Environment Variables Required
```
BREVO_API_KEY=xkeysib-...    # Production only; dev falls back to console logging
APP_URL=http://localhost:3000  # Used to build reset links
FROM_EMAIL=noreply@...       # Sender address (must be verified in Brevo)
```

## Post-implementation Changes
- **2026-04-27**: Switched email provider from Resend to Brevo. `lib/email.ts` now calls Brevo's `v3/smtp/email` API directly via `fetch` instead of using the Resend SDK. This avoids SDK compatibility issues and removes a dependency. Environment variable changed from `RESEND_API_KEY` to `BREVO_API_KEY`.

## Next Steps
- Add rate limiting middleware for forgot-password endpoint
- Add password reset confirmation email after successful reset
- Generate Drizzle migration for production deployment
