import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '../../../lib/db.js';

export async function POST(req: NextRequest) {
  try {
    const { prayerId, reason } = await req.json();
    if (!prayerId || !reason) {
      return NextResponse.json({ error: 'Prayer ID and report reason are required' }, { status: 400 });
    }

    await dbService.addReport(prayerId, reason);
    return NextResponse.json({ success: true, message: 'Prayer has been flagged for moderation.' });
  } catch (error) {
    console.error('API Error in POST /api/report:', error);
    return NextResponse.json({ error: 'Failed to report prayer' }, { status: 500 });
  }
}
