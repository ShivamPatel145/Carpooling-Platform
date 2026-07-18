import type { ApiErrorBody } from "@/lib/api";

/**
 * Typed fetch wrapper for client-side data access (used by TanStack Query hooks). Parses the
 * standard error envelope from lib/api.ts and throws a typed FetchError so mutations can surface
 * `error.message` in a toast. Server code uses the db directly, not this.
 */
export class FetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly issues?: unknown,
  ) {
    super(message);
    this.name = "FetchError";
  }
}

async function parseError(res: Response): Promise<never> {
  let body: Partial<ApiErrorBody> | undefined;
  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    /* non-JSON error body */
  }
  const err = body?.error;
  throw new FetchError(
    err?.message ?? `Request failed (${res.status})`,
    res.status,
    err?.code ?? "HTTP_ERROR",
    err?.issues,
  );
}

/** GET (or any method) returning JSON of type T. Throws FetchError on non-2xx. */
export async function fetcher<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) await parseError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Convenience helpers so hooks read cleanly. */
export const api = {
  get: <T>(url: string) => fetcher<T>(url),
  post: <T>(url: string, body?: unknown) =>
    fetcher<T>(url, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(url: string, body?: unknown) =>
    fetcher<T>(url, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(url: string, body?: unknown) =>
    fetcher<T>(url, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(url: string) => fetcher<T>(url, { method: "DELETE" }),
};
