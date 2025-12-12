import { NextRequest, NextResponse } from 'next/server';
import {
  createAffiliateWithSetupToken,
  createUser,
  getAffiliateByEmail,
} from '@/lib/supabase';
import { sendAffiliateWelcomeEmail, sendNewAffiliateAdminNotification } from '@/lib/email';

// Increase timeout for bulk operations (60 seconds on Pro plan, 10 on Hobby)
export const maxDuration = 60;

interface AffiliateInput {
  name: string;
  email: string;
}

interface ImportResult {
  email: string;
  name: string;
  success: boolean;
  error?: string;
  affiliateCode?: string;
  welcomeEmailSent?: boolean;
  adminNotificationSent?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { affiliates } = body as { affiliates: AffiliateInput[] };

    // Validate input
    if (!affiliates || !Array.isArray(affiliates) || affiliates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No affiliates provided' },
        { status: 400 }
      );
    }

    // Limit to prevent abuse/timeout
    if (affiliates.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Maximum 100 affiliates per import' },
        { status: 400 }
      );
    }

    const results: ImportResult[] = [];
    let imported = 0;
    let failed = 0;

    // Default values
    const DEFAULT_COMMISSION_RATE = 0.30; // 30%
    const DEFAULT_CREDITS = 5;

    // Process each affiliate
    for (const affiliate of affiliates) {
      const { name, email } = affiliate;

      // Validate required fields
      if (!name || !name.trim()) {
        results.push({
          email: email || 'unknown',
          name: name || 'unknown',
          success: false,
          error: 'Missing name',
        });
        failed++;
        continue;
      }

      if (!email || !email.trim()) {
        results.push({
          email: 'unknown',
          name: name,
          success: false,
          error: 'Missing email',
        });
        failed++;
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const trimmedEmail = email.trim().toLowerCase();
      if (!emailRegex.test(trimmedEmail)) {
        results.push({
          email: trimmedEmail,
          name: name.trim(),
          success: false,
          error: 'Invalid email format',
        });
        failed++;
        continue;
      }

      // Check if affiliate already exists
      const existingAffiliate = await getAffiliateByEmail(trimmedEmail);
      if (existingAffiliate) {
        results.push({
          email: trimmedEmail,
          name: name.trim(),
          success: false,
          error: 'Affiliate already exists',
        });
        failed++;
        continue;
      }

      try {
        // Create affiliate with setup token
        const affiliateResult = await createAffiliateWithSetupToken({
          name: name.trim(),
          email: trimmedEmail,
          commission_rate: DEFAULT_COMMISSION_RATE,
        });

        if (!affiliateResult.success || !affiliateResult.affiliate || !affiliateResult.setupToken) {
          results.push({
            email: trimmedEmail,
            name: name.trim(),
            success: false,
            error: affiliateResult.error || 'Failed to create affiliate',
          });
          failed++;
          continue;
        }

        // Create user account with credits
        const userResult = await createUser({
          name: name.trim(),
          email: trimmedEmail,
          credits: DEFAULT_CREDITS,
          status: 'active',
          commission_rate: DEFAULT_COMMISSION_RATE,
        });

        if (!userResult.success) {
          console.error(`Failed to create user account for ${trimmedEmail}:`, userResult.error);
          // Don't fail the affiliate creation, just log
        }

        // Track email results
        let welcomeEmailSent = false;
        let adminNotificationSent = false;

        // Send welcome email (blocking to ensure delivery)
        console.log(`[${imported + 1}/${affiliates.length}] Sending welcome email to: ${trimmedEmail}`);
        try {
          const welcomeResult = await sendAffiliateWelcomeEmail({
            email: affiliateResult.affiliate.email,
            name: affiliateResult.affiliate.name,
            setupToken: affiliateResult.setupToken,
            affiliateCode: affiliateResult.affiliate.code,
            commissionRate: affiliateResult.affiliate.commission_rate,
          });
          welcomeEmailSent = welcomeResult.success;
          console.log(`Welcome email to ${trimmedEmail}: ${welcomeResult.success ? 'SUCCESS' : 'FAILED - ' + welcomeResult.error}`);
        } catch (err) {
          console.error(`Welcome email EXCEPTION for ${trimmedEmail}:`, err);
        }

        // Delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

        // Send admin notification (blocking to ensure delivery)
        console.log(`Sending admin notification for: ${trimmedEmail}`);
        try {
          const adminResult = await sendNewAffiliateAdminNotification({
            affiliateName: affiliateResult.affiliate.name,
            affiliateEmail: affiliateResult.affiliate.email,
            affiliateCode: affiliateResult.affiliate.code,
            commissionRate: affiliateResult.affiliate.commission_rate,
            source: 'CSV Import',
          });
          adminNotificationSent = adminResult.success;
          console.log(`Admin notification for ${trimmedEmail}: ${adminResult.success ? 'SUCCESS' : 'FAILED - ' + adminResult.error}`);
        } catch (err) {
          console.error(`Admin notification EXCEPTION for ${trimmedEmail}:`, err);
        }

        // Delay before next affiliate to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

        results.push({
          email: trimmedEmail,
          name: name.trim(),
          success: true,
          affiliateCode: affiliateResult.affiliate.code,
          welcomeEmailSent,
          adminNotificationSent,
        });
        imported++;

      } catch (err) {
        console.error(`Error processing affiliate ${trimmedEmail}:`, err);
        results.push({
          email: trimmedEmail,
          name: name.trim(),
          success: false,
          error: 'Unexpected error during creation',
        });
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      failed,
      total: affiliates.length,
      results,
    });

  } catch (error) {
    console.error('Bulk import API error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
