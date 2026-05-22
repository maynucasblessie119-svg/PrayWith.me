import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '../../../lib/db.js';
import { hashIp } from '../../../lib/hashIp.js';

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }
  return '127.0.0.1';
}

export async function POST(req: NextRequest) {
  try {
    const { prayerId } = await req.json();
    if (!prayerId) {
      return NextResponse.json({ error: 'Prayer ID is required' }, { status: 400 });
    }

    const clientIp = getClientIp(req);
    const ipHash = hashIp(clientIp);

    // Enforce one heart per IP per prayer
    const alreadyHearted = await dbService.hasHearted(prayerId, ipHash);
    if (alreadyHearted) {
      return NextResponse.json({ error: 'You have already stood in solidarity with this prayer.' }, { status: 400 });
    }

    const updatedCount = await dbService.addHeart(prayerId, ipHash);
    return NextResponse.json({ success: true, heart_count: updatedCount });
  } catch (error) {
    console.error('API Error in POST /api/hearts:', error);
    return NextResponse.json({ error: 'Failed to love/stand with prayer' }, { status: 500 });
  }
}
