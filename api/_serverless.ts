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
import paymentRoute from "@/routes/api/payment/index";
import polarRoute from "@/routes/api/payment/polar/index";
import productsRoute from "@/routes/api/products/index";
import orderRoute from "@/routes/api/order/index";

// Auth routes
import loginRoute from "@/routes/api/auth/login/index";
import registerRoute from "@/routes/api/auth/register/index";
import forgotPasswordRoute from "@/routes/api/auth/forgot-password/index";
import resetPasswordRoute from "@/routes/api/auth/reset-password/index";

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
app.register(healthRoute, { prefix: "/api/health" });
app.register(paymentRoute, { prefix: "/api/payment" });
app.register(polarRoute, { prefix: "/api/payment/polar" });
app.register(productsRoute, { prefix: "/api/products" });
app.register(orderRoute, { prefix: "/api/order" });

// Auth routes
app.register(loginRoute, { prefix: "/api/auth/login" });
app.register(registerRoute, { prefix: "/api/auth/register" });
app.register(forgotPasswordRoute, { prefix: "/api/auth/forgot-password" });
app.register(resetPasswordRoute, { prefix: "/api/auth/reset-password" });

export default async (req: IncomingMessage, res: ServerResponse) => {
  await app.ready();
  app.server.emit("request", req, res);
};
