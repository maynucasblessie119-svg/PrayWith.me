import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '../../../../lib/db.js';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const paramsResolved = await context.params;
    const { id } = paramsResolved;
    if (!id) {
      return NextResponse.json({ error: 'Prayer ID is required' }, { status: 400 });
    }
    
    const prayer = await dbService.getPrayerById(id);
    if (!prayer) {
      return NextResponse.json({ error: 'Prayer request not found' }, { status: 404 });
    }
    return NextResponse.json(prayer);
  } catch (error) {
    console.error('API Error in GET /api/prayers/[id]:', error);
    return NextResponse.json({ error: 'Failed to retrieve prayer detail' }, { status: 500 });
  }
}
