import { NextRequest, NextResponse } from 'next/server';
import {
  createAffiliateWithSetupToken,
  getAffiliateByEmail,
  generateAffiliateCode
} from '@/lib/supabase';
import { sendAffiliateWelcomeEmail, sendNewAffiliateAdminNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if affiliate already exists
    const existingAffiliate = await getAffiliateByEmail(email);
    if (existingAffiliate) {
      return NextResponse.json(
        { success: false, error: 'An affiliate account with this email already exists. Please log in to your dashboard.' },
        { status: 409 }
      );
    }

    // Create the affiliate with a setup token
    const result = await createAffiliateWithSetupToken({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      commission_rate: 0.20, // 20% default commission
    });

    if (!result.success || !result.affiliate) {
      console.error('Failed to create affiliate:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create affiliate account' },
        { status: 500 }
      );
    }

    // Send welcome email with setup link
    const emailResult = await sendAffiliateWelcomeEmail({
      email: result.affiliate.email,
      name: result.affiliate.name,
      setupToken: result.setupToken!,
      affiliateCode: result.affiliate.code,
      commissionRate: result.affiliate.commission_rate,
    });

    if (!emailResult.success) {
      console.error('Failed to send welcome email:', emailResult.error);
      // Don't fail the signup if email fails - they can contact support
    }

    // Send admin notification
    const adminNotifyResult = await sendNewAffiliateAdminNotification({
      affiliateName: result.affiliate.name,
      affiliateEmail: result.affiliate.email,
      affiliateCode: result.affiliate.code,
      commissionRate: result.affiliate.commission_rate,
      source: 'Public Signup',
    });

    if (!adminNotifyResult.success) {
      console.error('Failed to send admin notification:', adminNotifyResult.error);
      // Don't fail the signup if admin notification fails
    }

    // Log the phone number for future reference (could be stored in a notes field if needed)
    if (phone) {
      console.log(`New affiliate signup - Phone: ${phone}, Email: ${email}, Name: ${name}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Your affiliate account has been created! Check your email for instructions to set up your password.',
      affiliateCode: result.affiliate.code,
    });

  } catch (error) {
    console.error('Affiliate signup error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
