import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '../../../../lib/db.js';
import { hashPassword, generateToken } from '../../../../lib/auth.js';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const userWithHash = await dbService.getUserByEmail(email);
    if (!userWithHash) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
    }

    const hashed = hashPassword(password);
    if (userWithHash.password_hash !== hashed) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
    }

    const token = generateToken(userWithHash.id);
    const { password_hash: _, ...user } = userWithHash;

    return NextResponse.json({ user, token });
  } catch (error) {
    console.error('API Error in POST /api/auth/login:', error);
    return NextResponse.json({ error: 'Failed to process login request.' }, { status: 500 });
  }
}
