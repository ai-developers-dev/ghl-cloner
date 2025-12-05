import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('STRIPE_SECRET_KEY not found in .env.local');
  process.exit(1);
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-11-17.clover',
});

const PRICING_TIERS = [
  { name: 'Starter', credits: 2, price: 2500 }, // price in cents
  { name: 'Basic', credits: 10, price: 12500 },
  { name: 'Professional', credits: 20, price: 20000 },
  { name: 'Agency', credits: 50, price: 37500 },
  { name: 'Enterprise', credits: 100, price: 50000 },
];

async function createProducts() {
  console.log('Checking existing products...\n');

  // List existing products
  const existingProducts = await stripe.products.list({ limit: 100 });
  console.log(`Found ${existingProducts.data.length} existing products`);

  // List existing prices
  const existingPrices = await stripe.prices.list({ limit: 100, active: true });
  console.log(`Found ${existingPrices.data.length} existing prices\n`);

  // Log existing products
  console.log('Existing products:');
  for (const product of existingProducts.data) {
    console.log(`  - ${product.name} (${product.id})`);

    // Find prices for this product
    const productPrices = existingPrices.data.filter(p => p.product === product.id);
    for (const price of productPrices) {
      console.log(`      Price: $${(price.unit_amount || 0) / 100} (${price.id})`);
    }
  }

  console.log('\n--- Price IDs for stripe.ts ---\n');

  for (const tier of PRICING_TIERS) {
    // Check if product exists
    const existingProduct = existingProducts.data.find(p => p.name === `GHL Cloner - ${tier.name}`);

    if (existingProduct) {
      console.log(`Product "${tier.name}" already exists: ${existingProduct.id}`);

      // Find the price
      const existingPrice = existingPrices.data.find(
        p => p.product === existingProduct.id && p.unit_amount === tier.price
      );

      if (existingPrice) {
        console.log(`  Price exists: ${existingPrice.id}`);
      } else {
        console.log(`  Creating price for ${tier.name}...`);
        const newPrice = await stripe.prices.create({
          product: existingProduct.id,
          unit_amount: tier.price,
          currency: 'usd',
        });
        console.log(`  Created price: ${newPrice.id}`);
      }
    } else {
      console.log(`Creating product "${tier.name}"...`);

      const product = await stripe.products.create({
        name: `GHL Cloner - ${tier.name}`,
        description: `${tier.credits} Clone Credits`,
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: tier.price,
        currency: 'usd',
      });

      console.log(`  Product: ${product.id}`);
      console.log(`  Price: ${price.id}`);
    }
  }
}

createProducts().catch(console.error);
