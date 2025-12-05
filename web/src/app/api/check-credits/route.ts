import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const licenseKey = searchParams.get('license_key');

    if (!licenseKey) {
      return NextResponse.json(
        { error: 'License key is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate format: GHLC-XXXX-XXXX-XXXX
    const licenseFormat = /^GHLC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!licenseFormat.test(licenseKey)) {
      return NextResponse.json(
        { error: 'Invalid license key format' },
        { status: 400, headers: corsHeaders }
      );
    }

    const user = await getUser(licenseKey);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'License is inactive', credits: 0, status: user.status },
        { status: 403, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      credits: user.credits,
      status: user.status,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Check credits error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
