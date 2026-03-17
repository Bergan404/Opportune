import type { APIRoute } from "astro";
import { clearSessionCookie, deleteSession, getSessionIdFromRequest } from "../lib/auth";

export const GET: APIRoute = async ({ request, redirect }) => {
  const headers = new Headers();
  const sessionId = getSessionIdFromRequest(request);
  if (sessionId) await deleteSession(sessionId);
  clearSessionCookie(headers);

  return redirect("/login", 302);
};