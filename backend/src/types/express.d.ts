import type { Response } from "express";

declare global {
  namespace Express {
    interface User {
      id: string;
    }

    interface Request {
      validated?: unknown;
      validatedBody?: unknown;
      validatedQuery?: unknown;
      validatedParams?: unknown;
    }

    interface Response {
      success(statusCode?: number, message?: string, data?: unknown): Response;
      error(statusCode?: number, message?: string): Response;
    }
  }
}

export {};
