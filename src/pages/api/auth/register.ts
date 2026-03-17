import type { APIRoute } from "astro";
import { registerSchema } from "../../../lib/validators";
import { createSession, createUser, getUserByEmail, hashPassword, setSessionCookie } from "../../../lib/auth";

export const POST: APIRoute = async ({ request }) => {
  const headers = new Headers();

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ ok: false, error: parsed.error.flatten() }), { status: 400, headers });
    }

    const { email, password } = parsed.data;

    const existing = await getUserByEmail(email);
    if (existing) {
      return new Response(JSON.stringify({ ok: false, error: "Email already in use" }), { status: 409, headers });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(email, passwordHash);
    const session = await createSession(user.id);

    setSessionCookie(headers, session.id);

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "Server error" }), { status: 500, headers });
  }
};