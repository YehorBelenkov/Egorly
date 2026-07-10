import { NextResponse, NextRequest } from 'next/server';
import { getScraperInstance } from '@/lib/scraper/instance';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const scraperInstance = getScraperInstance();
    const users = await scraperInstance.getAllUsers();
    return NextResponse.json(users, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400, headers: corsHeaders });
    }

    dbHelpers.deleteUser(parseInt(id));
    return NextResponse.json({ success: true, message: 'User removed from pool' }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400, headers: corsHeaders });
    }

    const reset = dbHelpers.resetUserStats(parseInt(id));

    if (!reset) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ success: true, message: 'User stats reset' }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error resetting user stats:', error);
    return NextResponse.json({ error: 'Failed to reset user stats' }, { status: 500, headers: corsHeaders });
  }
}
