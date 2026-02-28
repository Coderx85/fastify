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
