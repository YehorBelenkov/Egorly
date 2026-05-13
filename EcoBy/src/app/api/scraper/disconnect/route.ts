import { NextResponse } from 'next/server';
import { getScraperInstance } from '@/lib/scraper/instance';

export async function POST() {
  try {
    const scraperInstance = getScraperInstance();
    scraperInstance.disconnect();

    return NextResponse.json({
      success: true,
      message: 'Disconnected from live stream'
    });
  } catch (error: any) {
    console.error('Disconnect API error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to disconnect'
    }, { status: 500 });
  }
}
