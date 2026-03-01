import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { createIdInNumber, generateUUID } from "@/lib/uuid";
import type {
  CreateUserInput,
  IUser,
  IUserService,
  SafeUser,
  UpdateUserInput,
} from "@/modules/users/user.definition";
import { eq, sql } from "drizzle-orm";

/**
 * Custom error for duplicate user (unique constraint violation)
 */
export class DuplicateUserError extends Error {
  public readonly code = "23505";

  constructor(email: string, contact?: string) {
    super(
      `User with email ${email.replace(
        /^\\?["']|\\?["']$/g,
        "",
      )} or contact ${contact} already exists`,
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

// Define columns to be returned for user queries, excluding password
const selectedColumns = {
  id: usersTable.id,
  name: usersTable.name,
  email: usersTable.email,
  contact: usersTable.contact,
  createdAt: usersTable.createdAt,
  updatedAt: usersTable.updatedAt,
};

// Prepared statement for getting a user by ID
const getUserByIdStatement = db
  .select(selectedColumns)
  .from(usersTable)
  .where(eq(usersTable.id, sql.placeholder("id")))
  .prepare("get_user_by_id");

// Prepared statement for getting a user by email
const getUserByEmailStatement = db
  .select(selectedColumns)
  .from(usersTable)
  .where(eq(usersTable.email, sql.placeholder("email")))
  .prepare("get_user_by_email");

// Prepared statement for getting a user by email for auth (includes password)
const getUserForAuthStatement = db
  .select()
  .from(usersTable)
  .where(eq(usersTable.email, sql.placeholder("email")))
  .prepare("get_user_for_auth");

class UserService implements IUserService {
  async getUserById(id: number): Promise<SafeUser | null> {
    try {
      const [user] = await getUserByIdStatement.execute({ id });

      if (!user) {
        throw new Error(`User with ID ${id} not found`, {
          cause: { code: "USER_NOT_FOUND" },
        });
      }

      return user;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      throw new DatabaseError(
        "Error finding user",
        (error as any)?.cause?.code,
      );
    }
  }

  async findByEmail(email: string): Promise<SafeUser | null> {
    try {
      const [user] = await getUserByEmailStatement.execute({ email });
      return user || null;
    } catch (error) {
      console.error("Error finding user by email:", error);
      throw error;
    }
  }

  async findUserForAuth(email: string): Promise<IUser | null> {
    try {
      const [user] = await getUserForAuthStatement.execute({ email });
      return user || null;
    } catch (error) {
      console.error("Error finding user for auth by email:", error);
      throw error;
    }
  }

  async createUser(data: CreateUserInput): Promise<SafeUser> {
    try {
      const id: number = generateUUID();
      const [result] = await db
        .insert(usersTable)
        .values({
          id,
          name: data.name,
          email: data.email,
          password: data.password,
          contact: data.contact,
          createdAt: new Date(),
        })
        .returning(selectedColumns);

      return result;
    } catch (error: any) {
      const errorCode = error.code || error.cause?.code;

      if (errorCode === "23505") {
        throw new DuplicateUserError(data.email, data.contact?.toString());
      }

      if (errorCode) {
        console.error("Database error:", error);
        throw new DatabaseError(`Database error: ${error.message}`, errorCode);
      }

      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  }

  async updateUser(id: number, data: UpdateUserInput): Promise<SafeUser> {
    try {
      // Check if user exists before updating
      const existingUser = await this.getUserById(id);

      const timestamp = new Date();

      const [result] = await db
        .update(usersTable)
        .set({
          ...data,
          updatedAt: timestamp,
        })
        .where(eq(usersTable.id, id))
        .returning();

      console.log("Update result:", result);

      return result;
    } catch (error) {
      console.error("Error updating user:", error);
      // Preserve the cause code if it exists (e.g., USER_NOT_FOUND)
      throw new DatabaseError(
        "Failed to update user",
        (error as any)?.code || (error as any)?.cause?.code,
      );
    }
  }

  async getAllUsers(): Promise<IUser[]> {
    try {
      const users = await db.select(selectedColumns).from(usersTable);
      return users;
    } catch (error) {
      console.error("Error getting all users:", error);
      throw new DatabaseError("Failed to retrieve users");
    }
  }
}

export const userService = new UserService();
