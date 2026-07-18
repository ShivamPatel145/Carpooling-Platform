import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, isAppError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * Consistent error handling for route handlers. Wrap every handler:
 *
 *   export const POST = withErrorHandler(async (req) => { ... return NextResponse.json(x) });
 *
 * It maps our typed errors and ZodErrors to a stable JSON envelope so the client's typed API
 * wrapper (lib/fetcher.ts) can rely on the shape. Uncaught errors become a 500 without leaking
 * internals.
 */
export interface ApiErrorBody {
  error: { code: string; message: string; issues?: unknown };
}

type Handler<Ctx> = (req: Request, ctx: Ctx) => Promise<Response> | Response;

export function withErrorHandler<Ctx = unknown>(handler: Handler<Ctx>): Handler<Ctx> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      // Postgres unique violation → 409, so routes don't each catch it.
      if (isPgUniqueViolation(err)) {
        return errorResponse(new AppError("That already exists.", 409, "CONFLICT"));
      }
      if (err instanceof ZodError) {
        return errorResponse(new ValidationError("Validation failed.", err.flatten()));
      }
      if (isAppError(err)) {
        // 4xx are expected; log at warn. 5xx (rare AppError) at error.
        (err.status >= 500 ? logger.error : logger.warn)(`API ${err.code}`, {
          message: err.message,
          path: safePath(req),
        });
        return errorResponse(err);
      }
      logger.error("Unhandled API error", { err, path: safePath(req) });
      return NextResponse.json(
        { error: { code: "INTERNAL", message: "Something went wrong." } } satisfies ApiErrorBody,
        { status: 500 },
      );
    }
  };
}

function errorResponse(err: AppError) {
  const body: ApiErrorBody = {
    error: {
      code: err.code,
      message: err.message,
      ...(err instanceof ValidationError && err.issues ? { issues: err.issues } : {}),
    },
  };
  return NextResponse.json(body, { status: err.status });
}

function isPgUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

function safePath(req: Request): string {
  try {
    return new URL(req.url).pathname;
  } catch {
    return "unknown";
  }
}

/** Small helpers so handlers stay terse. */
export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);
export const created = <T>(data: T) => NextResponse.json(data, { status: 201 });
export const noContent = () => new NextResponse(null, { status: 204 });
