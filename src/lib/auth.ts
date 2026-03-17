import bcrypt from "bcryptjs";
import { db } from "./db";
import { apiKeys, sessions, users } from "./schema";
import { and, eq } from "drizzle-orm";
import crypto from "crypto";

const COOKIE_NAME = process.env.COOKIE_NAME || "opportune_session";

function hoursFromNow(h: number) {
  const d = new Date();
  d.setHours(d.getHours() + h);
  return d;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const expiresAt = hoursFromNow(24 * 14); // 14 days
  const [s] = await db
    .insert(sessions)
    .values({ userId, expiresAt })
    .returning();
  return s;
}

export function setSessionCookie(headers: Headers, sessionId: string) {
  const secure = process.env.NODE_ENV === "production";
  headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 14}; ${
      secure ? "Secure;" : ""
    }`
  );
}

export function clearSessionCookie(headers: Headers) {
  const secure = process.env.NODE_ENV === "production";
  headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ${secure ? "Secure;" : ""}`
  );
}

export function getSessionIdFromRequest(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return m?.[1] || null;
}

export async function getUserFromRequest(request: Request) {
  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) return null;

  const now = new Date();

  // get session
  const s = await db.query.sessions.findFirst({
    where: (t, { eq }) => eq(t.id, sessionId),
  });

  if (!s) return null;
  if (s.expiresAt <= now) return null;

  const u = await db.query.users.findFirst({
    where: (t, { eq }) => eq(t.id, s.userId),
    columns: { id: true, email: true, createdAt: true },
  });

  return u ?? null;
}

export async function deleteSession(sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: (t, { eq }) => eq(t.email, email),
  });
}

export async function createUser(email: string, passwordHash: string) {
  const [u] = await db.insert(users).values({ email, passwordHash }).returning();
  return u;
}

// API Key functions for Chrome extension
export function generateApiKey(): string {
  return `opportune_${crypto.randomBytes(32).toString("hex")}`;
}

export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, 12);
}

export async function verifyApiKey(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash);
}

export async function createApiKey(userId: string, name: string) {
  const key = generateApiKey();
  const keyHash = await hashApiKey(key);
  const [apiKey] = await db
    .insert(apiKeys)
    .values({ userId, keyHash, name })
    .returning({
      id: apiKeys.id,
      name: apiKeys.name,
      createdAt: apiKeys.createdAt,
    });
  return { ...apiKey, key };
}

export async function getUserFromApiKey(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const key = authHeader.slice(7);

  const allKeys = await db
    .select({
      id: apiKeys.id,
      userId: apiKeys.userId,
      keyHash: apiKeys.keyHash,
      email: users.email,
    })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id));

  for (const ak of allKeys) {
    if (await verifyApiKey(key, ak.keyHash)) {
      await db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, ak.id));
      return { id: ak.userId, email: ak.email };
    }
  }

  return null;
}

export async function getApiKeysForUser(userId: string) {
  return db.query.apiKeys.findMany({
    where: (t, { eq }) => eq(t.userId, userId),
    columns: { id: true, name: true, lastUsedAt: true, createdAt: true },
    orderBy: (t, { desc }) => desc(t.createdAt),
  });
}

export async function deleteApiKey(id: string, userId: string) {
  const [deleted] = await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
    .returning();
  return deleted;
}