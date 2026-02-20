import { Polar } from "@polar-sh/sdk";
import { config } from "@/lib/config";
import { Checkout } from "@polar-sh/fastify";

// Initialize Polar SDK only when credentials are available
let polar: Polar | null = null;

function getPolarInstance(): Polar | null {
  if (!config.POLAR_ACCESS_TOKEN) {
    return null;
  }
  if (!polar) {
    polar = new Polar({
      server: config.POLAR_SERVER,
      accessToken: config.POLAR_ACCESS_TOKEN,
    });
  }
  return polar;
}

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
    return getPolarInstance();
  }
}

export const polarService = new PolarService();
