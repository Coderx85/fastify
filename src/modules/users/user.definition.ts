import { TUser, userSelectScehema, TUserInsert } from "@/db/schema";
import { FastifyReply } from "fastify/types/reply";
import { FastifyRequest } from "fastify/types/request";

export interface IUser extends TUser {}

export type CreateUserInput = TUserInsert;

export type UpdateUserInput = Partial<CreateUserInput>;

export interface IUserService {
  /**
   * Returns a user record by email, or null if none exists.
   * Password verification is performed by the caller (e.g. auth handler).
   */
  findByEmail(email: string): Promise<IUser | null>;
  // findByContact(contact: string, password: string): Promise<IUser>;
  getUserById(id: number): Promise<IUser | null>;
  createUser(data: CreateUserInput): Promise<IUser>;
  updateUser(id: number, data: UpdateUserInput): Promise<IUser | null>;
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
  updateUserHandler(
    request: FastifyRequest<{
      Params: { userId: number };
      Body: UpdateUserInput;
    }>,
    reply: FastifyReply,
  ): Promise<void>;
}
