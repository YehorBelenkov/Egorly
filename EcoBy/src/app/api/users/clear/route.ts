import { NextResponse } from 'next/server';
import { getScraperInstance } from '@/lib/scraper/instance';

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
    const scraperInstance = getScraperInstance();
    await scraperInstance.clearAllUsers();

    return NextResponse.json({
      success: true,
      message: 'All user data cleared successfully'
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Clear users API error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to clear user data'
    }, { status: 500, headers: corsHeaders });
  }
}
