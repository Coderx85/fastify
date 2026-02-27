import { afterAll, assert, beforeAll, describe, it, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import { ISuccessResponse, TErrorResponse } from "@/types/api";
import { userSample as newUser } from "@test/user-sample";
import { IAuthUserDTO } from "@/dtos/auth.dto";
import { CreateUserInput } from "@/types/user.definition";

type SignUpSuccessResponse = ISuccessResponse<IAuthUserDTO>;
type SignUpErrorResponse = TErrorResponse;

///// Mock userService for registration
const { mockCreateUser } = vi.hoisted(() => ({
  mockCreateUser: vi.fn(),
}));

vi.mock("@/modules/user.service", () => ({
  userService: {
    createUser: mockCreateUser,
  },
}));

///// Test suite for Register Route

/**
 *  This test suite is a placeholder for testing the Register Route.
 */
describe("Register Route", async () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    const { default: registerRoute } = await import("./index");
    const { serializerCompiler, validatorCompiler } =
      await import("fastify-type-provider-zod");
    app = Fastify({ logger: false });
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(registerRoute, { prefix: "/api/auth/register" });
    await app.ready();

    // Mock the createUser method to return the newUser
    mockCreateUser.mockResolvedValue(newUser);
  });

  it("Should new user successfully", async () => {
    // Arrange
    const validUserData: CreateUserInput = {
      email: "test@example.com",
      name: "Test User",
      password: "testpassword",
      contact: "1234567890",
    };

    // Act
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: validUserData,
    });

    // Assert
    assert.equal(res.statusCode, 201);
    const body = res.json<SignUpSuccessResponse>();
    assert.ok(body.data);
    assert.equal(body.ok, true);
    assert.equal(body.data.user.email, validUserData.email);
    assert.equal(body.data.user.name, validUserData.name);
  });

  afterAll(async () => {
    // Cleanup if necessary
    if (app) {
      await app.close();
    }
  });
});
