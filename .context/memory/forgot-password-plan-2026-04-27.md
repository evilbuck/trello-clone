---
date: 2026-04-27
domains: [planning, auth]
topics: [forgot-password, password-reset, email, resend, jwt]
subject: 2026-04-27.forgot-password
artifacts: [plan-forgot-password.md]
related: [trello-clone-mvp-scope-2026-04-26.md]
priority: high
status: active
---

# Session: 2026-04-27 - Forgot Password Plan

## Context
- Previous work: Full Trello clone MVP with auth, boards, lists, cards, drag-and-drop, SSE, deployment
- Goal: Plan a forgot password feature with email-based reset flow

## Decisions Made
- **Email provider**: Resend — simple API, free tier, good Node.js SDK
- **Token storage**: New `password_reset_tokens` SQLite table with SHA-256 hashed tokens
- **Token expiry**: 1 hour
- **Anti-enumeration**: Always return success on forgot-password request, regardless of email existence
- **Single-use tokens**: Invalidated after use; previous unused tokens invalidated on new request
- **Immediate login**: Reset password endpoint returns JWT cookie so user is logged in and redirected to dashboard

## Implementation Notes
- Follows existing auth patterns (JWT cookies, bcrypt, Zod validation, feature-based structure)
- New files: email utility, email templates, forgot-password page/form, reset-password page/form, API routes
- Schema change: new `password_reset_tokens` table
- Environment variables needed: `RESEND_API_KEY`, `APP_URL`

## Next Steps
- [ ] Execute plan via `b-build`
- [ ] Test full flow end-to-end
- [ ] Configure Resend API key for production
