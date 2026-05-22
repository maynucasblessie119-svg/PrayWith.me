import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '../../../../lib/db.js';
import { getAuthenticatedUser } from '../../../../lib/auth.js';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Session expired or invalid token' }, { status: 401 });
    }

    const list = await dbService.getNotifications(user.id);
    return NextResponse.json(list);
  } catch (error) {
    console.error('API Error in GET /api/auth/notifications:', error);
    return NextResponse.json({ error: 'Failed to retrieve interaction notifications.' }, { status: 500 });
  }
}
