import z from "zod";

export interface AuthContext {
  user?: { id: number; email: string };
  isAuthenticated: boolean;
}

export type TErrorResponse = {
  ok: false;
  statusCode: number;
  message: string;
  error: string;
};

export interface ISuccessResponse<T> {
  ok: true;
  statusCode: number;
  message: string;
  data: T;
}

// Success response wrapper
export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    ok: z.literal(true),
    statusCode: z.number(),
    message: z.string(),
    data: dataSchema,
  });

// Error response schema
export const errorResponseSchema = z.object({
  ok: z.literal(false),
  statusCode: z.number(),
  message: z.string(),
  error: z.string(),
});

export type TResponse<T> = ISuccessResponse<T> | TErrorResponse;
