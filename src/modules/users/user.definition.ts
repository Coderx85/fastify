import { TUser, TUserInsert } from "@/db/schema";
import { FastifyReply } from "fastify/types/reply";
import { FastifyRequest } from "fastify/types/request";

export type SafeUser = Omit<TUser, "password">;
export interface IUser extends SafeUser {}

export type CreateUserInput = TUserInsert;

export type UpdateUserInput = Partial<CreateUserInput>;

export interface IUserService {
  /**
   * Returns a user record by email, or null if none exists.
   * This version is for general use and does not include the password.
   */
  findByEmail(email: string): Promise<SafeUser | null>;

  /**
   * Returns a user record by email including the password hash.
   * To be used only for authentication purposes.
   */
  findUserForAuth(email: string): Promise<IUser | null>;

  getUserById(id: number): Promise<SafeUser | null>;
  createUser(data: CreateUserInput): Promise<SafeUser>;
  updateUser(id: number, data: UpdateUserInput): Promise<SafeUser | null>;
  getAllUsers(): Promise<IUser[]>;
}

export interface IUserController {
  createUserHandler(
    request: FastifyRequest<{ Body: CreateUserInput }>,
    reply: FastifyReply,
  ): Promise<void>;
  getUserByIdHandler(
    request: FastifyRequest<{ Params: { userId: number } }>,
    reply: FastifyReply,
  ): Promise<void>;
  getOrderByUserIdHandler(
    request: FastifyRequest<{
      Params: { id: number };
      Querystring: { orderId: number };
    }>,
    reply: FastifyReply,
  ): Promise<void>;
  getAllUsersHandler(
    request: FastifyRequest<{
      Querystring: { email?: string };
    }>,
    reply: FastifyReply,
  ): Promise<void>;
  getUserByEmailHandler(
    request: FastifyRequest<{ Querystring: { email: string } }>,
    reply: FastifyReply,
  ): Promise<void>;
  updateUserHandler(
    request: FastifyRequest<{
      Params: { id: number };
      Body: UpdateUserInput;
    }>,
    reply: FastifyReply,
  ): Promise<void>;
}
