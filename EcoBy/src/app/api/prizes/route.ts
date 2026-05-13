import { NextResponse } from 'next/server';
import { dbHelpers } from '@/lib/db';

export async function GET() {
  try {
    const prizes = dbHelpers.getAllPrizes();
    return NextResponse.json(prizes);
  } catch (error) {
    console.error('Error fetching prizes:', error);
    return NextResponse.json({ error: 'Failed to fetch prizes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, value, description, probability, isActive } = body;

    if (!name || !type || !value) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = dbHelpers.addPrize({
      name,
      type,
      value,
      description,
      probability: probability || 100,
      isActive: isActive !== undefined ? isActive : true
    });

    return NextResponse.json({ id, message: 'Prize added successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error adding prize:', error);
    return NextResponse.json({ error: 'Failed to add prize' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Prize ID is required' }, { status: 400 });
    }

    const success = dbHelpers.updatePrize(id, updates);

    if (!success) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Prize updated successfully' });
  } catch (error) {
    console.error('Error updating prize:', error);
    return NextResponse.json({ error: 'Failed to update prize' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Prize ID is required' }, { status: 400 });
    }

    const success = dbHelpers.deletePrize(parseInt(id));

    if (!success) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Prize deleted successfully' });
  } catch (error) {
    console.error('Error deleting prize:', error);
    return NextResponse.json({ error: 'Failed to delete prize' }, { status: 500 });
  }
}
