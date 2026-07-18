/**
 * Typed application errors. The RBAC guard throws these; the route error-handler wrapper
 * (lib/api.ts) maps them to HTTP status codes. Keeps status semantics in one place instead of
 * scattered `return new Response(..., { status: 403 })`.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** 401 — not signed in / no valid session. */
export class UnauthorizedError extends AppError {
  constructor(message = "You must be signed in.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

/** 403 — signed in, but the role/ownership check failed. */
export class ForbiddenError extends AppError {
  constructor(message = "You don't have permission to do that.") {
    super(message, 403, "FORBIDDEN");
  }
}

/** 404 — resource not found (or hidden from this user). */
export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super(message, 404, "NOT_FOUND");
  }
}

/** 400 — request failed validation (Zod). */
export class ValidationError extends AppError {
  constructor(
    message = "Invalid request.",
    public readonly issues?: unknown,
  ) {
    super(message, 400, "VALIDATION");
  }
}

/** 409 — conflict, e.g. unique-constraint violation. */
export class ConflictError extends AppError {
  constructor(message = "That already exists.") {
    super(message, 409, "CONFLICT");
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
