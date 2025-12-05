import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRICING_TIERS, PricingTier } from '@/lib/stripe';
import { getUserByEmail } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier } = body as { tier: PricingTier };

    // Validate inputs
    if (!tier || !PRICING_TIERS[tier]) {
      return NextResponse.json({ error: 'Invalid pricing tier' }, { status: 400 });
    }

    const selectedTier = PRICING_TIERS[tier];

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Create Stripe Checkout Session with embedded mode for popup
    // Stripe will collect email and name during checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      ui_mode: 'embedded',
      line_items: [
        {
          price: selectedTier.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        tier: tier,
        credits: selectedTier.credits.toString(),
      },
      return_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({
      sessionId: session.id,
      clientSecret: session.client_secret,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
