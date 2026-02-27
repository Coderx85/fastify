import { db } from "@/db";
import { usersTable } from "@/db/schema";
import type {
  CreateUserInput,
  IUser,
  IUserService,
  UpdateUserInput,
} from "@/types/user.definition";
import { eq, and } from "drizzle-orm";

class UserService implements IUserService {
  private async findUser(
    password: string,
    email?: string,
    contact?: string,
  ): Promise<IUser | null> {
    if (!email && !contact) {
      throw new Error("Either email or contact must be provided");
    }
    const findArray = email
      ? eq(usersTable.email, email)
      : eq(usersTable.contact, contact!);

    const [user] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.password, password), findArray));

    if (!user) {
      return null;
    }
    return user;
  }

  async getUserById(id: number): Promise<IUser | null> {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));

    if (!user) {
      return null;
    }

    return user;
  }

  async findByEmail(email: string, password: string): Promise<IUser> {
    const user = await this.findUser(password, email);

    if (!user || user === null) {
      throw new Error("User not found");
    }

    return user;
  }

  async findByContact(contact: string, password: string): Promise<IUser> {
    const user = await this.findUser(password, undefined, contact);

    if (!user || user === null) {
      throw new Error("User not found");
    }

    return user;
  }

  async createUser(data: CreateUserInput): Promise<IUser> {
    const [result] = await db.insert(usersTable).values(data).returning();

    if (!result) {
      throw new Error("Failed to create user");
    }
    return result;
  }

  async updateUser(id: number, data: UpdateUserInput): Promise<IUser | null> {
    const [result] = await db
      .update(usersTable)
      .set(data)
      .where(eq(usersTable.id, id))
      .returning();

    return result || null;
  }
}

export const userService = new UserService();
