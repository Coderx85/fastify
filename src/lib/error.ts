import { TErrorResponse } from "@/types/api";

interface IErrorResponse extends TErrorResponse {}

export class ErrorResponse extends Error implements IErrorResponse {
  readonly ok: false = false;

  constructor(
    public readonly error: string,
    public readonly message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ErrorResponse";
    Object.setPrototypeOf(this, ErrorResponse.prototype);
  }
}
/**
 * Extract a cause code from a potentially nested error chain.
 * Service methods wrap errors like:
 *   new Error("Failed to …", { cause: innerError })
 * where innerError may itself carry { cause: { code: "NOT_FOUND" } }.
 */
export function getCauseCode(error: unknown, depth = 3): string | undefined {
  let current: unknown = error;
  for (let i = 0; i < depth && current instanceof Error; i++) {
    const cause = (current as any).cause;
    if (
      cause &&
      typeof cause === "object" &&
      "code" in cause &&
      typeof cause.code === "string"
    ) {
      return cause.code;
    }
    current = cause;
  }
  return undefined;
}
