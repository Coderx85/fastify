import { config } from "@/lib/config";

export type CurrencyType = "inr" | "usd";
export type PaymentMethod = "razorpay" | "polar";

export interface ExchangeRateData {
  from: CurrencyType;
  to: CurrencyType;
  rate: number;
  timestamp: Date;
}

export interface ConversionResult {
  originalAmount: number;
  convertedAmount: number;
  fromCurrency: CurrencyType;
  toCurrency: CurrencyType;
  exchangeRate: number;
}

/**
 * CurrencyService
 *
 * Central service for currency conversion, exchange rate management,
 * and payment method currency mapping.
 *
 * Used by:
 * - ProductService: Converting product prices between currencies
 * - OrderService: Converting order amounts based on payment method
 */
export class CurrencyService {
  // Cached exchange rates with expiration
  private exchangeRates: Map<string, ExchangeRateData> = new Map();
  private readonly CACHE_DURATION_MS = 3600000; // 1 hour

  // Payment method to currency mapping
  private readonly PAYMENT_METHOD_MAP: Record<PaymentMethod, CurrencyType> = {
    razorpay: "inr",
    polar: "usd",
  };

  // Default exchange rates (fallback)
  private readonly DEFAULT_RATES = {
    inr_to_usd: 0.012,
    usd_to_inr: 83.33,
  };

  constructor() {
    this.initializeDefaultRates();
  }

  /**
   * Initialize default exchange rates
   */
  private initializeDefaultRates(): void {
    this.exchangeRates.set("inr_to_usd", {
      from: "inr",
      to: "usd",
      rate: this.DEFAULT_RATES.inr_to_usd,
      timestamp: new Date(),
    });

    this.exchangeRates.set("usd_to_inr", {
      from: "usd",
      to: "inr",
      rate: this.DEFAULT_RATES.usd_to_inr,
      timestamp: new Date(),
    });
  }

  /**
   * Get the cache key for currency pair
   */
  private getCacheKey(from: CurrencyType, to: CurrencyType): string {
    return `${from}_to_${to}`;
  }

  /**
   * Check if cached rate is still valid
   */
  private isCacheValid(timestamp: Date): boolean {
    const now = new Date();
    const ageMs = now.getTime() - timestamp.getTime();
    return ageMs < this.CACHE_DURATION_MS;
  }

  /**
   * Fetch exchange rate from API
   */
  private async fetchExchangeRateFromAPI(
    from: CurrencyType,
    to: CurrencyType,
  ): Promise<number> {
    const fromCode = from.toUpperCase();
    const toCode = to.toUpperCase();

    try {
      const res = await fetch(
        `https://v6.exchangerate-api.com/v6/${config.EXCHANGE_API}/pair/${fromCode}/${toCode}`,
      );

      const data = await res.json();

      if (!res.ok || !data || data.result !== "success") {
        throw new Error(
          `Exchange API returned failure: ${data?.error_type ?? res.status}`,
        );
      }

      if (
        !data.conversion_rate ||
        typeof data.conversion_rate !== "number" ||
        data.conversion_rate <= 0
      ) {
        throw new Error("Invalid conversion rate from exchange API");
      }

      return data.conversion_rate;
    } catch (err) {
      throw new Error(`Failed to fetch exchange rate ${from}→${to}`, {
        cause: { code: "EXCHANGE_RATE_FAILED", original: err },
      });
    }
  }

  /**
   * Fetch exchange rate with specific amount (returns converted result)
   */
  private async fetchExchangeRateWithAmountFromAPI(
    amount: number,
    from: CurrencyType,
    to: CurrencyType,
  ): Promise<number> {
    const fromCode = from.toUpperCase();
    const toCode = to.toUpperCase();

    try {
      const res = await fetch(
        `https://v6.exchangerate-api.com/v6/${config.EXCHANGE_API}/pair/${fromCode}/${toCode}/${amount}`,
      );

      const data = await res.json();

      if (!res.ok || !data || data.result !== "success") {
        throw new Error(
          `Exchange API returned failure: ${data?.error_type ?? res.status}`,
        );
      }

      if (
        !data.conversion_result ||
        typeof data.conversion_result !== "number" ||
        data.conversion_result <= 0
      ) {
        throw new Error("Invalid conversion result from exchange API");
      }

      return data.conversion_result;
    } catch (err) {
      throw new Error(`Failed to convert ${amount} ${from}→${to}`, {
        cause: { code: "EXCHANGE_RATE_FAILED", original: err },
      });
    }
  }

  /**
   * Get exchange rate (cached or from API)
   */
  async getExchangeRate(from: CurrencyType, to: CurrencyType): Promise<number> {
    if (from === to) {
      return 1;
    }

    const cacheKey = this.getCacheKey(from, to);
    const cached = this.exchangeRates.get(cacheKey);

    // Return cached rate if valid
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.rate;
    }

    // Try to fetch from API
    try {
      const rate = await this.fetchExchangeRateFromAPI(from, to);
      this.exchangeRates.set(cacheKey, {
        from,
        to,
        rate,
        timestamp: new Date(),
      });
      return rate;
    } catch (err) {
      // Fall back to cached rate if available
      if (cached) {
        console.warn(`Using stale exchange rate ${from}→${to}: ${cached.rate}`);
        return cached.rate;
      }

      // Fall back to default rates
      const key = `${from}_to_${to}`;
      const defaultRate =
        this.DEFAULT_RATES[key as keyof typeof this.DEFAULT_RATES];
      if (defaultRate) {
        console.warn(
          `Using default exchange rate ${from}→${to}: ${defaultRate}`,
        );
        return defaultRate;
      }

      throw err;
    }
  }

  /**
   * Convert amount between currencies
   */
  async convertCurrency(
    amount: number,
    from: CurrencyType,
    to: CurrencyType,
  ): Promise<ConversionResult> {
    if (from === to) {
      return {
        originalAmount: amount,
        convertedAmount: amount,
        fromCurrency: from,
        toCurrency: to,
        exchangeRate: 1,
      };
    }

    try {
      // Try to get conversion with amount from API for accuracy
      const convertedAmount = await this.fetchExchangeRateWithAmountFromAPI(
        amount,
        from,
        to,
      );

      const rate = await this.getExchangeRate(from, to);

      return {
        originalAmount: amount,
        convertedAmount: parseFloat(convertedAmount.toFixed(2)),
        fromCurrency: from,
        toCurrency: to,
        exchangeRate: rate,
      };
    } catch (err) {
      // Fallback: use simple rate multiplication
      const rate = await this.getExchangeRate(from, to);
      const convertedAmount = amount * rate;

      return {
        originalAmount: amount,
        convertedAmount: parseFloat(convertedAmount.toFixed(2)),
        fromCurrency: from,
        toCurrency: to,
        exchangeRate: rate,
      };
    }
  }

  /**
   * Get currency for payment method
   */
  getCurrencyByPaymentMethod(paymentMethod: PaymentMethod): CurrencyType {
    const currency = this.PAYMENT_METHOD_MAP[paymentMethod];
    if (!currency) {
      throw new Error(`Unknown payment method: ${paymentMethod}`);
    }
    return currency;
  }

  /**
   * Get payment method for currency
   */
  getPaymentMethodByCurrency(currency: CurrencyType): PaymentMethod {
    if (currency === "inr") {
      return "razorpay";
    } else if (currency === "usd") {
      return "polar";
    }
    throw new Error(`No payment method for currency: ${currency}`);
  }

  /**
   * Set custom exchange rate (useful for testing or manual override)
   */
  setExchangeRate(from: CurrencyType, to: CurrencyType, rate: number): void {
    if (rate <= 0) {
      throw new Error("Exchange rate must be positive");
    }

    const cacheKey = this.getCacheKey(from, to);
    this.exchangeRates.set(cacheKey, {
      from,
      to,
      rate,
      timestamp: new Date(),
    });
  }

  /**
   * Clear exchange rate cache
   */
  clearCache(): void {
    this.exchangeRates.clear();
    this.initializeDefaultRates();
  }

  /**
   * Get all cached exchange rates
   */
  getCachedRates(): ExchangeRateData[] {
    return Array.from(this.exchangeRates.values());
  }

  /**
   * Check if API key is configured
   */
  isAPIConfigured(): boolean {
    return !!config.EXCHANGE_API;
  }

  /**
   * Convert multiple amounts efficiently
   */
  async convertMultiple(
    amounts: Array<{ amount: number; from: CurrencyType; to: CurrencyType }>,
  ): Promise<ConversionResult[]> {
    return Promise.all(
      amounts.map(({ amount, from, to }) =>
        this.convertCurrency(amount, from, to),
      ),
    );
  }

  /**
   * Get conversion summary (useful for logging/debugging)
   */
  async getConversionSummary(
    amount: number,
    from: CurrencyType,
    to: CurrencyType,
  ): Promise<string> {
    const result = await this.convertCurrency(amount, from, to);
    return `${result.originalAmount} ${result.fromCurrency} = ${result.convertedAmount} ${result.toCurrency} (rate: ${result.exchangeRate})`;
  }
}

// Singleton instance
export const currencyService = new CurrencyService();
