import Stripe from 'stripe';

// Initialize Stripe with the secret key
// Handle missing key gracefully for build time
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-11-17.clover',
});

// Pricing configuration with Stripe price IDs (Live)
export const PRICING_TIERS = {
  starter: {
    name: 'Starter',
    credits: 2,
    price: 20,
    priceId: 'price_1ScBVfFOUSo8u0nUczYtg8Xg',
  },
  basic: {
    name: 'Basic',
    credits: 5,
    price: 45,
    priceId: 'price_1ScBWOFOUSo8u0nU8puSTyvB',
  },
  professional: {
    name: 'Professional',
    credits: 10,
    price: 80,
    priceId: 'price_1ScBYGFOUSo8u0nUhJHW9efr',
  },
  agency: {
    name: 'Agency',
    credits: 25,
    price: 150,
    priceId: 'price_1ScBYyFOUSo8u0nU14QX2IOP',
  },
  enterprise: {
    name: 'Enterprise',
    credits: 50,
    price: 250,
    priceId: 'price_1ScBZKFOUSo8u0nUUtxsUafy',
  },
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;

// Get tier info by price ID
export function getTierByPriceId(priceId: string) {
  return Object.values(PRICING_TIERS).find((tier) => tier.priceId === priceId);
}
