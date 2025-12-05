import { NextRequest, NextResponse } from 'next/server';
import { stripe, getTierByPriceId } from '@/lib/stripe';
import { getUserByEmail } from '@/lib/supabase';

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

    const email = session.metadata?.email || session.customer_email;

    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    // Get user data from Supabase
    const user = await getUserByEmail(email);

    if (!user) {
      // User might not be created yet if webhook hasn't fired
      // Return basic info from session
      const priceId = session.line_items?.data[0]?.price?.id;
      const tierInfo = priceId ? getTierByPriceId(priceId) : null;

      return NextResponse.json({
        status: 'pending',
        email,
        credits: tierInfo?.credits || parseInt(session.metadata?.credits || '0', 10),
        tierName: tierInfo?.name || session.metadata?.tier || 'Unknown',
        message: 'Your purchase is being processed. Please refresh in a moment.',
      });
    }

    // Get tier info
    const priceId = session.line_items?.data[0]?.price?.id;
    const tierInfo = priceId ? getTierByPriceId(priceId) : null;

    return NextResponse.json({
      status: 'success',
      email: user.email,
      name: user.name,
      licenseKey: user.license_key,
      credits: user.credits,
      tierName: tierInfo?.name || session.metadata?.tier || 'Unknown',
      chromeStoreUrl: process.env.CHROME_STORE_URL || 'https://chrome.google.com/webstore',
    });
  } catch (error) {
    console.error('Success page error:', error);
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
}
