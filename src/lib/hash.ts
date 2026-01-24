export const hashPassword = (password: string): string =>
  Buffer.from(password).toString("base64");
export const verifyPassword = (password: string, hash: string): boolean =>
  hashPassword(password) === hash;
