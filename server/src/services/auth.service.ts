import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

// ─── Types ───────────────────────────────────────────

interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  name: string;
}

// ─── Token helpers ───────────────────────────────────

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "7d",
  });
}

// ─── Register ────────────────────────────────────────

export async function registerUser(input: RegisterInput) {
  // Check if email is already taken
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new Error("EMAIL_TAKEN");
  }

  // Hash the password — never store plain text
  // The 12 is the "salt rounds" — higher = slower to crack but also slower to run
  // 12 is the industry standard sweet spot
  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
  };

  return {
    user,
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

// ─── Login ───────────────────────────────────────────

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  // Always use a generic error message — never tell the caller
  // whether the email or password was wrong specifically.
  // That would let attackers enumerate valid email addresses.
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatch) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
  };

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export async function updateProfile(
  userId: string,
  input: { name?: string; timezone?: string },
) {
  return prisma.user.update({
    where: { id: userId },
    data: input,
    select: {
      id: true,
      email: true,
      name: true,
      timezone: true,
      createdAt: true,
    },
  });
}

export async function getUserStats(userId: string) {
  const [totalCheckIns, habitCount, notebookCount, noteCount] =
    await Promise.all([
      prisma.checkIn.count({ where: { userId } }),
      prisma.habit.count({ where: { userId } }),
      prisma.notebook.count({ where: { userId } }),
      prisma.note.count({ where: { userId } }),
    ]);

  return { totalCheckIns, habitCount, notebookCount, noteCount };
}
