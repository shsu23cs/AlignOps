/**
 * Standardised HTTP Application Errors
 * All errors follow the { error: { code, message, details[] } } envelope.
 */

export interface ErrorDetail {
  field?: string;
  message: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
  details: ErrorDetail[];
}

export class AppError extends Error {
  readonly isAppError = true;
  readonly statusCode: number;
  readonly payload: ErrorPayload;

  constructor(statusCode: number, payload: ErrorPayload) {
    super(payload.message);
    this.statusCode = statusCode;
    this.payload = payload;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ── Factory helpers ───────────────────────────────────────────────────────────

export function badRequest(message: string, details: ErrorDetail[] = []): AppError {
  return new AppError(400, { code: "BAD_REQUEST", message, details });
}

export function unauthorized(message = "Authentication required."): AppError {
  return new AppError(401, { code: "UNAUTHORIZED", message, details: [] });
}

export function forbidden(message = "You do not have permission to perform this action."): AppError {
  return new AppError(403, { code: "FORBIDDEN", message, details: [] });
}

export function notFound(resource: string): AppError {
  return new AppError(404, {
    code: "NOT_FOUND",
    message: `${resource} not found.`,
    details: [],
  });
}

export function conflict(message: string): AppError {
  return new AppError(409, { code: "CONFLICT", message, details: [] });
}

export function unprocessable(message: string, details: ErrorDetail[] = []): AppError {
  return new AppError(422, {
    code: "VALIDATION_FAILED",
    message,
    details,
  });
}

export function windowClosed(phase: string): AppError {
  return new AppError(422, {
    code: "WINDOW_CLOSED",
    message: `The ${phase} window is not currently open.`,
    details: [{ field: "cycle_phase", message: `No active cycle for phase ${phase}.` }],
  });
}
