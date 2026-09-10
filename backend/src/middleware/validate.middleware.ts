import { z } from "zod";
import { ApiError } from "../utils/apiError.js";

export function validate(schema: z.ZodSchema) {
  return (req: any, _res: any, next: any) => {
    try {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        throw ApiError.badRequest("Validation failed", errors);
      }

      req.validated = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateBody(schema: z.ZodSchema) {
  return (req: any, _res: any, next: any) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        throw ApiError.badRequest("Validation failed", errors);
      }
      req.validatedBody = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery(schema: z.ZodSchema) {
  return (req: any, _res: any, next: any) => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        throw ApiError.badRequest("Validation failed", errors);
      }
      req.validatedQuery = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateParams(schema: z.ZodSchema) {
  return (req: any, _res: any, next: any) => {
    try {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        throw ApiError.badRequest("Validation failed", errors);
      }
      req.validatedParams = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const commonSchemas = {
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
  roomCode: z.string().length(6).regex(/^[A-Z0-9]+$/, "Invalid room code format"),
};
