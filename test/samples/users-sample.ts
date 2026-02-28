import { IUser } from "@/modules/users/user.definition";

export const userSample: IUser = {
  id: 1,
  email: "test@example.com",
  name: "Test User",
  password: "hashedpassword",
  contact: "1234567890",
  createdAt: new Date(),
  updatedAt: null,
};
