import { NextRequest, NextResponse } from 'next/server';
import { startTest, TestConfig } from '@/lib/k6Manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const config: TestConfig = {
      url: body.url,
      method: body.method || 'GET',
      vus: Number(body.vus) || 10,
      duration: body.duration || '30s',
      headers: body.headers || {},
      body: body.body || '',
      stages: body.stages || [],
      thresholds: body.thresholds || {},
    };

    const result = startTest(config);

    return NextResponse.json({
      testId: result.testId,
      status: 'running',
    });
  } catch (err) {
    console.error('Failed to start test:', err);
    return NextResponse.json(
      { error: 'Failed to start test' },
      { status: 500 }
    );
  }
}
