import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '../../../../lib/db.js';
import { hashPassword, generateToken } from '../../../../lib/auth.js';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'All fields (name, email, password) are required.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const existing = await dbService.getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }

    const hashed = hashPassword(password);
    const user = await dbService.createUser(email, hashed, name);
    const token = generateToken(user.id);

    return NextResponse.json({ user, token }, { status: 201 });
  } catch (error) {
    console.error('API Error in POST /api/auth/register:', error);
    return NextResponse.json({ error: 'Failed to complete registration.' }, { status: 500 });
  }
}
