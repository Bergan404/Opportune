import type { APIRoute } from "astro";
import { db } from "../../../lib/db";
import { applications } from "../../../lib/schema";
import { applicationSchema } from "../../../lib/validators";
import { getUserFromRequest } from "../../../lib/auth";
import { and, eq } from "drizzle-orm";

export const PUT: APIRoute = async ({ request, params }) => {
  const user = await getUserFromRequest(request);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });

  const id = params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: "Missing id" }), { status: 400 });

  const body = await request.json();
  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, error: parsed.error.flatten() }), { status: 400 });
  }

  const [updated] = await db
    .update(applications)
    .set({
      company: parsed.data.company,
      role: parsed.data.role,
      location: parsed.data.location ?? null,
      link: parsed.data.link ?? null,
      salaryRange: parsed.data.salaryRange ?? null,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
      dateApplied: parsed.data.dateApplied,
      updatedAt: new Date(),
    })
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)))
    .returning();

  if (!updated) return new Response(JSON.stringify({ ok: false, error: "Not found" }), { status: 404 });

  return new Response(JSON.stringify({ ok: true, item: updated }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const user = await getUserFromRequest(request);
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });

  const id = params.id;
  if (!id) return new Response(JSON.stringify({ ok: false, error: "Missing id" }), { status: 400 });

  const [deleted] = await db
    .delete(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)))
    .returning();

  if (!deleted) return new Response(JSON.stringify({ ok: false, error: "Not found" }), { status: 404 });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};