import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '../../../../lib/db.js';
import { getAuthenticatedUser } from '../../../../lib/auth.js';

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Session expired or invalid token' }, { status: 401 });
    }

    const { notify_hearts, notify_comments, name } = await req.json();

    const updated = await dbService.updateUserPreferences(
      user.id,
      notify_hearts !== undefined ? Boolean(notify_hearts) : user.notify_hearts,
      notify_comments !== undefined ? Boolean(notify_comments) : user.notify_comments,
      name
    );

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('API Error in PATCH /api/auth/preferences:', error);
    return NextResponse.json({ error: 'Failed to save preferences.' }, { status: 500 });
  }
}
