import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '../../../lib/db.js';
import { hashIp } from '../../../lib/hashIp.js';
import { checkRateLimit, logRateLimit } from '../../../lib/rateLimit.js';
import { verifyToken } from '../../../lib/auth.js';
import { PrayerCategory } from '../../../src/types.js';

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }
  return '127.0.0.1';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const prayers = await dbService.getPrayers(category);
    return NextResponse.json(prayers);
  } catch (error) {
    console.error('API Error in GET /api/prayers:', error);
    return NextResponse.json({ error: 'Failed to retrieve prayers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { text, category, image_url } = await req.json();

    // 1. Validations
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Prayer text is required.' }, { status: 400 });
    }
    if (text.length > 280) {
      return NextResponse.json({ error: 'Prayer text must be 280 characters or fewer.' }, { status: 400 });
    }
    
    const validCategories: PrayerCategory[] = ['Healing', 'Family', 'Peace', 'Gratitude', 'Protection', 'Other'];
    if (!category || !validCategories.includes(category as PrayerCategory)) {
      return NextResponse.json({ error: `Please select a valid category: ${validCategories.join(', ')}` }, { status: 400 });
    }

    // 2. Hash IP
    const clientIp = getClientIp(req);
    const ipHash = hashIp(clientIp);

    // 3. Spam Protection Rate Limit
    const limitCheck = checkRateLimit(ipHash);
    if (!limitCheck.success) {
      return NextResponse.json({ error: limitCheck.error }, { status: 429 });
    }

    // 4. Save Prayer (link to registered account optionally)
    let authenticatedUserId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      authenticatedUserId = verifyToken(token);
    }

    const prayer = await dbService.addPrayer(text.trim(), category as PrayerCategory, image_url || null, ipHash, authenticatedUserId);
    
    // 5. Log the timestamp for Rate Limiting
    logRateLimit(ipHash);

    return NextResponse.json(prayer, { status: 201 });
  } catch (error) {
    console.error('API Error in POST /api/prayers:', error);
    return NextResponse.json({ error: 'Failed to share prayer request' }, { status: 500 });
  }
}
