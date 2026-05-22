import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { dbService } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'peace-shores-candle-wall-secret';

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '-salt-praywithme').digest('hex');
}

export function generateToken(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + signature;
}

export function verifyToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const payloadStr = Buffer.from(parts[0], 'base64').toString('utf-8');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('hex');
    if (signature !== parts[1]) return null;
    
    const payload = JSON.parse(payloadStr);
    if (payload.exp < Date.now()) return null;
    return payload.userId;
  } catch (e) {
    return null;
  }
}

export async function getAuthenticatedUser(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) return null;

    const user = await dbService.getUserById(userId);
    return user || null;
  } catch (e) {
    return null;
  }
}
