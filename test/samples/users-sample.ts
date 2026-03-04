import { TUser } from "@/db/schema";

export const userSample: TUser = {
  id: 1,
  email: "test@example.com",
  name: "Test User",
  password: "hashedpassword",
  contact: "1234567890",
  createdAt: new Date(),
  updatedAt: null,
};
