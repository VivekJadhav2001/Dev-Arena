export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors: any[] = [],
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad Request", errors: unknown[] = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }

  static conflict(message = "Conflict") {
    return new ApiError(409, message);
  }

  static internal(message = "Internal Server Error") {
    return new ApiError(500, message, [], false);
  }

  static tooManyRequests(message = "Too many requests") {
    return new ApiError(429, message);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
