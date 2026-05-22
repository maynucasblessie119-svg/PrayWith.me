import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '../../../lib/db.js';
import { getAuthenticatedUser } from '../../../lib/auth.js';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Session expired or invalid token' }, { status: 401 });
    }

    const { endpoint, keys } = await req.json();
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json({ error: 'Valid subscription structure with endpoint and p256dh/auth keys is required.' }, { status: 400 });
    }

    await dbService.addPushSubscription(user.id, { endpoint, keys });
    return NextResponse.json({ success: true, message: 'Device sub validated and listed.' });
  } catch (error) {
    console.error('API Error in POST /api/push-subscription:', error);
    return NextResponse.json({ error: 'Failed to list device credentials.' }, { status: 500 });
  }
}
