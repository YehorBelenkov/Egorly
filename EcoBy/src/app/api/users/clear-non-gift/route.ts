import { NextResponse } from 'next/server';
import { dbHelpers } from '@/lib/firestoreDb';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST() {
  try {
    const removedCount = await dbHelpers.clearNonGiftUsers();

    return NextResponse.json({
      success: true,
      message: `Removed ${removedCount} non-gift users (comment/like only)`,
      removedCount
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Clear non-gift users API error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to clear non-gift users'
    }, { status: 500, headers: corsHeaders });
  }
}
