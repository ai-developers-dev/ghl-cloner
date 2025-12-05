import { NextRequest, NextResponse } from 'next/server';
import { useCredit } from '@/lib/supabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { license_key, funnel_id, step_id } = body;

    if (!license_key) {
      return NextResponse.json(
        { success: false, error: 'License key is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate format: GHLC-XXXX-XXXX-XXXX
    const licenseFormat = /^GHLC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!licenseFormat.test(license_key)) {
      return NextResponse.json(
        { success: false, error: 'Invalid license key format' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Use credit (deduct 1 credit and log transaction)
    const result = await useCredit(
      license_key,
      funnel_id || 'unknown',
      step_id || 'unknown'
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'User not found' ? 404 : 402, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      remaining_credits: result.remaining_credits,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Use credit error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
