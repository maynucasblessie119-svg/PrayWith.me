import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '../../../../lib/db.js';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const user = await dbService.getUserByEmail(email);
    if (!user) {
      // Safe privacy behavior
      return NextResponse.json({ success: true, message: 'If an account exists, a temporary security pin was sent.' });
    }

    // Generate 6 digit pin
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
    await dbService.setResetCode(email, pinCode);

    console.log(`[Email Gateway Sandbox] Sent Password Reset PIN: ${pinCode} to email ${email}`);

    return NextResponse.json({
      success: true,
      message: 'If an account exists, a temporary security pin was sent.',
      devPinCode: pinCode // Return pin for local sandboxed app tests or manual confirmation
    });
  } catch (error) {
    console.error('API Error in POST /api/auth/reset-request:', error);
    return NextResponse.json({ error: 'Failed to process reset request.' }, { status: 500 });
  }
}
