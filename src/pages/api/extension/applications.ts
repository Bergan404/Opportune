import type { APIRoute } from "astro";
import { db } from "../../../lib/db";
import { applications } from "../../../lib/schema";
import { applicationSchema } from "../../../lib/validators";
import { getUserFromApiKey } from "../../../lib/auth";
import { eq, desc } from "drizzle-orm";

// POST /api/extension/applications - create application from extension
export const POST: APIRoute = async ({ request }) => {
  const user = await getUserFromApiKey(request);
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  }

  const body = await request.json();
  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, error: parsed.error.flatten() }), { status: 400 });
  }

  const now = new Date();
  const [created] = await db
    .insert(applications)
    .values({
      userId: user.id,
      company: parsed.data.company,
      role: parsed.data.role,
      location: parsed.data.location ?? null,
      link: parsed.data.link ?? null,
      salaryRange: parsed.data.salaryRange ?? null,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
      dateApplied: parsed.data.dateApplied,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return new Response(JSON.stringify({ ok: true, item: created }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};

// GET /api/extension/applications - list applications for extension
export const GET: APIRoute = async ({ request }) => {
  const user = await getUserFromApiKey(request);
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  }

  const items = await db
    .select()
    .from(applications)
    .where(eq(applications.userId, user.id))
    .orderBy(desc(applications.dateApplied), desc(applications.createdAt));

  return new Response(JSON.stringify({ ok: true, items }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
