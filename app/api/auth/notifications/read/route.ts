import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '../../../../../lib/db.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Session expired or invalid token' }, { status: 401 });
    }

    await dbService.markNotificationsRead(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error in POST /api/auth/notifications/read:', error);
    return NextResponse.json({ error: 'Failed to dismiss activity feed notifications.' }, { status: 500 });
  }
}
