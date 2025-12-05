import { NextRequest, NextResponse } from 'next/server';
import { validateLicense } from '@/lib/supabase';

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET(request: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const searchParams = request.nextUrl.searchParams;
    const licenseKey = searchParams.get('license_key');

    if (!licenseKey) {
      return NextResponse.json(
        { valid: false, error: 'License key is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate format: GHLC-XXXX-XXXX-XXXX
    const licenseFormat = /^GHLC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!licenseFormat.test(licenseKey)) {
      return NextResponse.json(
        { valid: false, error: 'Invalid license key format' },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await validateLicense(licenseKey);

    if (result.valid && result.user) {
      // Return user info (excluding sensitive data)
      return NextResponse.json({
        valid: true,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          credits: result.user.credits,
          status: result.user.status,
        },
      }, { headers: corsHeaders });
    }

    return NextResponse.json(
      { valid: false, error: result.error || 'Invalid license key' },
      { status: 401, headers: corsHeaders }
    );
  } catch (error) {
    console.error('License validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Server error' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
