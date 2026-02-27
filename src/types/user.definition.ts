import { TUser, userSelectScehema, TUserInsert } from "@/db/schema";

export interface IUser extends TUser {}

export type CreateUserInput = TUserInsert;

export type UpdateUserInput = Partial<CreateUserInput>;

export interface IUserService {
  findByEmail(email: string, password: string): Promise<IUser>;
  findByContact(contact: string, password: string): Promise<IUser>;
  getUserById(id: number): Promise<IUser | null>;
  createUser(data: CreateUserInput): Promise<IUser>;
  updateUser(id: number, data: UpdateUserInput): Promise<IUser | null>;
}
