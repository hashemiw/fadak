import { revalidateTag } from "next/cache";

// Called by the admin panel right after a save so visitors see the change immediately.
// Only a signed-in staff session (checked against the backend) may trigger it.
export async function POST(request: Request) {
  const backend = process.env.BACKEND_URL || "http://127.0.0.1:8080";
  const me = await fetch(`${backend}/api/me`, { headers: { cookie: request.headers.get("cookie") ?? "" }, cache: "no-store" }).catch(() => null);
  const user = me?.ok ? await me.json().catch(() => null) : null;
  if (user?.role !== "admin") return Response.json({ error: "forbidden" }, { status: 403 });
  revalidateTag("content", { expire: 0 });
  return Response.json({ ok: true });
}
