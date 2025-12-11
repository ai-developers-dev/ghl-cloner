import { NextRequest, NextResponse } from 'next/server';
import {
  createAffiliateWithSetupToken,
  createUser,
} from '@/lib/supabase';
import { sendAffiliateWelcomeEmail, sendNewAffiliateAdminNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, commissionRate, credits } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Create new affiliate with setup token
    const result = await createAffiliateWithSetupToken({
      name,
      email,
      commission_rate: commissionRate,
    });

    if (!result.success || !result.affiliate || !result.setupToken) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create affiliate' },
        { status: 500 }
      );
    }

    // Also create a user account with credits so the affiliate can use the extension
    const userResult = await createUser({
      name,
      email,
      credits: credits || 5,
      status: 'active',
      commission_rate: commissionRate,
    });

    if (!userResult.success) {
      console.error('Failed to create user account for affiliate:', userResult.error);
      // Don't fail - affiliate was created, they just won't have credits yet
    }

    // Send welcome email with setup link
    console.log('Sending affiliate welcome email to:', result.affiliate.email);
    const emailResult = await sendAffiliateWelcomeEmail({
      email: result.affiliate.email,
      name: result.affiliate.name,
      setupToken: result.setupToken,
      affiliateCode: result.affiliate.code,
      commissionRate: result.affiliate.commission_rate,
    });

    if (!emailResult.success) {
      console.error('Failed to send welcome email:', emailResult.error);
    } else {
      console.log('Welcome email sent successfully');
    }

    // Send admin notification
    console.log('Sending admin notification for new affiliate');
    const adminNotifyResult = await sendNewAffiliateAdminNotification({
      affiliateName: result.affiliate.name,
      affiliateEmail: result.affiliate.email,
      affiliateCode: result.affiliate.code,
      commissionRate: result.affiliate.commission_rate,
      source: 'Admin Created',
    });

    if (!adminNotifyResult.success) {
      console.error('Failed to send admin notification:', adminNotifyResult.error);
    } else {
      console.log('Admin notification sent successfully');
    }

    return NextResponse.json({
      success: true,
      affiliate: result.affiliate,
      setupToken: result.setupToken,
      emailSent: emailResult.success,
      adminNotified: adminNotifyResult.success,
    });

  } catch (error) {
    console.error('Create affiliate API error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
