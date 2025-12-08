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
interface AdminNotificationParams {
  customerEmail: string;
  customerName: string;
  tierName: string;
  credits: number;
  amount: number; // in cents
}

export async function sendAdminNotificationEmail({
  customerEmail,
  customerName,
  tierName,
  credits,
  amount,
}: AdminNotificationParams): Promise<{ success: boolean; error?: string }> {
  const amountInDollars = (amount / 100).toFixed(2);
  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  try {
    const { error } = await resend.emails.send({
      from: 'HLExtras <noreply@hlextras.com>',
      to: ADMIN_EMAIL,
      subject: `💰 New Sale: ${tierName} - $${amountInDollars}`,
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
