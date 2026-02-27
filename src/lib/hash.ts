import * as bcrpyt from "bcrypt";

export const hashPassword = (password: string): string => {
  const saltRounds = bcrpyt.genSaltSync();
  const hash = bcrpyt.hashSync(password, saltRounds);
  return hash.toString();
};

export const verifyPassword = (password: string, hash: string): boolean =>
  bcrpyt.compareSync(password, hash);
