# System Workflows

This document visualizes the architecture and flows for the Order and Product management systems in our Fastify application.

## Core Architecture

Both systems follow a consistent layered architecture:

- **Routes**: Unified endpoint definitions and Zod validation.
- **Handlers**: Typed request processing and standardized responses.
- **Service**: Business logic and in-memory data management.
- **Schema**: Shared types and validation rules.

```mermaid
graph TD
    Client[Client Request] --> OrderRoutes[Order Routes /api/order]
    Client --> ProductRoutes[Product Routes /api/products]

    OrderRoutes --> OrderHandlers[Order Handlers]
    ProductRoutes --> ProductHandlers[Product Handlers]

    OrderHandlers --> OrderService[Order Service]
    ProductHandlers --> ProductService[Product Service]

    OrderService --> SampleData[(In-Memory Data Store)]
    ProductService --> SampleData

    OrderHandlers --> Response[Response Utilities]
    ProductHandlers --> Response
    Response --> Client
```

## Order System Flow

### 1. Create Order Flow

When a user submits a checkout request.

```mermaid
sequenceDiagram
    participant C as Client
    participant H as Order Handler
    participant S as Order Service
    participant P as Product Service
    participant D as Sample Data

    C->>H: POST /api/order (JSON Body)
    H->>H: Validate with orderInsertSchema
    H->>S: createOrder(data)

    loop Each Product
        S->>P: getProductById(id)
        P-->>S: Product Price
    end

    S->>S: Calculate totalAmount
    S->>D: Save New Order & Junctions
    S-->>H: Return OrderWithProducts
    H-->>C: sendSuccess(201 Created)
```

### 2. Modifying Order Contents

Adding/Removing products affects the total amount.

```mermaid
sequenceDiagram
    participant C as Client
    participant H as Order Handler
    participant S as Order Service
    participant D as Sample Data

    C->>H: POST /api/order/:id/products
    H->>S: addProductToOrder(id, productId, qty)
    S->>D: Find Product & Recalculate Total
    S->>D: Update Junction & Order
    S-->>H: Return Updated Object
    H-->>C: 200 OK
```

## Product System Flow

### 1. Product Management (CRUD)

Standard lifecycle of product items.

```mermaid
sequenceDiagram
    participant C as Client
    participant H as Product Handler
    participant S as Product Service
    participant D as Sample Data

    C->>H: POST /api/products (New Data)
    H->>S: createProduct(data)
    S->>D: Gen IDs & Store
    S-->>H: Created Object
    H-->>C: 201 Created

    C->>H: GET /api/products?category=Books
    H->>S: getProductByQuery('Books')
    S->>D: Filter Sample Data
    S-->>H: List of Products
    H-->>C: 200 OK
```

## Data Schema Relationships

```mermaid
erDiagram
    USERS ||--o{ ORDERS : "places"
    ORDERS ||--|{ ORDER_PRODUCT : "contains"
    PRODUCT ||--o{ ORDER_PRODUCT : "included in"

    ORDERS {
        int id PK
        int userId FK
        int totalAmount
        string status
        string shippingAddress
    }

    PRODUCT {
        int productId PK
        string name
        int price
        string category
    }

    ORDER_PRODUCT {
        int id PK
        int orderId FK
        int productId FK
        int quantity
        int priceAtOrder
    }
```
