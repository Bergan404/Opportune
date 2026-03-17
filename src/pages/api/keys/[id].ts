import type { APIRoute } from "astro";
import { getUserFromRequest, deleteApiKey } from "../../../lib/auth";

// DELETE /api/keys/:id - delete API key
export const DELETE: APIRoute = async ({ request, params }) => {
  const user = await getUserFromRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  }

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ ok: false, error: "Missing id" }), { status: 400 });
  }

  const deleted = await deleteApiKey(id, user.id);
  if (!deleted) {
    return new Response(JSON.stringify({ ok: false, error: "Not found" }), { status: 404 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
