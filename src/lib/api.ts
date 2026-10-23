export type ApiResult<T> = { ok: boolean; status: number; data: T & { error?: string } };

// Same-origin calls to the Go backend (proxied under /api). Cookies carry the session; nothing goes to third parties.
export async function api<T = unknown>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  const init: RequestInit = { method, headers: {} };
  if (body instanceof FormData) init.body = body;
  else if (body !== undefined) { (init.headers as Record<string, string>)["Content-Type"] = "application/json"; init.body = JSON.stringify(body); }
  try {
    const res = await fetch(`/api${path}`, init);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "network" } as never };
  }
}

export type User = { id: number; name: string; phone: string; role: "customer" | "admin" };
export type CaseItem = { id: number; title: string; projectType: string; city: string; description: string; refs: string[]; status: string; createdAt: number; updatedAt: number; owner?: User };
export type Message = { id: number; authorName: string; authorRole: string; body: string; createdAt: number };
export type FileItem = { id: number; name: string; mime: string; size: number; createdAt: number; uploaderId: number };
export type Inquiry = { id: number; Name: string; Phone: string; ProjectType: string; City: string; Message: string; Locale: string; refs: string[]; createdAt: number };
