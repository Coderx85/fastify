export const config = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,

  // Polar.sh Configuration
  POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN || "",
  POLAR_ORGANIZATION_ID: process.env.POLAR_ORGANIZATION_ID || "",
  POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET || "",
  POLAR_SERVER:
    (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox",
  POLAR_PRODUCT_ID: process.env.POLAR_PRODUCT_ID || "",

  // Checkout URLs
  SUCCESS_URL:
    process.env.SUCCESS_URL || "http://localhost:3000/checkout/success",
  RETURN_URL: process.env.RETURN_URL || "http://localhost:3000",
};
