type TUser = { id: number; email: string; password: string };
new Map<string, TUser>();
export const users: Map<string, TUser> = new Map<string, TUser>();

export const userState = {
  idCounter: 1,
};
