import { NextRequest, NextResponse } from 'next/server';
import { getAffiliateById, regenerateAffiliateSetupToken } from '@/lib/supabase';
import { sendAffiliateWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { affiliateId } = body;

    console.log('Resend welcome email request for affiliateId:', affiliateId);

    if (!affiliateId) {
      console.error('Missing affiliateId in request');
      return NextResponse.json(
        { success: false, error: 'Affiliate ID is required' },
        { status: 400 }
      );
    }

    // Get affiliate by ID
    const affiliate = await getAffiliateById(affiliateId);
    console.log('Found affiliate:', affiliate ? { id: affiliate.id, email: affiliate.email, name: affiliate.name } : 'null');

    if (!affiliate) {
      console.error('Affiliate not found for ID:', affiliateId);
      return NextResponse.json(
        { success: false, error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Generate new setup token
    console.log('Generating new setup token for:', affiliate.email);
    const tokenResult = await regenerateAffiliateSetupToken(affiliateId);
    console.log('Token generation result:', { success: tokenResult.success, hasToken: !!tokenResult.setupToken, error: tokenResult.error });

    if (!tokenResult.success || !tokenResult.setupToken) {
      console.error('Failed to generate token:', tokenResult.error);
      return NextResponse.json(
        { success: false, error: tokenResult.error || 'Failed to generate setup token' },
        { status: 500 }
      );
    }

    // Send welcome email with new token
    console.log('Sending welcome email to:', affiliate.email);
    const emailResult = await sendAffiliateWelcomeEmail({
      email: affiliate.email,
      name: affiliate.name,
      setupToken: tokenResult.setupToken,
      affiliateCode: affiliate.code,
      commissionRate: affiliate.commission_rate,
    });
    console.log('Email send result:', emailResult);

    if (!emailResult.success) {
      console.error('Email send failed:', emailResult.error);
      return NextResponse.json(
        { success: false, error: emailResult.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log('Successfully resent welcome email to:', affiliate.email);
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
