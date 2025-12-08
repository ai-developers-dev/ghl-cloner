import { NextRequest, NextResponse } from 'next/server';
import { stripe, getTierByPriceId } from '@/lib/stripe';
import { getUserByEmail, createUser, addCredits, updateUser, getAffiliateByCode, logAffiliateCommission, updateAffiliate, logSale, getAllSalesReports } from '@/lib/supabase';
import { sendLicenseEmail, sendAdminNotificationEmail } from '@/lib/email';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  console.log('=== WEBHOOK RECEIVED ===', new Date().toISOString());

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Webhook error: No signature provided');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('Webhook signature verified, event type:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('Processing checkout.session.completed:', {
      session_id: session.id,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
    });

    try {
      await handleSuccessfulPayment(session);
      console.log('=== WEBHOOK COMPLETED SUCCESSFULLY ===');
    } catch (error) {
      console.error('CRITICAL: Payment processing failed:', error);
      // Return 500 so Stripe will retry the webhook
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;
  if (!metadata) {
    console.error('No metadata in session');
    throw new Error('No metadata in session');
  }

  // Get email and name from customer_details (collected by Stripe during checkout)
  const email = session.customer_details?.email || session.customer_email;
  const name = session.customer_details?.name || email?.split('@')[0] || 'Customer';
  const credits = parseInt(metadata.credits || '0', 10);
  const tierName = metadata.tier || 'Unknown';

  console.log('Extracted customer info:', { email, name, credits, tier: tierName });

  if (!email) {
    console.error('No email found in session - customer_details:', session.customer_details);
    throw new Error('No email found in session');
  }

  // Check if user already exists
  console.log('Checking if user exists...');
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    console.log('User already exists:', { id: existingUser.id, email: existingUser.email });
  } else {
    console.log('User does not exist, will create new user');
  }

  // Get tier info for description
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
  const priceId = lineItems.data[0]?.price?.id;
  const tierInfo = priceId ? getTierByPriceId(priceId) : null;

  let user;
  let isNewUser = false;

  if (existingUser) {
    // User exists, add credits
    console.log('Adding credits to existing user...');
    await addCredits(
      existingUser.id,
      existingUser.credits,
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
    console.log('Credits added, new balance:', user?.credits);
  } else {
    // Create new user
    console.log('Creating new user...');
    const result = await createUser({
      email,
      name: name,
      credits,
      status: 'active',
    });

    if (result.success && result.user) {
      user = result.user;
      isNewUser = true;
      console.log('User created successfully:', {
        id: user.id,
        email: user.email,
        license_key: user.license_key,
        credits: user.credits,
      });

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
    } else {
      console.error('Failed to create user:', result.error);
      throw new Error(`Failed to create user: ${result.error}`);
    }
  }

  // Handle affiliate tracking
  const affiliateCode = metadata.affiliate_code;
  let saleAffiliateId: string | undefined;
  let saleAffiliateCommission = 0;

  if (affiliateCode && user) {
    console.log('Processing affiliate commission for code:', affiliateCode);

    try {
      const affiliate = await getAffiliateByCode(affiliateCode);

      if (affiliate && affiliate.status === 'active') {
        console.log('Found active affiliate:', { id: affiliate.id, name: affiliate.name, rate: affiliate.commission_rate });

        // Update user with affiliate_id (link user to affiliate)
        await updateUser(user.id, { affiliate_id: affiliate.id });
        console.log('User linked to affiliate');

        // Calculate and log commission
        const purchaseAmount = session.amount_total || 0; // cents
        const commissionAmount = Math.round(purchaseAmount * affiliate.commission_rate);

        // Store for sale record
        saleAffiliateId = affiliate.id;
        saleAffiliateCommission = commissionAmount;

        const commissionResult = await logAffiliateCommission({
          affiliate_id: affiliate.id,
          user_id: user.id,
          purchase_amount: purchaseAmount,
          commission_amount: commissionAmount,
          stripe_session_id: session.id,
          status: 'pending',
        });

        if (commissionResult.success) {
          console.log(`Affiliate commission logged: ${affiliate.code} earns $${(commissionAmount / 100).toFixed(2)}`);

          // Update affiliate's total_earned
          await updateAffiliate(affiliate.id, {
            total_earned: affiliate.total_earned + commissionAmount,
          });
          console.log('Affiliate total_earned updated');
        } else {
          console.error('Failed to log affiliate commission:', commissionResult.error);
        }
      } else if (affiliate) {
        console.log('Affiliate found but inactive:', affiliateCode);
      } else {
        console.log('No affiliate found for code:', affiliateCode);
      }
    } catch (affError) {
      // Don't fail the whole webhook for affiliate tracking issues
      console.error('Error processing affiliate tracking:', affError);
    }
  }

  // Log sale to sales table for reporting
  if (user) {
    console.log('Logging sale to sales table...');
    try {
      const saleResult = await logSale({
        user_id: user.id,
        stripe_session_id: session.id,
        stripe_payment_intent: typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id,
        amount: session.amount_total || 0,
        credits: credits,
        tier: tierInfo?.name || tierName,
        affiliate_id: saleAffiliateId,
        affiliate_commission: saleAffiliateCommission,
      });

      if (saleResult.success) {
        console.log('Sale logged successfully:', saleResult.sale?.id);
      } else {
        console.error('Failed to log sale:', saleResult.error);
      }
    } catch (saleError) {
      // Don't fail the whole webhook for sale logging issues
      console.error('Error logging sale:', saleError);
    }
  }

  // Send confirmation email to customer
  if (user) {
    console.log('Sending license email to:', user.email);
    const emailResult = await sendLicenseEmail({
      email: user.email,
      name: user.name,
      licenseKey: user.license_key,
      credits: user.credits,
      tierName: tierInfo?.name || tierName,
    });

    if (!emailResult.success) {
      console.error('Failed to send license email:', emailResult.error);
    } else {
      console.log('License email sent successfully');
    }

    // Send admin notification email with sales reports
    console.log('Sending admin notification with sales reports...');
    const amount = session.amount_total || 0;

    // Fetch current sales reports for the email
    let salesReports;
    try {
      salesReports = await getAllSalesReports();
      console.log('Sales reports fetched:', {
        daily: { sales: salesReports.daily.salesCount, revenue: salesReports.daily.totalRevenue },
        monthly: { sales: salesReports.monthly.salesCount, revenue: salesReports.monthly.totalRevenue },
      });
    } catch (reportError) {
      console.error('Failed to fetch sales reports for email:', reportError);
    }

    const adminResult = await sendAdminNotificationEmail({
      customerEmail: user.email,
      customerName: user.name,
      tierName: tierInfo?.name || tierName,
      credits: credits,
      amount: amount,
      dailyReport: salesReports?.daily ? {
        salesCount: salesReports.daily.salesCount,
        totalRevenue: salesReports.daily.totalRevenue,
        totalCredits: salesReports.daily.totalCredits,
        totalAffiliateCommissions: salesReports.daily.totalAffiliateCommissions,
      } : undefined,
      monthlyReport: salesReports?.monthly ? {
        salesCount: salesReports.monthly.salesCount,
        totalRevenue: salesReports.monthly.totalRevenue,
        totalCredits: salesReports.monthly.totalCredits,
        totalAffiliateCommissions: salesReports.monthly.totalAffiliateCommissions,
      } : undefined,
    });

    if (!adminResult.success) {
      console.error('Failed to send admin notification:', adminResult.error);
    } else {
      console.log('Admin notification sent successfully');
    }

    console.log(`Payment processed for ${email}: ${credits} credits ${isNewUser ? '(new user)' : '(existing user)'}`);
  } else {
    console.error('No user object after processing - this should not happen');
    throw new Error('User object is null after processing');
  }
}
