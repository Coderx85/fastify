import { TResponse } from "@/types/api";
import { FastifyReply } from "fastify";

/**
 * Sends a standardized success response.
 * @param data - The data to be sent in the response.
 * @param message - A brief message describing the response.
 * @param reply - The Fastify reply object to send the response.
 * @param statusCode - HTTP status code (default is 200 or 201).
 **/
export function sendSuccess<T>(
  data: T,
  message: string,
  reply: FastifyReply,
  statusCode: number = 200 | 201,
): void {
  const response: TResponse<T> = {
    ok: true,
    statusCode,
    message,
    data,
  };
  reply.status(statusCode).send(response);
}

/**
 * Sends a standardized error response.
 * @param error - A brief error code or description.
 * @param message - A detailed error message for the client.
 * @param reply - The Fastify reply object to send the response.
 * @param statusCode - HTTP status code (default is 400).
 */
export function sendError(
  error: string,
  message: string,
  reply: FastifyReply,
  statusCode: number = 400 | 404 | 409 | 500,
): void {
  const response: TResponse<null> = {
    ok: false,
    statusCode,
    message,
    error,
  };
  reply.status(statusCode).send(response);
}
