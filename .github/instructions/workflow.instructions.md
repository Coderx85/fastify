# Workflow Instructions

This file contains instructions for the workflow. It uses markdown with a YAML front matter header that only supports a limited set of attributes and values. Do not suggest any other properties: name, description, applyTo.

## Module Implementation Workflow

**Module** - A module is a self-contained unit of functionality that encapsulates a specific set of related features or services within an application.

- It is independent and reusable.

### Steps to implement a module:

- [STEP 1: Create a Module Folder](#step-1-create-a-module-folder)
- [STEP 2: Start with the Test the Service Scripts](#step-2-start-with-the-test-the-service-scripts--start-with-the-service-test-implementation-file)
- [STEP 3: Focus On the Definition](#step-3-focus-on-the-definition)
- [STEP 4: Implement the Service Logic](#step-4-implement-the-service-logic)
- [STEP 5: Repeat the Process for Other Services in the module](#step-5-repeat-the-process-for-other-services-in-the-module)

Note:

1. Some modules may require shared services or utilities, but the core business logic of the module should be self-contained and not rely on other modules in the application.
2. Take pause after each step and wait for the user approval before moving to the next step. After gathering all necessary information and understanding the requirements from the user, proceed with implementation.

### Step 1: Create a Module Folder

- Make a folder in the [`modules`](../../src/modules) directory with a name of the service being implemented.
- Example: `modules/users/user.spec.ts`, `modules/products/product.service.ts`, `modules/orders/order.dto.ts`, `modules/auth/auth.definition.ts`.
- All the business logic related to the service should be implemented in this folder.
- The module folder is independent and should not have any dependencies on other modules in the application. It should be self-contained and reusable.
- It is independent of whether the service is a REST API or a GraphQL API and their respective naming conventions.
- The folder should contain the following files:
  - `*.spec.ts`: This file should contain the unit tests for the service.
  - `*.service.ts`: This file should contain the service implementation.
  - `*.dto.ts`: This file should contain the data transfer objects (DTOs) for the service.
  - `*.definition.ts`: This file should contain the GraphQL schema definitions for the service.
  - `index.ts`: This file should export all the necessary components of the service for easy import in other parts of the application.
- Wait for the user approval after creating the module folder and the necessary files before moving to the next step.

### Step 2: Start with the Test the Service Scripts ( start with the service test implementation file)

`Disuss with the user about the first service to be implemented in the module and gather all necessary information about the service requirements, expected behavior, and edge cases to be covered in the tests.
`

- Start by implementing the unit tests for the service in the `*.spec.ts` file.

- Note: `Discuss with the user about the expected input and output of the service methods, and three edge cases that should be included in the tests to ensure the robustness of the service implementation.`

- Use a testing framework like Vitest to write the tests.
- Include atleast 3 edge cases in the tests to ensure the robustness of the service.
- ``
- Once the tests are implemented, run them to ensure they fail (since the service is not implemented yet).
- Create a temporary `*.service.ts` file with a dummy implementation to make the tests pass.
- For making sample values in the tests, makea file in the `tests` directory with the name of the service and export the constant values from there.

#### Example of a test file structure:

- `order.spec.ts`: Import the necessary testing functions and the service being tested. Write unit tests for the service methods, including edge cases to ensure the robustness of the implementation. Use mock data from a test helper file to simulate different scenarios and validate the expected outcomes.

  ```typescript
  //src/modules/orders/order.spec.ts
  import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
  // Import the service being tested
  import { OrderService } from "./order.service";

  // Import the necessary definitions and mock data for testing
  import {
    OrderValidationError,
    OrderNotFoundError,
    InvalidProductError,
    InsufficientAddressError,
    IOrderDTO,
    orderCreatedDate,
  } from "./order.definition";

  // Import mock data for testing
  import {
    mockOrderWithValidProducts,
    mockOrderWithSingleProduct,
    mockOrderWithManyProducts,
    mockOrderWithLargeQuantity,
    mockOrderWithoutProducts,
    mockOrderWithNegativeQuantity,
    mockOrderWithZeroQuantity,
    mockOrderRazorpay,
    mockOrderPolar,
    mockOrderWithInvalidProduct,
    mockBillingAddress,
    mockAddressResponse,
    createOrderPayload,
  } from "@test/order.test-helper";
  ```

- mock the other modules that the service depends on, such as the database module, to isolate the tests and focus on the service logic.

  ```ts
  // Mock database module
  vi.mock("@/db", () => ({
    dbPool: {
      transaction: vi.fn(),
    },
    db: {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      values: vi.fn().mockReturnThis(),
    },
  }));
  ```

- Write the unit tests for the service methods, including edge cases to ensure the robustness of the implementation. Use mock data from a test helper file to simulate different scenarios and validate the expected outcomes.

  ```ts
  describe("OrderService", () => {
    let orderService: OrderService;

    beforeEach(() => {
      orderService = new OrderService();
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    // Write unit tests for the service methods here
  });
  ```

- Once the tests are implemented, run them to ensure they fail (since the service is not implemented yet). This will help you identify any issues with the test implementation and ensure that the tests are correctly validating the expected outcomes.

- Create a temporary `*.service.ts` file with a dummy implementation to make the tests pass. This will allow you to verify that the tests are correctly identifying the expected outcomes and that the service implementation is on the right track.

- The dummy implementation should be simple and only return the necessary values to make the tests pass. It does not need to include the actual business logic of the service at this stage, as the focus is on ensuring that the tests are correctly validating the expected outcomes.

  ```ts
  // Main test suite for OrderService
  describe("OrderService", () => {
    ... // Previous code

    describe("Service One", () => {
      it("Success scenario", async () => {
        const orderDTO: IOrderDTO = {
          ...createOrderPayload,
        };

        // Service one - orderService.createOrder
        const result = await orderService.createOrder(orderDTO);

        expect(result).toHaveProperty("id");
        expect(result).toMatchObject({
          ...orderDTO,
          createdAt: expect.any(Date),
        });
      })

      // Edge case 1: Invalid product for order creation
      it("Edge case 1: Invalid product", async () => {
        const orderDTO: IOrderDTO = {
          ...createOrderPayload,
          products: [
            {
              productId: "invalid_product_id",
              quantity: 1,
            },
          ],
        };

        await expect(orderService.createOrder(orderDTO)).rejects.toThrow(
          InvalidProductError
        );
      });

      // Edge case 2: Insufficient address for order creation
      it("Edge case 2: Insufficient address", async () => {
        const orderDTO: IOrderDTO = {
          ...createOrderPayload,
          billingAddress: {
            ...mockBillingAddress,
            city: "", // Invalid city to trigger insufficient address error
          },
        };
        await expect(orderService.createOrder(orderDTO)).rejects.toThrow(
          InsufficientAddressError
        );
      })

      // Edge case 3: Order creation with large quantity
      it("Edge case 3: Order creation with large quantity", async () => {
        const orderDTO: IOrderDTO = {
          ...createOrderPayload,
          products: [{
            productId: "valid_product_id",
            quantity: 1000, // Large quantity to test edge case
          }],
        };
        const result = await orderService.createOrder(orderDTO);
        expect(result).toHaveProperty("id");
        expect(result).toMatchObject({
          ...orderDTO,
          createdAt: expect.any(Date),
        });
      })
    })

  })
  ```

- The tests should cover various scenarios, including successful cases and edge cases, to ensure that the service implementation is robust and can handle different situations effectively.

- Make sure to include the sample values for the tests in a separate test helper file in the [`tests`](../../test/) directory like the [`*/*.test-helper.ts` or `*/*.constant-test.ts`](../../test/order.test-helper.ts). This will help keep the test files clean and organized, and allow for easy maintenance of the test data.

### Step 3: Focus On the Definition

- Implement the common logic and definitions in the `*.definition.ts` file.
- The file should contain a interface that defines the class structure of the service and its methods.
- The file

  ```typescript
  //src/modules/orders/order.definition.ts
  const orderCreatedDate = new Date();

  interface IOrder {
    id: string;
    products: {
      productId: string;
      quantity: number;
    }[];
    billingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    createdAt: Date;
  }

  // Data Transfer Object (DTO) for creating/updating an order
  interface IOrderDTO {
    orderId?: string; // Optional for creation, required for updates
    products: {
      productId: string;
      quantity: number;
    }[];
  }

  interface IOrderService {
    createOrder(orderDTO: IOrderDTO): Promise<IOrder>;
    getOrderById(orderId: string): Promise<IOrder>;
    updateOrder(orderId: string, orderDTO: IOrderDTO): Promise<IOrder>;
    deleteOrder(orderId: string): Promise<void>;
  }
  ```

- The `*.definition.ts` file should also include any custom error classes that are relevant to the service, such as validation errors or not found errors. This will help keep the error handling logic organized and consistent across the service implementation.

- For example, you can define custom error classes for the order service like this:
  ```ts
  class OrderValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "OrderValidationError";
    }
  }
  ```

### Step 4: Implement the Service Logic

- After the tests are implemented and the definitions are in place, you can start implementing the actual business logic of the service in the `*.service.ts` file.
- Implement one service at a time, starting with the first service that was discussed and tested in the previous steps.
- Wait for the user approval after implementing each service before moving on to the next one, to ensure that the implementation is on the right track and meets the requirements.
- The service implementation should follow the structure defined in the `*.definition.ts` file and should include the necessary logic to handle the operations defined in the service interface.
- The implementation should also include proper error handling using the custom error classes defined in the `*.definition.ts` file to ensure that any issues or edge cases are properly handled and communicated to the caller.

### Step 5: Repeat the Process for Other Services in the module

- If there are multiple services to be implemented within the same module, repeat the process for each service, starting with the test implementation, discussed in the [Step 2](#step-2-start-with-the-test-the-service-scripts--start-with-the-service-test-implementation-file), and then moving on to the definitions and service logic implementation.

- This iterative process of starting with the tests, defining the necessary structures and logic, and then implementing the service will help ensure that the implementation is robust, well-tested, and follows a clear structure that is easy to maintain and understand.

## API Implementation Workflow

- Making the API implementation using Test Driven Development (TDD) approach, starting with the API route tests, then defining the necessary structures and logic in the module, and finally implementing the API route handlers.
- Use module & service in the API implementation, where the module contains the business logic and the service contains the API route handlers that interact with the module to perform the necessary operations.

### Step 1: Implement the API Endpoints

1. Make a folder in the [`routes`](../../src/routes) directory with a name of the service being implemented.
2. The folder should contain the following files:
   - `index.ts`: This file should define the API routes and handlers for the service.
   - `handler.ts`: This file should contain the logic for handling the API requests and responses.
   - `index.spec.ts`: This file should contain the unit tests for the API endpoints.
3. Make a folder in the [`schemas`](../../src/schema/) directory with the name of the service being implemented.
4. The folder should contain the following files:
   - `*.schema.ts`: This file should contain the schema definitions for the API endpoints, such as request and response schemas.
5. _File Structure Example_:

```
routes/
└── users/
    ├── index.ts - (API route definitions)
    ├── index.spec.ts (API route tests)
    └── handler.ts (API route handlers)
schemas/
└── users.schema.ts - (schema definitions for the api endpoints)
```

### Step 2: Implement the API Route Test Scripts

1. Ask the user about the API endpoints to be implemented for the service, and gather all necessary information about the expected behavior, input and output of the API endpoints, and edge cases to be covered in the tests.
1. Start by implementing the unit tests for the API endpoints in the `index.spec.ts` file and basic `index.ts` file for the service. Focus on one endponit at a time, starting with the first endpoint that was discussed and gather all necessary information about it.
1. Mocke the service from the module in the API route tests to isolate the tests.
1. Make a temporary `handler.ts` and `schema.ts` files with a dummy implementation to make the tests pass and for schema validation.
1. Make sure to include edge cases in the tests to ensure the robustness of the API implementation (min 3 edge cases in all routes).
1. After implementing the tests, ask the user to review the tests and provide feedback before moving on to the next step of implementing the API route logic.

### Step 3: Implement the API Route Logic

1. After the tests are implemented, start implementing the controller class implementation in the `modules/*/*.definition.ts` file and request and responce schema.
2. Discuss with the user about the expected behavior and logic of the API endpoints, and gather all necessary information to implement the controller class according to the structure defined in the `*.definition.ts` file of the module and the schema validation in the `schemas/*/*.schema.ts` file.
3. The controller class should define the methods for handling the API requests and responses, and should be implemented according to the structure defined in the `*.definition.ts` file of the module.
4. The schema validation should contain an input schema for request validation and an output schema for response validation, and a combined schema for the API route handler to use for validating the requests and responses with different status codes.
5. Example of a controller class definition in the `*.definition.ts` file of the module:

```typescript
//src/modules/*/*.definition.ts for the routes/*/handler.ts
export interface IOrderController {
  createOrderHandler(
    request: FastifyRequest<{ Body: IOrderInput }>,
    reply: FastifyReply,
  ): Promise<void>;

  getOrderByIdHandler(
    request: FastifyRequest<{ Params: { orderId: number } }>,
    reply: FastifyReply,
  ): Promise<void>;
}
```

6. Example of schema validation in the `schemas/*/*.schema.ts` file:

```typescript
//src/schemas/*/*.schema.ts
Example: import { z } from "zod";

// Define the input schema for the API request
const inputSchema = z.object({
  userId: z.string(),
});

// Define the output schema for the API response
const outputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

// Error response schema
const errorResponseSchema = z.object({
  message: z.string(),
  code: z.string(),
});

// Export the schemas for use in the API route handlers
const getUserByIdSchema = {
  params: inputSchema,
  response: {
    200: outputSchema,
    400: errorResponseSchema,
    404: errorResponseSchema,
  },
};
```

7. After implementing the controller class and schema validation, ask the user to review the implementation and provide feedback before moving on to the next step of implementing the API route handlers.
8. If the user has any feedback or suggestions for improvement, make the necessary adjustments to the implementation to ensure that it meets the requirements and expectations for the API endpoints. and repeat the previous steps until the implementation is complete and meets the requirements.
9. Once the implementation of the controller class and schema validation is complete and approved by the user, you can proceed to implement the API route handlers in the next step.

### Step 4: Implement the API Route Handlers and organise the index.ts file (that defines the API routes and handlers for the service)

1. Finally, implement the API route handlers in the `routes/*/handler.ts` file using the controller methods defined in the module and the schema validation defined in the `schemas/*/*.schema.ts` file.
2. Focus on the first endpoint that was discussed and tested in the previous steps, and implement the API route handler for that endpoint first before moving on to the next endpoint.
3. The API route handler should use the controller methods to implement the main logic of the endpoint, and should also include proper error handling to ensure that any issues or edge cases are properly handled and communicated to the caller.
4. Use try-catch blocks to handle any potential errors that may occur during the execution of the API route handler, and return appropriate error responses based on the type of error encountered. And use the [`sendSuccess`](../../src/lib/response.ts) and [`sendError`](../../src/lib/response.ts) helper functions to send the API responses in a consistent format.
5. After implementing the API route handler for the first endpoint, ask the user to review the implementation and provide feedback before moving on to the next endpoint.
6. Example of an API route handler implementation in the `routes/*/handler.ts` file using the controller methods defined in the module and the schema validation defined in the `schemas/*/*.schema.ts` file:

```typescript
//src/routes/*/handler.ts
import { IOrderController } from "@/modules/orders/order.definition";

class OrderController implements IOrderController {
  async createOrderHandler(
    request: FastifyRequest<{ Body: IOrderInput }>,
    reply: FastifyReply,
  ): Promise<void> {
    // Implement the logic for handling the create order API request
  }

  async getOrderByIdHandler(
    request: FastifyRequest<{ Params: { orderId: number } }>,
    reply: FastifyReply,
  ): Promise<void> {
    // Implement the logic for handling the get order by ID API request
  }
}

export const orderController = new OrderController();
```

2. Implement the `index.ts` file in the `routes/*/` directory to define the API routes and handlers for the service.

```typescript
//src/routes/*/index.ts
import { FastifyInstance } from "fastify";
import { orderController } from "./handler";
import { getOrderByIdSchema } from "@/schemas/orders/order.schema";
import { ZodTypeProvider } from "fastify-type-provider-zod";

export default async function orderRoutes(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().get("/orders/:orderId", {
    schema: getOrderByIdSchema,
    handler: orderController.getOrderByIdHandler,
  });
}
```

7. After implementing the API route handlers and organizing the `index.ts` file, ask the user to review the implementation and provide feedback before moving on to the next step of retesting the API endpoints.

### Step 5: Retest the API Endpoints

1. After implementing the API route handlers, run the tests in the `index.spec.ts` file to ensure that all tests pass successfully.
2. If any tests fail, debug the implementation and make necessary adjustments to ensure that all tests pass and the API endpoints are functioning as expected.
3. Once all tests pass, the API implementation for the service is complete and can be integrated with the rest of the application.
4. Repeat the process for other API endpoints in the same module or for other modules as needed, following the same workflow of starting with tests, defining the necessary structures and logic, and then implementing the API route handlers.

## Conclusion

- This workflow provides a structured approach to implementing modules and API endpoints in a Fastify application using Test Driven Development (TDD) principles.
- By starting with tests, defining the necessary structures and logic, and then implementing the service and API route handlers, you can ensure that the implementation is robust, well-tested, and follows a clear structure that is easy to maintain and understand.
- Remember to take pauses after each step and wait for user approval before moving to the next step, and to include edge cases in the tests to ensure the robustness of the implementation.
