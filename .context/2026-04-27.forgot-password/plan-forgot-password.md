---
status: completed
date: 2026-04-27
subject: 2026-04-27.forgot-password
topics: [auth, password-reset, email, forgot-password, jwt]
research: []
spec:
memory: [forgot-password-2026-04-27.md]
---

# Plan: Forgot Password Flow

## Goal

Add a complete "Forgot Password" feature: user clicks "Forgot my password" on the login page → enters their email → receives a password reset link via email → link authenticates them temporarily → they set a new password → redirected to their dashboard.

## Context used / assumptions

- **User-provided context**: Forgot password feature with email link flow, temporary authentication, forced password change, redirect to dashboard.
- **Codebase context**:
  - Auth uses JWT cookies (`auth_token`, 7-day expiry) — see `lib/auth/jwt.ts`
  - Passwords hashed with bcryptjs — see `features/auth/services/auth.service.ts`
  - SQLite via Drizzle ORM — see `lib/db/schema.ts`
  - No existing email service — needs to be added
  - No Next.js middleware file (route protection is done via `withAuth` in `lib/auth/middleware.ts`)
  - Drizzle migrations dir configured at `./drizzle/` but no migrations exist yet (schema applied directly)
- **Assumptions / open questions**:
  - **Email provider**: Using [Resend](https://resend.com) (modern, simple API, free tier supports 100 emails/day) — install `resend` npm package
  - **Reset token expiry**: 1 hour
  - **Reset token storage**: New `password_reset_tokens` table in SQLite (token hash + expiry + used flag)
  - **Password requirements**: Same as registration — minimum 8 characters (enforced by existing `registerSchema`)
  - **Single-use tokens**: Once a token is used to reset a password, it is invalidated
  - **Email content**: Simple HTML email with reset link pointing to `/reset-password?token=<token>`
  - **No email verification required** — just send the reset email silently

## Scope

- "Forgot password" link on login page
- Forgot password form (enter email)
- API endpoint to request password reset email
- New DB table for reset tokens
- API endpoint to verify token and reset password
- Reset password page (new password form)
- Email sending via Resend
- Redirect to dashboard after successful reset

## Out of scope

- Rate limiting on reset requests (can add later)
- Email verification for new accounts
- "Password reset confirmation" email after successful reset
- Remember-me or session management changes
- Account lockout after too many failed attempts

## Affected files

| File | Action | Description |
|------|--------|-------------|
| `lib/db/schema.ts` | **Modify** | Add `passwordResetTokens` table |
| `lib/auth/jwt.ts` | **Modify** | Add short-lived reset JWT signing function |
| `features/auth/schemas/auth.schemas.ts` | **Modify** | Add `forgotPasswordSchema` and `resetPasswordSchema` |
| `features/auth/services/auth.service.ts` | **Modify** | Add `forgotPassword()` and `resetPassword()` service functions |
| `lib/email.ts` | **Create** | Email sending utility using Resend |
| `lib/email-templates.ts` | **Create** | HTML email template for password reset |
| `app/(auth)/login/page.tsx` | **Modify** | Add "Forgot password?" link |
| `app/(auth)/forgot-password/page.tsx` | **Create** | Forgot password page (email form) |
| `components/auth/ForgotPasswordForm.tsx` | **Create** | Form component for entering email |
| `app/(auth)/reset-password/page.tsx` | **Create** | Reset password page (new password form) |
| `components/auth/ResetPasswordForm.tsx` | **Create** | Form component for entering new password |
| `app/api/auth/forgot-password/route.ts` | **Create** | POST endpoint to request reset email |
| `features/auth/routes/forgot-password/route.ts` | **Create** | Feature handler for forgot password |
| `app/api/auth/reset-password/route.ts` | **Create** | POST endpoint to reset password |
| `features/auth/routes/reset-password/route.ts` | **Create** | Feature handler for reset password |
| `package.json` | **Modify** | Add `resend` dependency |

## Implementation steps

### Step 1: Add `passwordResetTokens` table to schema

In `lib/db/schema.ts`, add:

```typescript
export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  tokenHash: text('token_hash').notNull(),      // SHA-256 hash of the reset token
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),  // null = not used
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

Then run `npx drizzle-kit generate` and `npx drizzle-kit migrate` (or push: `npx drizzle-kit push`).

### Step 2: Install Resend and create email utility

```bash
npm install resend
```

Create `lib/email.ts`:
- Initialize Resend client with `RESEND_API_KEY` env var
- Export `sendPasswordResetEmail(to: string, resetUrl: string)` function
- Create `lib/email-templates.ts` with HTML template for the reset email
- Use the deployed domain for the `from` address (e.g., `Trello Clone <noreply@buckleyrobinson.com>`)
- **Dev fallback**: If `RESEND_API_KEY` is not set, log the reset URL to console instead of sending email

### Step 3: Add schemas

In `features/auth/schemas/auth.schemas.ts`, add:

```typescript
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
```

### Step 4: Add service functions

In `features/auth/services/auth.service.ts`, add:

**`forgotPassword(input: ForgotPasswordInput)`**:
1. Look up user by email
2. If user not found — **do NOT error**, return success silently (prevents email enumeration)
3. Generate a secure random token (`crypto.randomBytes(32).toString('hex')`)
4. Hash the token with SHA-256 for storage
5. Invalidate any existing unused tokens for this user (set `usedAt` to now)
6. Insert new token record with 1-hour expiry
7. Build reset URL: `${APP_URL}/reset-password?token=<raw_token>`
8. Send email via `sendPasswordResetEmail()`
9. Return success

**`resetPassword(input: ResetPasswordInput)`**:
1. Hash the provided token with SHA-256
2. Look up token record by `tokenHash` where `usedAt IS NULL` and `expiresAt > now`
3. If not found → throw `UnauthorizedError('Invalid or expired reset link')`
4. Hash new password with bcrypt
5. Update user's `passwordHash` in `users` table
6. Mark token as used (`usedAt = now`)
7. Generate a fresh JWT and return it (so user is logged in immediately)
8. Return `{ token, user }` — same shape as login/register

### Step 5: Create API routes

**`app/api/auth/forgot-password/route.ts`** (thin wrapper):
- Parse body, validate with `forgotPasswordSchema`
- Call `forgotPassword()` from service
- Always return `successResponse({ message: 'If an account exists with that email, a reset link has been sent.' })`

**`app/api/auth/reset-password/route.ts`** (thin wrapper):
- Parse body, validate with `resetPasswordSchema`
- Call `resetPassword()` from service
- Set JWT cookie on response (same as login route)
- Return `successResponse({ user })`

Follow the same pattern as existing `app/api/auth/login/route.ts` — thin API route that delegates to a `features/auth/routes/forgot-password/route.ts` handler if desired, or keep it simple and inline since these are small.

### Step 6: Create UI components and pages

**`components/auth/ForgotPasswordForm.tsx`**:
- Single email input field
- Submit button "Send Reset Link"
- Success state: "Check your email for a reset link"
- Error display (same pattern as `LoginForm.tsx`)
- "Back to login" link

**`app/(auth)/forgot-password/page.tsx`**:
- Centered card layout (same as login page)
- Header: "Reset Your Password" / "Enter your email and we'll send you a reset link"
- Renders `ForgotPasswordForm`

**`components/auth/ResetPasswordForm.tsx`**:
- Reads `token` from URL query param (`useSearchParams()`)
- New password input field
- Confirm password input field (client-side validation only)
- Submit button "Reset Password"
- Success: redirect to `/boards` (same as login flow)
- If token missing from URL: show error "Invalid reset link"

**`app/(auth)/reset-password/page.tsx`**:
- Centered card layout
- Header: "Set New Password"
- Renders `ResetPasswordForm`
- If no token in URL, show "Invalid or missing reset link" message

### Step 7: Add "Forgot password?" link to login page

In `components/auth/LoginForm.tsx`, add a link below the password field and above the sign-in button:

```tsx
<div className="text-right">
  <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400">
    Forgot password?
  </a>
</div>
```

### Step 8: Environment variables

Add to `.env`:
```
RESEND_API_KEY=re_xxxxx
APP_URL=http://localhost:3000   # or production URL
```

The `APP_URL` is needed to build the reset link. In production, this would be `https://trello.buckleyrobinson.com`.

## Verification

- [ ] Clicking "Forgot password?" on login page navigates to `/forgot-password`
- [ ] Entering an email shows success message regardless of whether user exists
- [ ] Check server logs for reset URL (dev mode) or check email inbox
- [ ] Visiting reset link with valid token shows password reset form
- [ ] Entering new password successfully updates it and redirects to `/boards`
- [ ] Using the same reset link again shows "Invalid or expired" error
- [ ] Using an expired token shows error
- [ ] Using a token with wrong hash shows error
- [ ] Existing login still works with new password
- [ ] Old password no longer works after reset

## Risks

| Risk | Mitigation |
|------|------------|
| **Email not configured in dev** | Console.log fallback when `RESEND_API_KEY` is missing |
| **Email enumeration** | Always return success, never reveal if email exists |
| **Token stored in plain text** | Hash tokens with SHA-256 before storing in DB |
| **Token reuse** | Mark as used after successful reset; invalidate old tokens on new request |
| **No rate limiting** | Out of scope for now — can add rate limiting middleware later |
| **Drizzle migration needed** | Use `drizzle-kit push` for dev; generate migration for production |

## Recommended next step

**`b-build`** — This is straightforward implementation following existing patterns. The plan has clear steps, known file locations, and mirrors the existing auth flow. No architectural ambiguity.
