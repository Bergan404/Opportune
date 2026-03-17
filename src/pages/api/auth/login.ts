import type { APIRoute } from "astro";
import { loginSchema } from "../../../lib/validators";
import { createSession, getUserByEmail, setSessionCookie, verifyPassword } from "../../../lib/auth";

export const POST: APIRoute = async ({ request }) => {
  const headers = new Headers();

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ ok: false, error: parsed.error.flatten() }), { status: 400, headers });
    }

    const { email, password } = parsed.data;

    const user = await getUserByEmail(email);
    if (!user) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid credentials" }), { status: 401, headers });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid credentials" }), { status: 401, headers });
    }

    const session = await createSession(user.id);
    setSessionCookie(headers, session.id);

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Server error" }), { status: 500, headers });
  }
};