import { NextRequest, NextResponse } from 'next/server';
import { getScraperInstance } from '@/lib/scraper/instance';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Get the shared scraper instance
    const scraperInstance = getScraperInstance();

    // Check if already connected
    const status = scraperInstance.getConnectionStatus();
    if (status.isConnected) {
      return NextResponse.json({
        error: 'Already connected to a live stream. Disconnect first.',
        currentUsername: status.username
      }, { status: 400 });
    }

    // Clear all existing users before connecting to new stream
    scraperInstance.clearAllUsers();
    console.log('🗑️  Cleared all users for new stream');

    // Connect to TikTok live stream
    const result = await scraperInstance.connect(username);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        username
      });
    } else {
      return NextResponse.json({
        error: result.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Connect API error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to connect to TikTok live stream'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const scraperInstance = getScraperInstance();
    const status = scraperInstance.getConnectionStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
