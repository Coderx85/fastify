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

This project supports two payment providers: **Polar** (sandbox) and **Razorpay**.

### Environment variables

Add the following to `.env.development` (examples are already in the repo):

- RAZORPAY_KEY_ID — public key used by client Checkout
- RAZORPAY_KEY_SECRET — server-side secret used to sign/verify
- RAZORPAY_WEBHOOK_SECRET — webhook verification secret
- RAZORPAY_CURRENCY — currency (optional)

### Endpoints (Razorpay)

- POST `/api/payment/intent` — provider-agnostic. Pass { orderId, provider: "razorpay" } to create a Razorpay Order.
- POST `/api/payment/razorpay/verify` — verify Checkout signature from the client and mark payment succeeded.
- POST `/api/payment/razorpay/webhook` — webhook endpoint (verifies `x-razorpay-signature`).

### Client example

Open `sample/razorpay-checkout.html` and click **Pay with Razorpay** (you must run the API server at `http://localhost:4000`). The page demonstrates:

1. Requesting a Razorpay Order from `POST /api/payment/intent` (provider: "razorpay").
2. Opening the Razorpay Checkout using `keyId` + `order.id`.
3. Sending the Checkout response to `POST /api/payment/razorpay/verify` for server verification.

### Webhooks

Configure a webhook in your Razorpay dashboard to post payment events to `/api/payment/razorpay/webhook` and set `RAZORPAY_WEBHOOK_SECRET` accordingly. The server verifies the webhook HMAC and updates the payment row.

---

See `sample/razorpay-checkout.html` for a copy-paste demo.
