type TUser = { id: number; email: string; password: string };
export const users: Map<string, TUser> = new Map<string, TUser>();

export const userState = {
  idCounter: 1,
};

export type TPasswordResetToken = { userId: number; expiresAt: Date };
export const passwordResetTokens = new Map<string, TPasswordResetToken>();
