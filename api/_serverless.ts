import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import type { IncomingMessage, ServerResponse } from "http";

// Import routes manually (esbuild resolves @/* aliases during bundling)
import rootRoute from "@/routes/index";
import healthRoute from "@/routes/health/index";

// API routes
import paymentRoute from "@/routes/api/payment/index";
import productsRoute from "@/routes/api/products/index";
import ordersRoute from "@/routes/api/orders/index";
import usersRoute from "@/routes/api/users/index";

// Auth routes
import loginRoute from "@/routes/api/auth/login/index";
import registerRoute from "@/routes/api/auth/register/index";
import forgotPasswordRoute from "@/routes/api/auth/forgot-password/index";
import resetPasswordRoute from "@/routes/api/auth/reset-password/index";

// Admin routes
import adminUsersRoute from "@/routes/api/admin/users/index";

// Checkout routes
import checkoutRoute from "@/routes/checkout/index";
import apiCheckoutRoute from "@/routes/api/checkout/index";

// Webhook routes
import webhooksRoute from "@/routes/api/webhooks/index";

// Instantiate Fastify with serverless config
const app = Fastify({
  logger: true,
});

// Set the validator and serializer compilers
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Register CORS
app.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

// Register routes manually
app.register(rootRoute);
app.register(healthRoute, { prefix: "/health" });

// API routes
app.register(paymentRoute, { prefix: "/api/payment" });
app.register(productsRoute, { prefix: "/api/products" });
app.register(ordersRoute, { prefix: "/api/orders" });
app.register(usersRoute, { prefix: "/api/users" });

// Auth routes
app.register(loginRoute, { prefix: "/api/auth/login" });
app.register(registerRoute, { prefix: "/api/auth/register" });
app.register(forgotPasswordRoute, { prefix: "/api/auth/forgot-password" });
app.register(resetPasswordRoute, { prefix: "/api/auth/reset-password" });

// Admin routes
app.register(adminUsersRoute, { prefix: "/api/admin/users" });

// Checkout routes
app.register(checkoutRoute, { prefix: "/checkout" });
app.register(apiCheckoutRoute, { prefix: "/api/checkout" });

// Webhook routes
app.register(webhooksRoute, { prefix: "/api/webhooks" });

export default async (req: IncomingMessage, res: ServerResponse) => {
  await app.ready();
  app.server.emit("request", req, res);
};
