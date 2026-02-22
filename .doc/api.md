# API Documentation

This document provides a detailed walkthrough of the RESTful API endpoints for the Fastify application, intended for frontend development.

## Base URL

The base URL for all API endpoints is `http://localhost:3000/api`.

---

## 1. Authentication API

Handles user registration, login, and password management.

### Register a New User

- **Endpoint:** `POST /api/auth/register`
- **Description:** Creates a new user account.

#### Request Body

| Field      | Type     | Required | Description               |
| :--------- | :------- | :------- | :------------------------ |
| `name`     | `string` | Yes      | The user's full name.     |
| `email`    | `string` | Yes      | The user's email address. |
| `password` | `string` | Yes      | The user's password.      |

**Example Request:**

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

#### Responses

- **`201 Created`** - User registered successfully.
  **Example Response:**

  ```json
  {
    "ok": true,
    "statusCode": 201,
    "message": "User registered successfully",
    "data": {
      "id": 1,
      "email": "john.doe@example.com",
      "name": "John Doe"
    }
  }
  ```

- **`409 Conflict`** - A user with the given email already exists.
  **Example Response:**
  ```json
  {
    "ok": false,
    "statusCode": 409,
    "message": "User already exists",
    "error": "USER_EXISTS"
  }
  ```

---

### Login

- **Endpoint:** `POST /api/auth/login`
- **Description:** Authenticates a user and returns a JWT token.

#### Request Body

| Field      | Type     | Required | Description               |
| :--------- | :------- | :------- | :------------------------ |
| `email`    | `string` | Yes      | The user's email address. |
| `password` | `string` | Yes      | The user's password.      |

**Example Request:**

```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

#### Responses

- **`200 OK`** - Login successful.
  **Example Response:**

  ```json
  {
    "ok": true,
    "statusCode": 200,
    "message": "Login successful",
    "data": {
      "user": {
        "id": 1,
        "email": "john.doe@example.com",
        "name": "John Doe"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

- **`401 Unauthorized`** - Invalid credentials provided.
- **`404 Not Found`** - User not found.

---

### Forgot Password

- **Endpoint:** `POST /api/auth/forgot-password`
- **Description:** Initiates the password reset process. For security, it always returns a success message. In the backend, a reset token is generated and logged to the console for development purposes.

#### Request Body

| Field   | Type     | Required | Description               |
| :------ | :------- | :------- | :------------------------ |
| `email` | `string` | Yes      | The user's email address. |

**Example Request:**

```json
{
  "email": "john.doe@example.com"
}
```

#### Responses

- **`200 OK`** - Message sent successfully.
  **Example Response:**
  ```json
  {
    "ok": true,
    "statusCode": 200,
    "message": "MESSAGE SENT SUCCESSFULLY",
    "data": {
      "emailSent": true
    }
  }
  ```

---

### Reset Password

- **Endpoint:** `POST /api/auth/reset-password`
- **Description:** Resets the user's password using a valid reset token.

#### Request Body

| Field      | Type     | Required | Description                                |
| :--------- | :------- | :------- | :----------------------------------------- |
| `token`    | `string` | Yes      | The password reset token from the console. |
| `password` | `string` | Yes      | The new password (min 6 characters).       |

**Example Request:**

```json
{
  "token": "a1b2c3d4...",
  "password": "newPassword456"
}
```

#### Responses

- **`200 OK`** - Password reset successful.
  **Example Response:**

  ```json
  {
    "ok": true,
    "statusCode": 200,
    "message": "PASSWORD RESET SUCCESSFUL",
    "data": {
      "passwordReset": true
    }
  }
  ```

- **`401 Unauthorized`** - Invalid or expired token.

---

## 2. Books API

Manages operations related to books.

### Get All Books

- **Endpoint:** `GET /api/books`
- **Description:** Retrieves a list of all products categorized as "Books".

#### Responses

- **`200 OK`** - Successfully fetched the list of books.
  **Example Response:**
  ```json
  {
    "ok": true,
    "statusCode": 200,
    "message": "Books fetched successfully",
    "data": {
      "products": [
        {
          "id": 1,
          "name": "The Hitchhiker's Guide to the Galaxy",
          "description": "A science fiction comedy series by Douglas Adams.",
          "price": 1299,
          "category": "Books",
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  }
  ```

### Get Book by ID

- **Endpoint:** `GET /api/books/:bookId`
- **Description:** Retrieves a single book by its unique ID.

#### URL Parameters

| Parameter | Type     | Description                     |
| :-------- | :------- | :------------------------------ |
| `bookId`  | `number` | The ID of the book to retrieve. |

#### Responses

- **`200 OK`** - Successfully fetched the book.
- **`404 Not Found`** - No book found with the specified ID.

### Create a New Book

- **Endpoint:** `POST /api/books`
- **Description:** Adds a new book to the database. **Note:** This endpoint is intended for admin use, but an admin verification mechanism is not yet implemented.

#### Request Body

| Field         | Type     | Required | Description                                                        |
| :------------ | :------- | :------- | :----------------------------------------------------------------- |
| `name`        | `string` | Yes      | The title of the book.                                             |
| `description` | `string` | Yes      | A short summary of the book.                                       |
| `price`       | `number` | Yes      | The price of the book in the smallest currency unit (e.g., cents). |

**Example Request:**

```json
{
  "name": "The Lord of the Rings",
  "description": "An epic high-fantasy novel by J.R.R. Tolkien.",
  "price": 2500
}
```

#### Responses

- **`201 Created`** - The book was created successfully.

### Update a Book

- **Endpoint:** `PUT /api/books/:bookId`
- **Description:** Updates the details of an existing book. **Note:** This endpoint is intended for admin use, but an admin verification mechanism is not yet implemented.

#### URL Parameters

| Parameter | Type     | Description                   |
| :-------- | :------- | :---------------------------- |
| `bookId`  | `number` | The ID of the book to update. |

#### Request Body

The request body can contain one or more of the following fields:

| Field         | Type     | Optional | Description                  |
| :------------ | :------- | :------- | :--------------------------- |
| `name`        | `string` | Yes      | The new title of the book.   |
| `description` | `string` | Yes      | The new summary of the book. |
| `price`       | `number` | Yes      | The new price of the book.   |

#### Responses

- **`200 OK`** - The book was updated successfully.
- **`404 Not Found`** - No book found with the specified ID.

### Delete a Book

- **Endpoint:** `DELETE /api/books/:bookId`
- **Description:** Deletes a book from the database. **Note:** This endpoint is intended for admin use, but an admin verification mechanism is not yet implemented.

#### URL Parameters

| Parameter | Type     | Description                   |
| :-------- | :------- | :---------------------------- |
| `bookId`  | `number` | The ID of the book to delete. |

#### Responses

- **`200 OK`** - The book was deleted successfully.
  **Example Response:**
  ```json
  {
    "ok": true,
    "statusCode": 200,
    "message": "Book deleted successfully",
    "data": {
      "deleted": true,
      "productId": 42
    }
  }
  ```
- **`404 Not Found`** - No book found with the specified ID.

---

## 3. Checkout API

Handles the checkout process for a single SaaS product using the Polar SDK.

### Create Checkout Session (POST)

- **Endpoint:** `POST /api/checkout`
- **Description:** Creates a checkout session and returns the checkout URL.

#### Request Body

| Field    | Type     | Required | Description                                |
| :------- | :------- | :------- | :----------------------------------------- |
| `userId` | `string` | Yes      | Your internal user ID.                     |
| `email`  | `string` | Yes      | The customer's email (pre-fills checkout). |
| `name`   | `string` | Yes      | The customer's name (pre-fills checkout).  |

**Example Request:**

```json
{
  "userId": "user_123",
  "email": "customer@example.com",
  "name": "John Customer"
}
```

#### Responses

- **`200 OK`** - Checkout session created successfully.
  **Example Response:**
  ```json
  {
    "success": true,
    "checkoutUrl": "https://polar.sh/checkout/...",
    "checkoutId": "cs_123...",
    "expiresAt": "2024-01-01T01:00:00.000Z"
  }
  ```
- **`503 Service Unavailable`** - Polar SDK is not configured on the server.

### Create Checkout Session (GET)

- **Endpoint:** `GET /api/checkout`
- **Description:** Creates a checkout session and redirects the user to the Polar checkout page.

#### Query Parameters

| Parameter | Type     | Required | Description            |
| :-------- | :------- | :------- | :--------------------- |
| `userId`  | `string` | Yes      | Your internal user ID. |
| `email`   | `string` | Yes      | The customer's email.  |
| `name`    | `string` | Yes      | The customer's name.   |

#### Responses

- **`322 Redirect`** - Redirects to the Polar checkout page.
- **`400 Bad Request`** - Missing required query parameters.
- **`503 Service Unavailable`** - Polar SDK is not configured.

### Get Product Details

- **Endpoint:** `GET /api/checkout/product`
- **Description:** Retrieves the details of the configured SaaS product.

#### Responses

- **`200 OK`** - Successfully fetched product details.
  **Example Response:**
  ```json
  {
    "ok": true,
    "statusCode": 200,
    "message": "Product retrieved",
    "data": {
      "id": "prod_123...",
      "name": "My SaaS Product",
      "description": "The best SaaS product ever.",
      "price": 29.99,
      "priceCents": 2999,
      "currency": "usd",
      "isArchived": false
    }
  }
  ```
- **`503 Service Unavailable`** - Polar SDK is not configured.

---

## 4. Orders API

Manages all operations related to orders and their contents.

### Get All Orders

- **Endpoint:** `GET /api/orders`
- **Description:** Retrieves a list of all orders, with optional filtering and pagination.

#### Query Parameters

| Parameter | Type     | Optional | Description                                                 |
| :-------- | :------- | :------- | :---------------------------------------------------------- |
| `userId`  | `number` | Yes      | Filter orders by the user who placed them.                  |
| `status`  | `string` | Yes      | Filter orders by their status (e.g., 'pending', 'shipped'). |
| `limit`   | `number` | Yes      | The maximum number of orders to return (default: 10).       |
| `offset`  | `number` | Yes      | The number of orders to skip (for pagination).              |

#### Responses

- **`200 OK`** - Successfully fetched the list of orders.

### Create a New Order

- **Endpoint:** `POST /api/orders`
- **Description:** Creates a new order with one or more products.

#### Request Body

| Field             | Type             | Required         | Description                                                                                             |
| :---------------- | :--------------- | :--------------- | :------------------------------------------------------------------------------------------------------ |
| `userId`          | `number`         | Yes (or omitted) | The ID of the user placing the order. If not provided the server will extract it from the Bearer token. |
| `products`        | `Array<Product>` | Yes              | An array of products to include in the order.                                                           |
| `shippingAddress` | `string`         | No               | The shipping address for the order.                                                                     |
| `paymentMethod`   | `string`         | No               | The method of payment for the order.                                                                    |
| `notes`           | `string`         | No               | Any additional notes for the order.                                                                     |

**Product Object:**
| Field | Type | Required | Description |
| :---------- | :------- | :------- | :------------------------------ |
| `productId` | `number` | Yes | The ID of the product. |
| `quantity` | `number` | Yes | The quantity of the product. |

#### Responses

- **`201 Created`** - The order was created successfully.
- **`404 Not Found`** - A product in the order was not found.

### Get Order by ID

- **Endpoint:** `GET /api/orders/:orderId`
- **Description:** Retrieves a single order by its unique ID, including its associated products.

#### URL Parameters

| Parameter | Type     | Description                      |
| :-------- | :------- | :------------------------------- |
| `orderId` | `number` | The ID of the order to retrieve. |

#### Responses

- **`200 OK`** - Successfully fetched the order.
- **`404 Not Found`** - No order found with the specified ID.

### Update an Order

- **Endpoint:** `PUT /api/orders/:orderId`
- **Description:** Updates the details of an existing order.

#### URL Parameters

| Parameter | Type     | Description                    |
| :-------- | :------- | :----------------------------- |
| `orderId` | `number` | The ID of the order to update. |

#### Request Body

| Field             | Type     | Optional | Description                             |
| :---------------- | :------- | :------- | :-------------------------------------- |
| `status`          | `string` | Yes      | The new status of the order.            |
| `shippingAddress` | `string` | Yes      | The new shipping address for the order. |
| `paymentMethod`   | `string` | Yes      | The new payment method for the order.   |
| `notes`           | `string` | Yes      | Any new additional notes for the order. |

#### Responses

- **`200 OK`** - The order was updated successfully.
- **`404 Not Found`** - No order found with the specified ID.

### Delete an Order

- **Endpoint:** `DELETE /api/orders/:orderId`
- **Description:** Deletes an order from the database.

#### URL Parameters

| Parameter | Type     | Description                    |
| :-------- | :------- | :----------------------------- |
| `orderId` | `number` | The ID of the order to delete. |

#### Responses

- **`200 OK`** - The order was deleted successfully.
- **`404 Not Found`** - No order found with the specified ID.

### Add Product to Order

- **Endpoint:** `POST /api/orders/:orderId/products`
- **Description:** Adds a product to an existing order.

#### URL Parameters

| Parameter | Type     | Description                    |
| :-------- | :------- | :----------------------------- |
| `orderId` | `number` | The ID of the order to modify. |

#### Request Body

| Field       | Type     | Required | Description                   |
| :---------- | :------- | :------- | :---------------------------- |
| `productId` | `number` | Yes      | The ID of the product to add. |
| `quantity`  | `number` | Yes      | The quantity of the product.  |

#### Responses

- **`200 OK`** - The product was added successfully.
- **`404 Not Found`** - The order or product was not found.

### Remove Product from Order

- **Endpoint:** `DELETE /api/orders/:orderId/products/:productId`
- **Description:** Removes a product from an existing order.

#### URL Parameters

| Parameter   | Type     | Description                      |
| :---------- | :------- | :------------------------------- |
| `orderId`   | `number` | The ID of the order to modify.   |
| `productId` | `number` | The ID of the product to remove. |

#### Responses

- **`200 OK`** - The product was removed successfully.
- **`404 Not Found`** - The order or product was not found.

---

## 5. Payment API

Handles payment processing and related functionalities.

### Create Payment Intent

- **Endpoint:** `POST /api/payment/intent`
- **Description:** Creates a payment intent for an order, using either Polar or Razorpay as the payment provider.

#### Request Body

| Field      | Type                      | Required | Description                                        |
| :--------- | :------------------------ | :------- | :------------------------------------------------- |
| `orderId`  | `number`                  | Yes      | The ID of the order to create a payment for.       |
| `provider` | `'polar'` \| `'razorpay'` | No       | The payment provider to use (defaults to 'polar'). |

#### Responses

- **`201 Created`** (for Polar)
  **Example Response:**

  ```json
  {
    "ok": true,
    "statusCode": 201,
    "message": "Payment checkout created",
    "data": {
      "checkoutUrl": "https://polar.sh/checkout/...",
      "checkoutId": "cs_123..."
    }
  }
  ```

- **`201 Created`** (for Razorpay)
  **Example Response:**

  ```json
  {
    "ok": true,
    "statusCode": 201,
    "message": "Razorpay order created",
    "data": {
      "order": {
        "id": "order_...",
        "amount": 50000,
        "currency": "INR"
      },
      "keyId": "rzp_test_...",
      "internalOrderId": 123,
      "successUrl": "http://localhost:3000/checkout/success"
    }
  }
  ```

- **`400 Bad Request`** - If the order is not found or other validation fails.

### Payment Webhook (Stripe - Deprecated)

- **Endpoint:** `POST /api/payment/webhook`
- **Description:** This endpoint was previously used for Stripe webhooks and is now deprecated.

#### Responses

- **`410 Gone`** - Indicates that this endpoint is no longer supported.

---

## 6. Products API

Manages all operations related to products.

### Get All Products

- **Endpoint:** `GET /api/products`
- **Description:** Retrieves a list of all products, with an optional category filter.

#### Query Parameters

| Parameter  | Type     | Optional | Description                        |
| :--------- | :------- | :------- | :--------------------------------- |
| `category` | `string` | Yes      | Filter products by their category. |

#### Responses

- **`200 OK`** - Successfully fetched the list of products.
- **`404 Not Found`** - No products found for the specified category.

### Create a New Product

- **Endpoint:** `POST /api/products`
- **Description:** Adds a new product to the database. **Note:** This endpoint is intended for admin use, but an admin verification mechanism is not yet implemented.

#### Request Body

| Field         | Type     | Required | Description                  |
| :------------ | :------- | :------- | :--------------------------- |
| `name`        | `string` | Yes      | The name of the product.     |
| `description` | `string` | Yes      | A summary of the product.    |
| `price`       | `number` | Yes      | The price of the product.    |
| `category`    | `string` | Yes      | The category of the product. |

#### Responses

- **`201 Created`** - The product was created successfully.

### Get Product by ID

- **Endpoint:** `GET /api/products/:productId`
- **Description:** Retrieves a single product by its unique ID.

#### URL Parameters

| Parameter   | Type     | Description                        |
| :---------- | :------- | :--------------------------------- |
| `productId` | `number` | The ID of the product to retrieve. |

#### Responses

- **`200 OK`** - Successfully fetched the product.
- **`404 Not Found`** - No product found with the specified ID.

### Update a Product

- **Endpoint:** `PUT /api/products/:productId`
- **Description:** Updates the details of an existing product. **Note:** This endpoint is intended for admin use, but an admin verification mechanism is not yet implemented.

#### URL Parameters

| Parameter   | Type     | Description                      |
| :---------- | :------- | :------------------------------- |
| `productId` | `number` | The ID of the product to update. |

#### Request Body

The request body can contain one or more of the following fields:

| Field         | Type     | Optional | Description                      |
| :------------ | :------- | :------- | :------------------------------- |
| `name`        | `string` | Yes      | The new name of the product.     |
| `description` | `string` | Yes      | The new summary of the product.  |
| `price`       | `number` | Yes      | The new price of the product.    |
| `category`    | `string` | Yes      | The new category of the product. |

#### Responses

- **`200 OK`** - The product was updated successfully.
- **`404 Not Found`** - No product found with the specified ID.

### Delete a Product

- **Endpoint:** `DELETE /api/products/:productId`
- **Description:** Deletes a product from the database. **Note:** This endpoint is intended for admin use, but an admin verification mechanism is not yet implemented.

#### URL Parameters

| Parameter   | Type     | Description                      |
| :---------- | :------- | :------------------------------- |
| `productId` | `number` | The ID of the product to delete. |

#### Responses

- **`200 OK`** - The product was deleted successfully.
- **`404 Not Found`** - No product found with the specified ID.

---

## 7. Users API

Manages user-related operations.

### Get All Users

- **Endpoint:** `GET /api/users`
- **Description:** Retrieves a list of all users, or a single user if an email is provided as a query parameter. **Note:** This endpoint is intended for admin use, but an admin verification mechanism is not yet implemented.

#### Query Parameters

| Parameter | Type     | Optional | Description                    |
| :-------- | :------- | :------- | :----------------------------- |
| `email`   | `string` | Yes      | Filter the user list by email. |

#### Responses

- **`200 OK`** - Successfully fetched the list of users.

### Get User by ID

- **Endpoint:** `GET /api/users/:id`
- **Description:** Retrieves a single user by their unique ID. **Note:** This endpoint is intended for admin use, but an admin verification mechanism is not yet implemented.

#### URL Parameters

| Parameter | Type     | Description                     |
| :-------- | :------- | :------------------------------ |
| `id`      | `number` | The ID of the user to retrieve. |

#### Responses

- **`200 OK`** - Successfully fetched the user.
- **`404 Not Found`** - No user found with the specified ID.

### Create a New User

- **Endpoint:** `POST /api/users`
- **Description:** Creates a new user. Note that this is an alternative to the `/api/auth/register` endpoint.

#### Request Body

| Field      | Type     | Required | Description           |
| :--------- | :------- | :------- | :-------------------- |
| `name`     | `string` | Yes      | The user's full name. |
| `email`    | `string` | Yes      | The user's email.     |
| `password` | `string` | Yes      | The user's password.  |

#### Responses

- **`201 Created`** - The user was created successfully.
- **`409 Conflict`** - A user with this email already exists.

### Update a User

- **Endpoint:** `PUT /api/users/:id`
- **Description:** Updates the details of an existing user. **Note:** This endpoint is intended for admin use, but an admin verification mechanism is not yet implemented.

#### URL Parameters

| Parameter | Type     | Description                   |
| :-------- | :------- | :---------------------------- |
| `id`      | `number` | The ID of the user to update. |

#### Request Body

| Field   | Type     | Optional | Description                |
| :------ | :------- | :------- | :------------------------- |
| `name`  | `string` | Yes      | The new name of the user.  |
| `email` | `string` | Yes      | The new email of the user. |

#### Responses

- **`200 OK`** - The user was updated successfully.
- **`404 Not Found`** - No user found with the specified ID.

### Delete a User

- **Endpoint:** `DELETE /api/users/:id`
- **Description:** Deletes a user from the database. **Note:** This endpoint is intended for admin use, but an admin verification mechanism is not yet implemented.

#### URL Parameters

| Parameter | Type     | Description                   |
| :-------- | :------- | :---------------------------- |
| `id`      | `number` | The ID of the user to delete. |

#### Responses

- **`200 OK`** - The user was deleted successfully.
- **`404 Not Found`** - No user found with the specified ID.

---

## 8. Webhooks API

Handles incoming webhooks from external services.

### Polar Webhooks

- **Endpoint:** `POST /api/webhooks/polar`
- **Description:** This endpoint receives and processes webhooks from Polar.sh. It should be configured in your Polar dashboard to receive events like `order.created`, `order.paid`, and `order.refunded`.

#### Handled Events

- `order.created`: Triggered when an order is created after a checkout.
- `order.paid`: Triggered when an order is successfully paid. This is where you should grant access to your service.
- `order.refunded`: Triggered when an order is refunded. This is where you should revoke access.

---

## 9. Health Check API

Provides an endpoint to check the health of the server.

### Get Health Status

- **Endpoint:** `GET /health`
- **Description:** Returns the current status of the server.

#### Responses

- **`200 OK`** - The server is healthy.
  **Example Response:**
  ```json
  {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
  ```
