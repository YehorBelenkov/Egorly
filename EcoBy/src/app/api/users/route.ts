import { NextResponse, NextRequest } from 'next/server';
import { dbHelpers } from '@/lib/db';

export async function GET() {
  try {
    const users = dbHelpers.getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    dbHelpers.deleteUser(parseInt(id));
    return NextResponse.json({ success: true, message: 'User removed from pool' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const reset = dbHelpers.resetUserStats(parseInt(id));

    if (!reset) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'User stats reset' });
  } catch (error) {
    console.error('Error resetting user stats:', error);
    return NextResponse.json({ error: 'Failed to reset user stats' }, { status: 500 });
  }
}
