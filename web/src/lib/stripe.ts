import Stripe from 'stripe';

// Initialize Stripe with the secret key
// Handle missing key gracefully for build time
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-11-17.clover',
});

// Pricing configuration with Stripe price IDs
export const PRICING_TIERS = {
  starter: {
    name: 'Starter',
    credits: 2,
    price: 25,
    priceId: 'price_1SYpxQFSTfODmjVdNtFmvJw7',
  },
  basic: {
    name: 'Basic',
    credits: 10,
    price: 125,
    priceId: 'price_1SYpxSFSTfODmjVdEn5wv1Db',
  },
  professional: {
    name: 'Professional',
    credits: 20,
    price: 200,
    priceId: 'price_1SYpxTFSTfODmjVdUg5J9ZmP',
  },
  agency: {
    name: 'Agency',
    credits: 50,
    price: 375,
    priceId: 'price_1SYpxWFSTfODmjVdTIyNhMm9',
  },
  enterprise: {
    name: 'Enterprise',
    credits: 100,
    price: 500,
    priceId: 'price_1SYpxXFSTfODmjVdCChhfpnc',
  },
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;

// Get tier info by price ID
export function getTierByPriceId(priceId: string) {
  return Object.values(PRICING_TIERS).find((tier) => tier.priceId === priceId);
}
