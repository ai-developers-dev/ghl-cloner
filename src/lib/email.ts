import { Resend } from 'resend';

// Handle missing key gracefully for build time
const resendApiKey = process.env.RESEND_API_KEY || 're_placeholder';
const resend = new Resend(resendApiKey);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'doug@aideveloper.dev';
const DOWNLOAD_PAGE_URL = 'https://hlextras.com/download';

interface SendLicenseEmailParams {
  email: string;
  name: string;
  licenseKey: string;
  credits: number;
  tierName: string;
}

export async function sendLicenseEmail({
  email,
  name,
  licenseKey,
  credits,
  tierName,
}: SendLicenseEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: 'HLExtras <noreply@hlextras.com>',
      to: email,
      subject: `Your HLExtras License Key - ${credits} Credits`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="display: inline-block; width: 60px; height: 60px; border-radius: 12px; background: linear-gradient(135deg, #34d399, #06b6d4); line-height: 60px; font-size: 24px; font-weight: bold; color: #0f172a;">HE</div>
              <h1 style="color: #ffffff; font-size: 24px; margin: 16px 0 0 0;">HLExtras</h1>
            </div>

            <!-- Main Content -->
            <div style="background-color: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155;">
              <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 8px 0;">Thank You for Your Purchase!</h2>
              <p style="color: #94a3b8; margin: 0 0 24px 0;">Hi ${name || 'there'},</p>

              <p style="color: #94a3b8; margin: 0 0 24px 0;">
                Your purchase of the <strong style="color: #34d399;">${tierName}</strong> package has been confirmed.
                You now have <strong style="color: #34d399;">${credits} credits</strong> ready to use.
              </p>

              <!-- License Key Box -->
              <div style="background-color: #0f172a; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; border: 2px solid #34d399;">
                <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Your License Key</p>
                <p style="color: #34d399; font-size: 24px; font-weight: bold; font-family: monospace; margin: 0; letter-spacing: 2px;">${licenseKey}</p>
              </div>

              <p style="color: #94a3b8; font-size: 14px; margin: 0 0 24px 0;">
                Save this license key somewhere safe. You'll need it to activate the Chrome extension.
              </p>

              <!-- CTA Buttons -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${DOWNLOAD_PAGE_URL}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #34d399, #06b6d4); color: #0f172a; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">
                  Download & Install Extension
                </a>
              </div>

              <!-- Steps -->
              <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; margin-top: 24px;">
                <p style="color: #ffffff; font-weight: bold; margin: 0 0 16px 0;">Getting Started:</p>
                <ol style="color: #94a3b8; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Download & install the Chrome extension from the link above</li>
                  <li style="margin-bottom: 8px;">Click the HLExtras icon in your browser toolbar</li>
                  <li style="margin-bottom: 8px;">Enter your license key when prompted</li>
                  <li style="margin-bottom: 8px;">Navigate to any GHL funnel page and click "Copy"</li>
                  <li style="margin-bottom: 0;">Go to your funnel and click "Paste" - done!</li>
                </ol>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 32px;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                Need help? Reply to this email or visit <a href="${DOWNLOAD_PAGE_URL}" style="color: #34d399;">our installation guide</a>.
              </p>
              <p style="color: #475569; font-size: 12px; margin: 16px 0 0 0;">
                © ${new Date().getFullYear()} HLExtras. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Admin notification email for new sales
interface SalesReportSummary {
  salesCount: number;
  totalRevenue: number; // in cents
  totalCredits: number;
  totalAffiliateCommissions: number; // in cents
}

interface AdminNotificationParams {
  customerEmail: string;
  customerName: string;
  tierName: string;
  credits: number;
  amount: number; // in cents
  // Optional sales reports - if provided, will show daily/monthly totals
  dailyReport?: SalesReportSummary;
  monthlyReport?: SalesReportSummary;
}

export async function sendAdminNotificationEmail({
  customerEmail,
  customerName,
  tierName,
  credits,
  amount,
  dailyReport,
  monthlyReport,
}: AdminNotificationParams): Promise<{ success: boolean; error?: string }> {
  const amountInDollars = (amount / 100).toFixed(2);
  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Format report numbers
  const dailyRevenue = dailyReport ? (dailyReport.totalRevenue / 100).toFixed(2) : '0.00';
  const dailySales = dailyReport?.salesCount || 0;
  const dailyCredits = dailyReport?.totalCredits || 0;
  const dailyCommissions = dailyReport ? (dailyReport.totalAffiliateCommissions / 100).toFixed(2) : '0.00';

  const monthlyRevenue = monthlyReport ? (monthlyReport.totalRevenue / 100).toFixed(2) : '0.00';
  const monthlySales = monthlyReport?.salesCount || 0;
  const monthlyCredits = monthlyReport?.totalCredits || 0;
  const monthlyCommissions = monthlyReport ? (monthlyReport.totalAffiliateCommissions / 100).toFixed(2) : '0.00';

  // Get current month name
  const monthName = new Date().toLocaleString('en-US', { month: 'long' });

  try {
    const { error } = await resend.emails.send({
      from: 'HLExtras <noreply@hlextras.com>',
      to: ADMIN_EMAIL,
      subject: `💰 New Sale: ${tierName} - $${amountInDollars} | Today: $${dailyRevenue}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="display: inline-block; width: 60px; height: 60px; border-radius: 12px; background: linear-gradient(135deg, #34d399, #06b6d4); line-height: 60px; font-size: 24px; font-weight: bold; color: #0f172a;">HE</div>
              <h1 style="color: #ffffff; font-size: 24px; margin: 16px 0 0 0;">New HLExtras Sale!</h1>
            </div>

            <!-- Sale Details -->
            <div style="background-color: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #94a3b8; padding: 12px 0; border-bottom: 1px solid #334155;">Customer</td>
                  <td style="color: #ffffff; padding: 12px 0; border-bottom: 1px solid #334155; text-align: right; font-weight: bold;">${customerName}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 12px 0; border-bottom: 1px solid #334155;">Email</td>
                  <td style="color: #34d399; padding: 12px 0; border-bottom: 1px solid #334155; text-align: right;">${customerEmail}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 12px 0; border-bottom: 1px solid #334155;">Package</td>
                  <td style="color: #ffffff; padding: 12px 0; border-bottom: 1px solid #334155; text-align: right; font-weight: bold;">${tierName}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 12px 0; border-bottom: 1px solid #334155;">Credits</td>
                  <td style="color: #ffffff; padding: 12px 0; border-bottom: 1px solid #334155; text-align: right;">${credits}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 12px 0; border-bottom: 1px solid #334155;">Amount</td>
                  <td style="color: #34d399; padding: 12px 0; border-bottom: 1px solid #334155; text-align: right; font-weight: bold; font-size: 18px;">$${amountInDollars}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 12px 0;">Time</td>
                  <td style="color: #ffffff; padding: 12px 0; text-align: right;">${timestamp}</td>
                </tr>
              </table>
            </div>

            <!-- Sales Reports Section -->
            <div style="margin-top: 24px;">
              <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 16px 0;">📊 Sales Summary</h2>

              <!-- Today's Stats -->
              <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 12px;">
                <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Today</div>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #94a3b8; padding: 6px 0;">Revenue</td>
                    <td style="color: #34d399; padding: 6px 0; text-align: right; font-weight: bold; font-size: 16px;">$${dailyRevenue}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 6px 0;">Sales</td>
                    <td style="color: #ffffff; padding: 6px 0; text-align: right;">${dailySales}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 6px 0;">Credits Sold</td>
                    <td style="color: #ffffff; padding: 6px 0; text-align: right;">${dailyCredits}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 6px 0;">Affiliate Commissions</td>
                    <td style="color: #f59e0b; padding: 6px 0; text-align: right;">$${dailyCommissions}</td>
                  </tr>
                </table>
              </div>

              <!-- This Month's Stats -->
              <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155;">
                <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">${monthName}</div>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #94a3b8; padding: 6px 0;">Revenue</td>
                    <td style="color: #34d399; padding: 6px 0; text-align: right; font-weight: bold; font-size: 16px;">$${monthlyRevenue}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 6px 0;">Sales</td>
                    <td style="color: #ffffff; padding: 6px 0; text-align: right;">${monthlySales}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 6px 0;">Credits Sold</td>
                    <td style="color: #ffffff; padding: 6px 0; text-align: right;">${monthlyCredits}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 6px 0;">Affiliate Commissions</td>
                    <td style="color: #f59e0b; padding: 6px 0; text-align: right;">$${monthlyCommissions}</td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-top: 32px;">
              <a href="https://dashboard.stripe.com/payments" style="display: inline-block; padding: 12px 24px; background-color: #635bff; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">
                View in Stripe Dashboard →
              </a>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Admin notification email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Admin notification email error:', error);
    return { success: false, error: 'Failed to send admin notification' };
  }
}

// Admin notification for new affiliate signups
interface NewAffiliateAdminNotificationParams {
  affiliateName: string;
  affiliateEmail: string;
  affiliateCode: string;
  commissionRate: number;
  source: 'Public Signup' | 'Admin Created' | 'CSV Import';
}

export async function sendNewAffiliateAdminNotification({
  affiliateName,
  affiliateEmail,
  affiliateCode,
  commissionRate,
  source,
}: NewAffiliateAdminNotificationParams): Promise<{ success: boolean; error?: string }> {
  const commissionPercent = Math.round(commissionRate * 100);
  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  try {
    const { error } = await resend.emails.send({
      from: 'HLExtras <noreply@hlextras.com>',
      to: ADMIN_EMAIL,
      subject: `🤝 New Affiliate: ${affiliateName} (${source})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="display: inline-block; width: 60px; height: 60px; border-radius: 12px; background: linear-gradient(135deg, #34d399, #06b6d4); line-height: 60px; font-size: 24px; font-weight: bold; color: #0f172a;">HE</div>
              <h1 style="color: #ffffff; font-size: 24px; margin: 16px 0 0 0;">New Affiliate Joined!</h1>
            </div>

            <!-- Affiliate Details -->
            <div style="background-color: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #94a3b8; padding: 12px 0; border-bottom: 1px solid #334155;">Name</td>
                  <td style="color: #ffffff; padding: 12px 0; border-bottom: 1px solid #334155; text-align: right; font-weight: bold;">${affiliateName}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 12px 0; border-bottom: 1px solid #334155;">Email</td>
                  <td style="color: #34d399; padding: 12px 0; border-bottom: 1px solid #334155; text-align: right;">${affiliateEmail}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 12px 0; border-bottom: 1px solid #334155;">Affiliate Code</td>
                  <td style="color: #ffffff; padding: 12px 0; border-bottom: 1px solid #334155; text-align: right; font-family: monospace;">${affiliateCode}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 12px 0; border-bottom: 1px solid #334155;">Commission Rate</td>
                  <td style="color: #34d399; padding: 12px 0; border-bottom: 1px solid #334155; text-align: right; font-weight: bold;">${commissionPercent}%</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 12px 0; border-bottom: 1px solid #334155;">Source</td>
                  <td style="color: #ffffff; padding: 12px 0; border-bottom: 1px solid #334155; text-align: right;">${source}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 12px 0;">Time</td>
                  <td style="color: #ffffff; padding: 12px 0; text-align: right;">${timestamp}</td>
                </tr>
              </table>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-top: 32px;">
              <a href="https://hlextras.com/admin" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #34d399, #06b6d4); color: #0f172a; text-decoration: none; border-radius: 8px; font-weight: bold;">
                View in Admin Dashboard →
              </a>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('New affiliate admin notification error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('New affiliate admin notification error:', error);
    return { success: false, error: 'Failed to send admin notification' };
  }
}

// Affiliate welcome email with setup link
interface AffiliateWelcomeEmailParams {
  email: string;
  name: string;
  setupToken: string;
  affiliateCode: string;
  commissionRate: number;
}

export async function sendAffiliateWelcomeEmail({
  email,
  name,
  setupToken,
  affiliateCode,
  commissionRate,
}: AffiliateWelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  const setupUrl = `https://hlextras.com/affiliate/setup?token=${setupToken}`;
  const referralUrl = `https://hlextras.com/cloner?ref=${affiliateCode}`;
  const commissionPercent = Math.round(commissionRate * 100);
  // Extract first name from full name
  const firstName = name.split(' ')[0];

  try {
    const { error } = await resend.emails.send({
      from: 'HLExtras <noreply@hlextras.com>',
      to: email,
      subject: `Welcome to the HLExtras Affiliate Program!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="display: inline-block; width: 60px; height: 60px; border-radius: 12px; background: linear-gradient(135deg, #34d399, #06b6d4); line-height: 60px; font-size: 24px; font-weight: bold; color: #0f172a;">HE</div>
              <h1 style="color: #ffffff; font-size: 24px; margin: 16px 0 0 0;">Welcome to the Affiliate Program!</h1>
            </div>

            <!-- Main Content -->
            <div style="background-color: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155;">
              <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 8px 0;">Hi ${firstName}!</h2>
              <p style="color: #94a3b8; margin: 0 0 24px 0;">
                You've been invited to join the HLExtras affiliate program. Earn <strong style="color: #34d399;">${commissionPercent}% commission</strong> on every sale you refer!
              </p>

              <!-- Free Credits Box -->
              <div style="background-color: #059669; background: linear-gradient(135deg, #059669, #0d9488); border-radius: 12px; padding: 20px; margin: 0 0 24px 0;">
                <p style="color: #ffffff; font-weight: bold; font-size: 16px; margin: 0 0 8px 0;">🎁 Welcome Gift: 5 Free Credits!</p>
                <p style="color: #d1fae5; margin: 0; font-size: 14px;">
                  We've added <strong>5 free credits</strong> to your account so you can try HL Cloner yourself. Experience the product firsthand - it'll help you promote it better!
                </p>
              </div>

              <!-- Commission Box -->
              <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #334155;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                  <span style="color: #94a3b8;">Your Commission Rate</span>
                  <span style="color: #34d399; font-weight: bold; font-size: 20px;">${commissionPercent}%</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #94a3b8;">Your Referral Code</span>
                  <span style="color: #ffffff; font-weight: bold; font-family: monospace;">${affiliateCode}</span>
                </div>
              </div>

              <p style="color: #94a3b8; margin: 0 0 24px 0;">
                To get started, you need to set up your password to access your affiliate dashboard where you can track your referrals and commissions.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${setupUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #34d399, #06b6d4); color: #0f172a; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">
                  Set Up Your Password
                </a>
              </div>

              <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0 0 24px 0;">
                This link expires in 7 days. If it expires, contact us for a new one.
              </p>

              <!-- Referral URL Box -->
              <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; border: 2px solid #34d399;">
                <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Your Referral Link</p>
                <p style="color: #34d399; font-size: 14px; font-family: monospace; margin: 0; word-break: break-all;">${referralUrl}</p>
              </div>

              <!-- How it Works -->
              <div style="margin-top: 32px;">
                <p style="color: #ffffff; font-weight: bold; margin: 0 0 16px 0;">How It Works:</p>
                <ol style="color: #94a3b8; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Share your unique referral link with your audience</li>
                  <li style="margin-bottom: 8px;">When someone clicks your link and makes a purchase, you earn ${commissionPercent}%</li>
                  <li style="margin-bottom: 8px;">Track your referrals and earnings in your affiliate dashboard</li>
                  <li style="margin-bottom: 0;">Get paid monthly for approved commissions</li>
                </ol>
              </div>

              <!-- About the Product -->
              <div style="margin-top: 32px; background-color: #0f172a; border-radius: 12px; padding: 20px; border: 1px solid #334155;">
                <p style="color: #ffffff; font-weight: bold; margin: 0 0 12px 0;">📋 About HL Cloner (The Product You're Promoting):</p>
                <p style="color: #94a3b8; margin: 0 0 12px 0;">
                  HL Cloner is a Chrome extension that lets users clone any GoHighLevel funnel page in seconds. Instead of rebuilding pages from scratch (2-4 hours), users can copy and paste an entire page design in 30 seconds.
                </p>
                <p style="color: #94a3b8; margin: 0 0 8px 0;"><strong style="color: #34d399;">How it works for customers:</strong></p>
                <ol style="color: #94a3b8; margin: 0 0 16px 0; padding-left: 20px;">
                  <li style="margin-bottom: 4px;">Install the Chrome extension</li>
                  <li style="margin-bottom: 4px;">Visit any GHL funnel page and click "Copy"</li>
                  <li style="margin-bottom: 4px;">Go to their own GHL builder and click "Paste"</li>
                  <li style="margin-bottom: 0;">Done! The page is cloned instantly</li>
                </ol>
                <p style="color: #94a3b8; margin: 0;">
                  <strong style="color: #ffffff;">Pricing:</strong> No subscriptions - customers buy credit packs. Each page clone uses 1 credit. Prices range from $25 (2 credits) to $500 (100 credits).
                </p>
              </div>

              <!-- Quick Links -->
              <div style="margin-top: 24px; text-align: center;">
                <p style="color: #94a3b8; font-size: 14px; margin: 0 0 12px 0;">Helpful Links:</p>
                <a href="https://hlextras.com/login" style="color: #34d399; margin: 0 12px; text-decoration: none;">Affiliate Dashboard</a>
                <span style="color: #475569;">|</span>
                <a href="https://hlextras.com/cloner" style="color: #34d399; margin: 0 12px; text-decoration: none;">Product Page</a>
                <span style="color: #475569;">|</span>
                <a href="https://hlextras.com/download" style="color: #34d399; margin: 0 12px; text-decoration: none;">Extension Download</a>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 32px;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                Questions? Reply to this email and we'll help you out.
              </p>
              <p style="color: #475569; font-size: 12px; margin: 16px 0 0 0;">
                © ${new Date().getFullYear()} HLExtras. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Affiliate welcome email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Affiliate welcome email error:', error);
    return { success: false, error: 'Failed to send affiliate welcome email' };
  }
}
