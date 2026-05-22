import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '../../../lib/db.js';

function isAdminAuthorized(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || 'peace';
  const headerPassword = req.headers.get('x-admin-password');
  
  const { searchParams } = new URL(req.url);
  const queryPassword = searchParams.get('adminPassword');

  const provided = headerPassword || queryPassword;
  return !!provided && provided === adminPassword;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAdminAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized access. Please provide the correct admin password.' }, { status: 401 });
    }

    const stats = await dbService.getStats();
    const prayers = await dbService.getAdminPrayers();
    return NextResponse.json({ stats, prayers });
  } catch (error) {
    console.error('API Error in GET /api/admin:', error);
    return NextResponse.json({ error: 'Failed to fetch administrator data' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!isAdminAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized access. Please provide the correct admin password.' }, { status: 401 });
    }

    const { prayerId, action } = await req.json();
    if (!prayerId || !action || !['approve', 'hide', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Valid prayerId and action ("approve" | "hide" | "delete") are required.' }, { status: 400 });
    }

    const success = await dbService.updatePrayerStatus(prayerId, action);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('API Error in PATCH /api/admin:', error);
    return NextResponse.json({ error: 'Failed to execute administrative action.' }, { status: 500 });
  }
}
