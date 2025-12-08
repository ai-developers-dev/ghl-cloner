import { NextRequest, NextResponse } from 'next/server';
import { stripe, getTierByPriceId } from '@/lib/stripe';
import { getUserByEmail, createUser, addCredits } from '@/lib/supabase';
import { sendLicenseEmail, sendAdminNotificationEmail } from '@/lib/email';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      await handleSuccessfulPayment(session);
    } catch (error) {
      console.error('Error processing payment:', error);
      // Still return 200 to acknowledge receipt
      // Stripe will retry if we return an error
    }
  }

  return NextResponse.json({ received: true });
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;
  if (!metadata) {
    console.error('No metadata in session');
    return;
  }

  // Get email and name from customer_details (collected by Stripe during checkout)
  const email = session.customer_details?.email || session.customer_email;
  const name = session.customer_details?.name || email?.split('@')[0] || 'Customer';
  const credits = parseInt(metadata.credits || '0', 10);
  const tierName = metadata.tier || 'Unknown';

  if (!email) {
    console.error('No email found in session');
    return;
  }

  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  const existingUserId = existingUser?.id;

  // Get tier info for description
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
  const priceId = lineItems.data[0]?.price?.id;
  const tierInfo = priceId ? getTierByPriceId(priceId) : null;

  let user;
  let isNewUser = false;

  // Check if user exists
  if (existingUserId) {
    // User exists, add credits
    user = await getUserByEmail(email);
    if (user) {
      await addCredits(
        user.id,
        user.credits,
        credits,
        `Stripe purchase - ${tierInfo?.name || tierName} (${credits} credits)`,
        {
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
          tier: tierName,
        }
      );
      // Refresh user data
      user = await getUserByEmail(email);
    }
  } else {
    // Check again by email (in case user was created between checkout start and completion)
    user = await getUserByEmail(email);

    if (user) {
      // User exists, add credits
      await addCredits(
        user.id,
        user.credits,
        credits,
        `Stripe purchase - ${tierInfo?.name || tierName} (${credits} credits)`,
        {
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
          tier: tierName,
        }
      );
      // Refresh user data
      user = await getUserByEmail(email);
    } else {
      // Create new user
      const result = await createUser({
        email,
        name: name,
        credits,
        status: 'active',
      });

      if (result.success && result.user) {
        user = result.user;
        isNewUser = true;

        // Log the initial purchase transaction for new users
        await addCredits(
          user.id,
          0, // Starting from 0 since createUser already set credits
          0, // No additional credits to add
          `Initial purchase - ${tierInfo?.name || tierName} (${credits} credits)`,
          {
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent,
            tier: tierName,
            is_initial_purchase: true,
          }
        );
      }
    }
  }

  // Send confirmation email to customer
  if (user) {
    await sendLicenseEmail({
      email: user.email,
      name: user.name,
      licenseKey: user.license_key,
      credits: user.credits,
      tierName: tierInfo?.name || tierName,
    });

    // Send admin notification email
    const amount = session.amount_total || 0;
    await sendAdminNotificationEmail({
      customerEmail: user.email,
      customerName: user.name,
      tierName: tierInfo?.name || tierName,
      credits: credits,
      amount: amount,
    });

    console.log(`Payment processed for ${email}: ${credits} credits ${isNewUser ? '(new user)' : '(existing user)'}`);
  }
}
