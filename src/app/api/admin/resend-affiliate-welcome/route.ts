import { NextRequest, NextResponse } from 'next/server';
import { getAffiliateById, regenerateAffiliateSetupToken } from '@/lib/supabase';
import { sendAffiliateWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { affiliateId } = body;

    if (!affiliateId) {
      return NextResponse.json(
        { success: false, error: 'Affiliate ID is required' },
        { status: 400 }
      );
    }

    // Get affiliate by ID
    const affiliate = await getAffiliateById(affiliateId);
    if (!affiliate) {
      return NextResponse.json(
        { success: false, error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Generate new setup token
    const tokenResult = await regenerateAffiliateSetupToken(affiliateId);
    if (!tokenResult.success || !tokenResult.setupToken) {
      return NextResponse.json(
        { success: false, error: tokenResult.error || 'Failed to generate setup token' },
        { status: 500 }
      );
    }

    // Send welcome email with new token
    const emailResult = await sendAffiliateWelcomeEmail({
      email: affiliate.email,
      name: affiliate.name,
      setupToken: tokenResult.setupToken,
      affiliateCode: affiliate.code,
      commissionRate: affiliate.commission_rate,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: emailResult.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Welcome email resent to ${affiliate.email}`,
    });

  } catch (error) {
    console.error('Resend affiliate welcome error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
