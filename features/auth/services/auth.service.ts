import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/lib/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { signJWT } from '@/lib/auth/jwt';
import { ConflictError, UnauthorizedError } from '@/lib/errors';
import { sendPasswordResetEmail } from '@/lib/email';
import type { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from '../schemas/auth.schemas';

export async function register(input: RegisterInput) {
  const { email, password } = input;

  // Check if user exists
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    throw new ConflictError('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const now = new Date();
  const user = {
    id: uuid(),
    email,
    passwordHash,
    createdAt: now,
  };

  await db.insert(users).values(user);

  // Generate JWT
  const token = signJWT({ userId: user.id, email: user.email });

  return { token, user: { id: user.id, email: user.email } };
}

export async function login(input: LoginInput) {
  const { email, password } = input;

  // Find user
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Generate JWT
  const token = signJWT({ userId: user.id, email: user.email });

  return { token, user: { id: user.id, email: user.email } };
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const { email } = input;

  // Find user — silently return if not found to prevent email enumeration
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return { success: true };
  }

  // Invalidate any existing unused tokens for this user
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt)
      )
    );

  // Generate a secure random token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

  // Insert token record
  await db.insert(passwordResetTokens).values({
    id: uuid(),
    userId: user.id,
    tokenHash,
    expiresAt,
    createdAt: now,
  });

  // Build reset URL
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

  // Send email
  await sendPasswordResetEmail(user.email, resetUrl);

  return { success: true };
}

export async function resetPassword(input: ResetPasswordInput) {
  const { token, password } = input;

  // Hash the provided token and look it up
  const tokenHash = hashToken(token);
  const now = new Date();

  const tokenRecord = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.tokenHash, tokenHash),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, now)
    ),
  });

  if (!tokenRecord) {
    throw new UnauthorizedError('Invalid or expired reset link');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(password, 12);

  // Update user's password
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, tokenRecord.userId));

  // Mark token as used
  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(eq(passwordResetTokens.id, tokenRecord.id));

  // Get user and generate JWT
  const user = await db.query.users.findFirst({
    where: eq(users.id, tokenRecord.userId),
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  const jwt = signJWT({ userId: user.id, email: user.email });

  return { token: jwt, user: { id: user.id, email: user.email } };
}
