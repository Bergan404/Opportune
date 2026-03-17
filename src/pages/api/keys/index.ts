import type { APIRoute } from "astro";
import { getUserFromRequest, createApiKey, getApiKeysForUser } from "../../../lib/auth";
import { z } from "zod";

const createKeySchema = z.object({
  name: z.string().min(1),
});

// GET /api/keys - list API keys
export const GET: APIRoute = async ({ request }) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  }

  const keys = await getApiKeysForUser(user.id);
  return new Response(JSON.stringify({ ok: true, keys }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

// POST /api/keys - create new API key
export const POST: APIRoute = async ({ request }) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  }

  const body = await request.json();
  const parsed = createKeySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, error: parsed.error.flatten() }), { status: 400 });
  }

  const apiKey = await createApiKey(user.id, parsed.data.name);
  return new Response(JSON.stringify({ ok: true, apiKey }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
