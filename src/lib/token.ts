import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { config } from "./config";

// --- Password Reset Token ---

type TPasswordResetToken = { userId: number; expiresAt: Date };
const passwordResetTokens = new Map<string, TPasswordResetToken>();

const TOKEN_EXPIRATION_MINUTES = 60;

/**
 * Generates a secure random token for password reset, stores it, and returns it.
 * @param userId - The ID of the user to associate with the token.
 * @returns The generated token.
 */
export function generateResetToken(userId: number): string {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MINUTES * 60 * 1000);

  passwordResetTokens.set(token, { userId, expiresAt });

  return token;
}

/**
 * Validates a password reset token.
 * @param token - The token to validate.
 * @returns The user ID associated with the token, or null if invalid.
 */
export function validateResetToken(token: string): number | null {
  const tokenData = passwordResetTokens.get(token);

  if (!tokenData) {
    return null;
  }

  // Check if the token has expired
  if (tokenData.expiresAt < new Date()) {
    passwordResetTokens.delete(token); // Clean up expired token
    return null;
  }

  return tokenData.userId;
}

/**
 * Deletes a password reset token after use.
 * @param token - The token to delete.
 */
export function deleteResetToken(token: string): void {
  passwordResetTokens.delete(token);
}

// --- JWT Authentication Token ---

/**
 * Generates a JWT authentication token.
 * @param payload - The data to include in the token.
 * @returns The generated JWT.
 */
export function generateAuthToken(payload: string | object | Buffer): string {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verifies a JWT authentication token.
 * @param token - The token to verify.
 * @returns The decoded token payload, or null if invalid.
 */
export function verifyAuthToken(token: string): string | jwt.JwtPayload | null {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    return null;
  }
}
