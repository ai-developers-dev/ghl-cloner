import { NextRequest, NextResponse } from 'next/server';
import { stripe, getTierByPriceId } from '@/lib/stripe';
import { getUserByEmail, createUser } from '@/lib/supabase';
import { sendLicenseEmail, sendAdminNotificationEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  try {
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price'],
    });

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Email can be in customer_details (from checkout form), customer_email, or metadata
    const email = session.customer_details?.email || session.customer_email || session.metadata?.email;

    if (!email) {
      console.error('No email found in session:', {
        customer_details: session.customer_details,
        customer_email: session.customer_email,
        metadata: session.metadata,
      });
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    // Get tier info
    const priceId = session.line_items?.data[0]?.price?.id;
    const tierInfo = priceId ? getTierByPriceId(priceId) : null;
    const credits = tierInfo?.credits || parseInt(session.metadata?.credits || '0', 10);
    const tierName = tierInfo?.name || session.metadata?.tier || 'Unknown';

    // Get user data from Supabase
    let user = await getUserByEmail(email);

    // FALLBACK: If user doesn't exist yet (webhook hasn't fired), create them here
    if (!user) {
      console.log('User not found in success API, creating as fallback...');
      const name = session.customer_details?.name || email.split('@')[0] || 'Customer';

      const result = await createUser({
        email,
        name,
        credits,
        status: 'active',
      });

      if (result.success && result.user) {
        user = result.user;
        console.log('Fallback user created:', {
          id: user.id,
          email: user.email,
          license_key: user.license_key,
        });

        // Send emails since webhook didn't
        try {
          await sendLicenseEmail({
            email: user.email,
            name: user.name,
            licenseKey: user.license_key,
            credits: user.credits,
            tierName,
          });
          console.log('License email sent from fallback');
        } catch (emailError) {
          console.error('Failed to send license email from fallback:', emailError);
        }

        try {
          const amount = session.amount_total || 0;
          await sendAdminNotificationEmail({
            customerEmail: user.email,
            customerName: user.name,
            tierName,
            credits,
            amount,
          });
          console.log('Admin notification sent from fallback');
        } catch (adminError) {
          console.error('Failed to send admin notification from fallback:', adminError);
        }
      } else {
        console.error('Fallback user creation failed:', result.error);
        // Return pending status - maybe webhook will succeed
        return NextResponse.json({
          status: 'pending',
          email,
          credits,
          tierName,
          message: 'Your purchase is being processed. Please refresh in a moment.',
        });
      }
    }

    // User exists (either found or just created)
    return NextResponse.json({
      status: 'success',
      email: user.email,
      name: user.name,
      licenseKey: user.license_key,
      credits: user.credits,
      tierName,
      chromeStoreUrl: process.env.CHROME_STORE_URL || 'https://chrome.google.com/webstore',
    });
  } catch (error) {
    console.error('Success page error:', error);
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
}
