import { NextRequest, NextResponse } from 'next/server';
import { stopTest } from '@/lib/k6Manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.testId) {
      return NextResponse.json({ error: 'testId is required' }, { status: 400 });
    }

    const success = stopTest(body.testId);

    if (!success) {
      return NextResponse.json({ error: 'Test not found or already stopped' }, { status: 404 });
    }

    return NextResponse.json({ status: 'stopped' });
  } catch (err) {
    console.error('Failed to stop test:', err);
    return NextResponse.json(
      { error: 'Failed to stop test' },
      { status: 500 }
    );
  }
}
