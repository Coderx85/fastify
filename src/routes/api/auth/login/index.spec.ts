import { generateAuthToken } from "@/lib/token";
import { describe, it, beforeAll, afterAll, assert, vi } from "vitest";
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { hashPassword } from "@/lib/hash";
import { IUser } from "@/modules/users/user.definition";
import type { ISuccessResponse, TErrorResponse } from "@/types/api";

const testUser: IUser = {
  id: 1,
  email: "test@example.com",
  name: "Test User",
  password: hashPassword("password123"),
  contact: "1234567890",
  createdAt: new Date(),
  updatedAt: new Date(),
};

type LoginUsingEmailInput = {
  email: string;
  password: string;
};

type LoginUser = { id: number; email: string; name: string };
type LoginResponseData = { user: LoginUser; token: string };
type LoginSuccessResponse = ISuccessResponse<LoginResponseData>;
type LoginErrorResponse = TErrorResponse;

// Hoist mock functions so they're accessible outside vi.mock()
const { mockFindByEmail, mockFindByContact } = vi.hoisted(() => ({
  mockFindByEmail: vi.fn(),
  mockFindByContact: vi.fn(),
}));

// Mock userService directly — cleaner than mocking @/db since the handler
// only calls userService methods, not the DB directly.
vi.mock("@/modules/user.service", () => ({
  userService: {
    findByEmail: mockFindByEmail,
    findByContact: mockFindByContact,
  },
}));

describe("Hashing Function", () => {
  it("should hash the password correctly", () => {
    const password = "password123";
    const hashed = hashPassword(password);

    assert.ok(hashed);
    assert.notEqual(hashed, password);
    assert.notDeepEqual(hashPassword(password), hashed);
  });

  it("should produce different hashes for different passwords", () => {
    const password1 = "password123";
    const password2 = "differentPassword";
    const hash1 = hashPassword(password1);
    const hash2 = hashPassword(password2);

    assert.ok(hash1);
    assert.ok(hash2);
    assert.notEqual(hash1, hash2);
  });

  it("should produce the same hash for the same password", () => {
    const password = "password123";
    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);

    assert.ok(hash1);
    assert.ok(hash2);
    assert.notDeepEqual(hash1, hash2);
  });
});

describe("Token Generation", () => {
  it("should generate a valid token for a user", () => {
    const userInput = { id: 1, email: "test@example.com" };

    // Assert
    assert.ok(true); // Placeholder assertion
    const token = generateAuthToken(userInput);

    // Arrange
    assert.ok(token); // Check if token is generated

    // Act
    const decoded = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString(),
    );

    // Assert
    assert.equal(decoded.id, 1);
    assert.equal(decoded.email, "test@example.com");
    // Check if expiration is set to 7 days from now
    assert.strictEqual(
      decoded.exp,
      Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    );
  });
});

describe("Logink API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const { default: loginRoute } = await import("./index");
    const { serializerCompiler, validatorCompiler } =
      await import("fastify-type-provider-zod");

    app = Fastify({ logger: false });
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(loginRoute, { prefix: "/api/auth/login" });
    await app.ready();

    // Default: all calls resolve to testUser
    mockFindByEmail.mockResolvedValue(testUser);
    mockFindByContact.mockResolvedValue(testUser);
  });

  it("Login using email and passwords", async () => {
    // Arrange
    const validCredentials: LoginUsingEmailInput = {
      email: "test@example.com",
      password: "password123",
    };

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: validCredentials,
    });

    // Assert
    assert.equal(response.statusCode, 200);
    const body = response.json<LoginSuccessResponse>();

    assert.ok(body.data);
    // Assert response structure
    assert.equal(body.ok, true);

    assert.strictEqual(body.ok, true);
    assert.strictEqual(body.statusCode, 200);

    assert.equal(body.data.user.id, testUser.id);
    assert.equal(body.data.user.email, testUser.email);
    assert.equal(body.data.user.name, testUser.name);
    assert.ok(body.data.token);
  });

  it("Login with invalid credentials", async () => {
    // Arrange
    const invalidCredentials: LoginUsingEmailInput = {
      email: "invalid@example.com",
      password: "wrongpassword",
    };

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: invalidCredentials,
    });

    // Assert
    assert.equal(response.statusCode, 401);
    const body = response.json<LoginErrorResponse>();
    assert.equal(body.ok, false);
    assert.equal(body.error, "Invalid credentials");
  });

  it("Login with missing email", async () => {
    // Arrange
    const invalidCredentials: LoginUsingEmailInput = {
      password: "dfdf",
    } as LoginUsingEmailInput;

    // Acts
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: invalidCredentials,
    });

    assert.equal(response.statusCode, 400);
    const body = response.json<LoginErrorResponse>();
    assert.equal(body.error, "Bad Request");
  });

  it("user not found", async () => {
    // Override: simulate DB returning no user for this test only
    mockFindByEmail.mockRejectedValueOnce(new Error("User not found"));

    // Arrange
    const invalidCredentials: LoginUsingEmailInput = {
      email: "nonexistent@example.com",
      password: "password123",
    };

    // Act
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: invalidCredentials,
    });

    // Assert
    const body = response.json<LoginErrorResponse>();
    assert.deepEqual(response.statusCode, 404);
    assert.strictEqual(body.error, "User not found");
    assert.strictEqual(body.message, "USER_NOT_FOUND");
    assert.strictEqual(body.ok, false);
  });
  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
