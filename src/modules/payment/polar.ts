import { Polar } from "@polar-sh/sdk";
import { config } from "@/lib/config";
import { Checkout } from "@polar-sh/fastify";

// Initialize Polar SDK - uses sandbox or production based on config
const polar = new Polar({
  server: config.POLAR_SERVER,
  accessToken: config.POLAR_ACCESS_TOKEN,
});

class PolarService {
  /**
   * Create a Fastify Checkout middleware
   * Uses the environment config for sandbox/production
   */
  async createCheckout() {
    return Checkout({
      accessToken: config.POLAR_ACCESS_TOKEN,
      server: config.POLAR_SERVER,
      theme: "dark",
    });
  }

  /**
   * Get the Polar SDK instance for direct API calls
   */
  getPolarClient() {
    return polar;
  }
}

export const polarService = new PolarService();
