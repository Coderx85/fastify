# Payment Workflow Documentation

This document explains the complete payment workflow implemented in this project using **Polar.sh** as the payment gateway.

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PAYMENT WORKFLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────────┐
│  Client  │────▶│  Your API    │────▶│  Polar API  │────▶│  Stripe (via     │
│  (User)  │     │  (Fastify)   │     │  (Sandbox/  │     │  Polar)          │
│          │◀────│              │◀────│  Production)│◀────│                  │
└──────────┘     └──────────────┘     └─────────────┘     └──────────────────┘
                        │                    │
                        │                    │
                        ▼                    │
                 ┌──────────────┐            │
                 │  Webhooks    │◀───────────┘
                 │  (Events)    │
                 └──────────────┘
```

## Architecture

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **Polar Routes** | `src/routes/api/payment/polar/index.ts` | REST API endpoints for checkout, customers, subscriptions |
| **Polar Backend Service** | `src/modules/payment/polar.service.ts` | Business logic for Polar API interactions |
| **Polar Service (Middleware)** | `src/modules/payment/polar.ts` | Fastify checkout middleware |
| **Webhooks** | `src/routes/api/webhooks/index.ts` | Handle Polar events (payments, subscriptions) |
| **Config** | `src/lib/config.ts` | Environment configuration |

---

## Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CHECKOUT FLOW                                        │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌────────┐                                                       ┌──────────┐
  │ Client │                                                       │  Polar   │
  └───┬────┘                                                       └────┬─────┘
      │                                                                  │
      │  1. POST /api/payment/polar/checkout                             │
      │     { customerEmail, customerName, ... }                         │
      ├─────────────────────────────────────────────────────────────────▶│
      │                                                                  │
      │  2. Returns checkout URL                                         │
      │     { checkoutUrl: "https://sandbox.polar.sh/checkout/..." }    │
      │◀─────────────────────────────────────────────────────────────────┤
      │                                                                  │
      │  3. Redirect user to checkoutUrl                                 │
      │─────────────────────────────────────────────────────────────────▶│
      │                                                                  │
      │           ┌────────────────────────────────────┐                 │
      │           │  User enters payment details       │                 │
      │           │  (Test card: 4242 4242 4242 4242)  │                 │
      │           └────────────────────────────────────┘                 │
      │                                                                  │
      │  4. Payment processed → Redirect to successUrl                   │
      │◀─────────────────────────────────────────────────────────────────┤
      │                                                                  │
      │                                                                  │
  ┌───┴────┐                                                       ┌────┴─────┐
  │ Client │                                                       │  Polar   │
  └────────┘                                                       └────┬─────┘
                                                                        │
                           WEBHOOK EVENTS                               │
                                                                        │
  ┌────────────────┐                                                    │
  │ Your Server    │                                                    │
  │ /api/webhooks  │◀───────────────────────────────────────────────────┤
  │    /polar      │   5. POST webhook events:                          │
  └───────┬────────┘      • order.created                               │
          │               • order.paid ← Payment confirmed!             │
          │               • subscription.created                        │
          │               • subscription.active                         │
          │               • customer.created                            │
          ▼                                                             │
  ┌────────────────┐                                               ┌────┴─────┐
  │  Database      │                                               │  Polar   │
  │  Update user   │                                               └──────────┘
  │  subscription  │
  │  status        │
  └────────────────┘
```

---

## Step-by-Step Flow

### 1. Create Checkout Session

**Endpoint:** `POST /api/payment/polar/checkout`

**Request:**
```json
{
  "customerEmail": "user@example.com",
  "customerName": "John Doe",
  "externalCustomerId": "user_123",
  "successUrl": "http://localhost:3000/checkout/success",
  "returnUrl": "http://localhost:3000"
}
```

**What happens:**
1. Your API calls `polarService.createCheckout()` 
2. Polar SDK sends request to `https://sandbox-api.polar.sh/v1/checkouts/`
3. Polar creates a checkout session with your configured product
4. Returns a checkout URL

**Response:**
```json
{
  "success": true,
  "message": "Checkout created successfully",
  "data": {
    "checkout": {
      "checkoutId": "chk_xxx",
      "checkoutUrl": "https://sandbox.polar.sh/checkout/...",
      "expiresAt": "2026-01-29T16:00:00Z",
      "status": "open"
    }
  }
}
```

### 2. User Completes Payment

1. Redirect user to `checkoutUrl`
2. User enters payment details on Polar's hosted checkout page
3. For sandbox, use test card: `4242 4242 4242 4242`
4. After payment, user is redirected to `successUrl`

### 3. Webhook Events

Polar sends webhook events to `POST /api/webhooks/polar`:

| Event | When Triggered | Action to Take |
|-------|----------------|----------------|
| `order.created` | Order is created | Log order |
| `order.paid` | **Payment confirmed** | ✅ **Enable access in your database** |
| `subscription.created` | Subscription created | Store subscription ID |
| `subscription.active` | Subscription is active | Enable premium features |
| `subscription.canceled` | User canceled | Keep access until period end |
| `subscription.revoked` | Immediately revoked | Disable access immediately |
| `customer.created` | New customer | Link to your user database |

### 4. Verify User Access

After payment, verify user has access:

**Endpoint:** `GET /api/payment/polar/access/user/:externalUserId`

**Response:**
```json
{
  "success": true,
  "data": {
    "access": {
      "hasAccess": true,
      "subscription": { ... },
      "customer": { ... }
    }
  }
}
```

---

## Environment Configuration

### Required Environment Variables

```bash
# .env.development.local (Sandbox)
POLAR_ACCESS_TOKEN=polar_oat_xxx        # Get from sandbox.polar.sh
POLAR_ORGANIZATION_ID=xxx-xxx-xxx       # Your org ID
POLAR_SERVER=sandbox                    # "sandbox" or "production"
POLAR_PRODUCT_ID=xxx-xxx-xxx            # Your product ID
POLAR_WEBHOOK_SECRET=xxx                # For webhook verification

# Checkout URLs
SUCCESS_URL=http://localhost:3000/checkout/success
RETURN_URL=http://localhost:3000
```

### Sandbox vs Production

| Setting | Sandbox | Production |
|---------|---------|------------|
| `POLAR_SERVER` | `sandbox` | `production` |
| API URL | `https://sandbox-api.polar.sh` | `https://api.polar.sh` |
| Dashboard | `https://sandbox.polar.sh` | `https://polar.sh` |
| Test Cards | ✅ Stripe test cards work | ❌ Real cards only |
| Data | Isolated test data | Live customer data |

---

## API Endpoints Reference

### Checkout
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payment/polar/checkout` | Create checkout session |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/payment/polar/customers` | List all customers |
| `GET` | `/api/payment/polar/customers/:customerId` | Get customer by ID |
| `GET` | `/api/payment/polar/customers/external/:externalId` | Get by your user ID |
| `GET` | `/api/payment/polar/customers/:customerId/subscriptions` | Get customer subscriptions |
| `GET` | `/api/payment/polar/customers/:customerId/orders` | Get customer orders |
| `GET` | `/api/payment/polar/customers/:customerId/state` | Get full customer state |

### Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/payment/polar/subscriptions/:subscriptionId` | Get subscription |
| `POST` | `/api/payment/polar/subscriptions/:subscriptionId/cancel` | Cancel at period end |
| `DELETE` | `/api/payment/polar/subscriptions/:subscriptionId` | Revoke immediately |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/payment/polar/products` | List all products |

### Access Control
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/payment/polar/access/user/:externalUserId` | Check user access |
| `GET` | `/api/payment/polar/access/user/:externalUserId/tier` | Get user plan tier |

### Status
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/payment/polar/status` | Check Polar integration status |

---

## Testing Payments (Sandbox)

### Test Card Numbers

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Declined |
| `4000 0000 0000 9995` | Insufficient funds |

**Expiry:** Any future date  
**CVC:** Any 3 digits

### Testing Flow

1. Start your server:
   ```bash
   pnpm dev
   ```

2. Create a checkout:
   ```bash
   curl -X POST http://localhost:3000/api/payment/polar/checkout \
     -H "Content-Type: application/json" \
     -d '{"customerEmail": "test@example.com"}'
   ```

3. Open the returned `checkoutUrl` in browser

4. Use test card `4242 4242 4242 4242`

5. Observe webhook events in your terminal logs

---

## Webhook Security

Webhooks are verified using the `POLAR_WEBHOOK_SECRET`:

```typescript
// src/routes/api/webhooks/index.ts
Webhooks({
  webhookSecret: config.POLAR_WEBHOOK_SECRET,
  onOrderPaid: async (payload) => {
    // This is verified and safe to trust
    await updateUserSubscription(payload.data);
  },
});
```

---

## Service Methods Reference

### PolarBackendService (`src/modules/payment/polar.service.ts`)

| Method | Description |
|--------|-------------|
| `createCheckout(params)` | Create a new checkout session |
| `getCheckout(checkoutId)` | Get checkout details |
| `createCustomer(params)` | Create a new customer |
| `getCustomer(customerId)` | Get customer by Polar ID |
| `getCustomerByExternalId(externalId)` | Get customer by your user ID |
| `listCustomers(limit)` | List all customers |
| `getCustomerSubscriptions(customerId)` | Get customer's subscriptions |
| `getSubscription(subscriptionId)` | Get subscription details |
| `hasActiveSubscription(customerId, productId?)` | Check active subscription |
| `cancelSubscriptionAtPeriodEnd(subscriptionId)` | Graceful cancellation |
| `revokeSubscription(subscriptionId)` | Immediate revocation |
| `listProducts()` | List organization products |
| `getProduct(productId)` | Get product details |
| `getCustomerOrders(customerId)` | Get customer's orders |
| `checkUserAccess(userExternalId)` | Check if user has access |
| `getUserPlanTier(userExternalId)` | Get user's plan tier |

---

## Next Steps

1. **Set up webhook endpoint** in Polar Dashboard:
   - URL: `https://your-domain.com/api/webhooks/polar`
   - Get webhook secret and add to env

2. **Implement database storage** in webhook handlers:
   - Store subscription status
   - Link Polar customer to your users

3. **Add authentication middleware** to protect routes

4. **Move to production**:
   - Create production organization at polar.sh
   - Update env variables to production values
   - Change `POLAR_SERVER` to `production`
