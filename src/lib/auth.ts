import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { AppUser, UserRole } from "@/types/database";

export type AuthSession = {
  userId: string;
  email: string;
  role: UserRole;
  companyId: string | null;
};

export type CompanyAuthSession = AuthSession & {
  companyId: string;
  role: Exclude<UserRole, "super_admin">;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signSession(user: AppUser) {
  const payload: AuthSession = {
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.company_id,
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export function verifySessionToken(token: string): AuthSession | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthSession;
  } catch {
    return null;
  }
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function requireSession() {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireSession();

  if (session.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  return session;
}

export async function requireCompanyUser(): Promise<CompanyAuthSession> {
  const session = await requireSession();

  if (!session.companyId || session.role === "super_admin") {
    throw new Error("Forbidden");
  }

  return session as CompanyAuthSession;
}

export async function findUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();

  if (error || !data) {
    return null;
  }

  return data as AppUser;
}
