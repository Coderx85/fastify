type Config = {
  PORT: number;
  DATABASE_URL: string;
  ENVIRONMENT: "development" | "production" | "test";

  // Polar.sh Configuration
  POLAR_ACCESS_TOKEN: string;
  POLAR_ORGANIZATION_ID: string;
  POLAR_WEBHOOK_SECRET: string;
  POLAR_SERVER: "sandbox" | "production";
  POLAR_PRODUCT_ID: string;

  // Razorpay Configuration
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET: string;
  RAZORPAY_CURRENCY: string;

  // Checkout URLs
  SUCCESS_URL: string;
  RETURN_URL: string;

  // JWT Configuration
  JWT_SECRET: string;
};

export const config: Config = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  DATABASE_URL: process.env.DATABASE_URL || "",
  ENVIRONMENT:
    (process.env.ENVIRONMENT as "development" | "production" | "test") ||
    "development",

  // Polar.sh Configuration
  POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN || "",
  POLAR_ORGANIZATION_ID: process.env.POLAR_ORGANIZATION_ID || "",
  POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET || "",
  POLAR_SERVER:
    (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox",
  POLAR_PRODUCT_ID: process.env.POLAR_PRODUCT_ID || "",

  // Razorpay Configuration (supports existing KEY_ID/KEY_SECRET fallbacks)
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || process.env.KEY_ID || "",
  RAZORPAY_KEY_SECRET:
    process.env.RAZORPAY_KEY_SECRET || process.env.KEY_SECRET || "",
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  RAZORPAY_CURRENCY: process.env.RAZORPAY_CURRENCY || "INR",

  // Checkout URLs
  SUCCESS_URL:
    process.env.SUCCESS_URL || "http://localhost:3000/checkout/success",
  RETURN_URL: process.env.RETURN_URL || "http://localhost:3000",

  // JWT Configuration - CHANGE THIS IN PRODUCTION
  JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-and-long-jwt-secret",
};
