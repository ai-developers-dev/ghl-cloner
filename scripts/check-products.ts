import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2025-11-17.clover' });

async function check() {
  const priceIds = [
    { id: 'price_1SYpxQFSTfODmjVdNtFmvJw7', tier: 'Starter' },
    { id: 'price_1SYpxSFSTfODmjVdEn5wv1Db', tier: 'Basic' },
    { id: 'price_1SYpxTFSTfODmjVdUg5J9ZmP', tier: 'Professional' },
    { id: 'price_1SYpxWFSTfODmjVdTIyNhMm9', tier: 'Agency' },
    { id: 'price_1SYpxXFSTfODmjVdCChhfpnc', tier: 'Enterprise' },
  ];

  console.log('Current Stripe Products:\n');

  for (const { id, tier } of priceIds) {
    try {
      const price = await stripe.prices.retrieve(id, { expand: ['product'] });
      const product = price.product as Stripe.Product;
      console.log(`${tier}:`);
      console.log(`  Product: ${product.name}`);
      console.log(`  Price: $${(price.unit_amount || 0) / 100}`);
      console.log(`  Description: ${product.description || 'None'}`);
      console.log(`  Active: ${price.active}`);
      console.log('');
    } catch (err) {
      console.log(`${tier}: ERROR - ${err}`);
    }
  }
}

check();
