import { NextResponse } from 'next/server';
import { dbHelpers } from '@/lib/db';

export async function GET() {
  try {
    const winners = dbHelpers.getAllWinners();
    return NextResponse.json(winners);
  } catch (error) {
    console.error('Error fetching winners:', error);
    return NextResponse.json({ error: 'Failed to fetch winners' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, prizeId } = body;

    if (!userId || !prizeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = dbHelpers.recordWinner(userId, prizeId);

    return NextResponse.json({ id, message: 'Winner recorded successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error recording winner:', error);
    return NextResponse.json({ error: 'Failed to record winner' }, { status: 500 });
  }
}
