# Fastify API Server

To develop locally:

```
npm install
vc dev
```

```
open http://localhost:3000
```

To build locally:

```
npm install
vc build
```

To deploy:

```
npm install
vc deploy
```

## Payment Module

This project includes a payment module that integrates with Stripe.

### Environment Variables

You need to create a `.env` file in the root of the project with the following environment variables:

```
STRIPE_API_KEY=your_stripe_api_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
DATABASE_URL=file:./data/pglite.db
```

### API Endpoints

-   `POST /api/payment/intent`

    Creates a Stripe Payment Intent for a given order.

    **Request Body:**

    ```json
    {
      "orderId": 123
    }
    ```

    **Response:**

    ```json
    {
      "clientSecret": "pi_..."
    }
    ```

-   `POST /api/payment/webhook`

    Handles Stripe webhook events to update the payment status of an order. This endpoint should be configured in your Stripe dashboard.
