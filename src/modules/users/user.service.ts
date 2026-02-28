import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { hashPassword } from "@/lib";
import type {
  CreateUserInput,
  IUser,
  IUserService,
  UpdateUserInput,
} from "@/modules/users/user.definition";
import { eq, and } from "drizzle-orm";

/**
 * Custom error for duplicate user (unique constraint violation)
 */
export class DuplicateUserError extends Error {
  public readonly code = "23505";

  constructor(email: string, contact?: string) {
    super(
      `User with email ${email.replace(/^\\?["']|\\?["']$/g, "").trim()} or contact ${contact} already exists`,
    );
    this.name = "DuplicateUserError";
    Object.setPrototypeOf(this, DuplicateUserError.prototype);
  }
}

/**
 * Custom error for database operations
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "DatabaseError";
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

class UserService implements IUserService {
  private async findUser(email: string): Promise<IUser | null> {
    try {
      // helper used internally; always limit to a single row
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      // Drizzle returns undefined when no rows are found
      return user || null;
    } catch (error) {
      throw new Error("Error finding user");
    }
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

  async findByEmail(email: string): Promise<IUser | null> {
    // reuse the private helper so the logic is consistent
    try {
      return await this.findUser(email);
    } catch (error) {
      // pass along the error as-is; higher layers decide how to respond
      throw error;
    }
  }

  // async findByContact(contact: string, password: string): Promise<IUser> {
  //   const user = await this.findUser(password, undefined, contact);

  //   if (!user || user === null) {
  //     throw new Error("User not found");
  //   }

  //   return user;
  // }

  async createUser(data: CreateUserInput): Promise<IUser> {
    try {
      const [result] = await db.insert(usersTable).values(data).returning();

      return result;
    } catch (error: any) {
      // Check for PostgreSQL unique-constraint violation
      // The error code can be at error.code or error.cause.code (for DrizzleQueryError)
      const errorCode = error.code || error.cause?.code;

      if (errorCode === "23505") {
        throw new DuplicateUserError(data.email, data.contact?.toString());
      }

      // Other database errors
      if (errorCode) {
        console.error("Database error:", error);
        throw new DatabaseError(`Database error: ${error.message}`, errorCode);
      }

      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
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
