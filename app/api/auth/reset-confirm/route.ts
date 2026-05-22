import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '../../../../lib/db.js';
import { hashPassword } from '../../../../lib/auth.js';

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();
    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'All fields (email, pin code, newPassword) are required.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
    }

    const nextHash = hashPassword(newPassword);
    const verified = await dbService.verifyResetCodeAndChangePassword(email, code, nextHash);

    if (!verified) {
      return NextResponse.json({ error: 'Invalid or expired temporary security pin.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Your password has been changed successfully. You can now login.' });
  } catch (error) {
    console.error('API Error in POST /api/auth/reset-confirm:', error);
    return NextResponse.json({ error: 'Failed to update credentials.' }, { status: 500 });
  }
}
