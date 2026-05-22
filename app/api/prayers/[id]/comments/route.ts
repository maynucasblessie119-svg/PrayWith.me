import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '../../../../../lib/db.js';
import { hashIp } from '../../../../../lib/hashIp.js';

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }
  return '127.0.0.1';
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const paramsResolved = await context.params;
    const { id } = paramsResolved;
    if (!id) {
      return NextResponse.json({ error: 'Prayer ID is required' }, { status: 400 });
    }
    
    const comments = await dbService.getComments(id);
    return NextResponse.json(comments);
  } catch (error) {
    console.error('API Error in GET comments:', error);
    return NextResponse.json({ error: 'Failed to retrieve comments' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const paramsResolved = await context.params;
    const { id } = paramsResolved;
    if (!id) {
      return NextResponse.json({ error: 'Prayer ID is required' }, { status: 400 });
    }

    const { text } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Comment text cannot be empty' }, { status: 400 });
    }
    if (text.length > 200) {
      return NextResponse.json({ error: 'Comment must be 200 characters or fewer.' }, { status: 400 });
    }

    const clientIp = getClientIp(req);
    const ipHash = hashIp(clientIp);

    const comment = await dbService.addComment(id, text.trim(), ipHash);
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('API Error in POST comment:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
