import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { signJWT } from '@/lib/auth/jwt';
import { ConflictError, UnauthorizedError } from '@/lib/errors';
import type { RegisterInput, LoginInput } from '../schemas/auth.schemas';

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
