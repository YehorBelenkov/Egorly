import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { winnerId, tiktokUsername, screenshotUrl, contactDescription, contactMethod, paymentMethod } = body;

    // Validate required fields
    if (!winnerId || !tiktokUsername || !screenshotUrl || !contactDescription || !contactMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if this winner has already claimed
    const existingClaim = dbHelpers.getClaimByWinnerId(winnerId);
    if (existingClaim) {
      return NextResponse.json(
        { error: 'This prize has already been claimed' },
        { status: 400 }
      );
    }

    // Submit the claim
    const claimId = dbHelpers.submitClaim({
      winnerId,
      tiktokUsername,
      screenshotUrl,
      contactDescription,
      contactMethod,
      paymentMethod
    });

    return NextResponse.json({ 
      success: true, 
      claimId,
      message: 'Claim submitted successfully' 
    });
  } catch (error) {
    console.error('Error submitting claim:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const claims = dbHelpers.getAllClaims();
    return NextResponse.json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
