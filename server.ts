import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { hashIp } from './lib/hashIp.js';
import { checkRateLimit, logRateLimit } from './lib/rateLimit.js';
import { dbService } from './lib/db.js';
import { PrayerCategory } from './src/types.js';

// Load environment variables
dotenv.config();

import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'peace-shores-candle-wall-secret';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '-salt-praywithme').digest('hex');
}

function generateToken(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + signature;
}

function verifyToken(token: string): string | null {
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

async function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Session expired or invalid token' });
    }

    const user = await dbService.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'User does not exist in our prayers database' });
    }

    (req as any).user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid auth payload' });
  }
}

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with increased payload size for base64 image support
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper to extract client IP address accurately
function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const list = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
    return list[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// ━━━ API ENDPOINTS ━━━

// GET /api/prayers - Fetch visible prayers, optionally filtered by category
app.get('/api/prayers', async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const prayers = await dbService.getPrayers(category);
    res.json(prayers);
  } catch (error) {
    console.error('API Error in GET /api/prayers:', error);
    res.status(500).json({ error: 'Failed to retrieve prayers' });
  }
});

// GET /api/prayers/:id - Fetch single prayer details
app.get('/api/prayers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prayer = await dbService.getPrayerById(id);
    if (!prayer) {
      return res.status(404).json({ error: 'Prayer request not found' });
    }
    res.json(prayer);
  } catch (error) {
    console.error('API Error in GET /api/prayers/:id:', error);
    res.status(500).json({ error: 'Failed to retrieve prayer detail' });
  }
});

// POST /api/prayers - Share a new prayer with validations and rate limiting
app.post('/api/prayers', async (req, res) => {
  try {
    const { text, category, image_url } = req.body;

    // 1. Validations
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Prayer text is required.' });
    }
    if (text.length > 280) {
      return res.status(400).json({ error: 'Prayer text must be 280 characters or fewer.' });
    }
    
    const validCategories: PrayerCategory[] = ['Healing', 'Family', 'Peace', 'Gratitude', 'Protection', 'Other'];
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({ error: `Please select a valid category: ${validCategories.join(', ')}` });
    }

    // 2. Hash IP
    const clientIp = getClientIp(req);
    const ipHash = hashIp(clientIp);

    // 3. Spam Protection Rate Limit
    const limitCheck = checkRateLimit(ipHash);
    if (!limitCheck.success) {
      return res.status(429).json({ error: limitCheck.error });
    }

    // 4. Save Prayer (link to registered account optionally)
    let authenticatedUserId: string | null = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      authenticatedUserId = verifyToken(token);
    }

    const prayer = await dbService.addPrayer(text.trim(), category, image_url || null, ipHash, authenticatedUserId);
    
    // 5. Log the timestamp for Rate Limiting
    logRateLimit(ipHash);

    res.status(201).json(prayer);
  } catch (error) {
    console.error('API Error in POST /api/prayers:', error);
    res.status(500).json({ error: 'Failed to share prayer request' });
  }
});

// POST /api/hearts - Heart a prayer request (one heart per IP per prayer)
app.post('/api/hearts', async (req, res) => {
  try {
    const { prayerId } = req.body;
    if (!prayerId) {
      return res.status(400).json({ error: 'Prayer ID is required' });
    }

    const clientIp = getClientIp(req);
    const ipHash = hashIp(clientIp);

    // Enforce one heart per IP per prayer
    const alreadyHearted = await dbService.hasHearted(prayerId, ipHash);
    if (alreadyHearted) {
      return res.status(400).json({ error: 'You have already stood in solidarity with this prayer.' });
    }

    const updatedCount = await dbService.addHeart(prayerId, ipHash);
    res.json({ success: true, heart_count: updatedCount });
  } catch (error) {
    console.error('API Error in POST /api/hearts:', error);
    res.status(500).json({ error: 'Failed to love/stand with prayer' });
  }
});

// GET /api/prayers/:id/comments - Retrieve comments for a prayer
app.get('/api/prayers/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await dbService.getComments(id);
    res.json(comments);
  } catch (error) {
    console.error('API Error in GET comments:', error);
    res.status(500).json({ error: 'Failed to retrieve comments' });
  }
});

// POST /api/prayers/:id/comments - Post an anonymous comment on a prayer
app.post('/api/prayers/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text cannot be empty' });
    }
    if (text.length > 200) {
      return res.status(400).json({ error: 'Comment must be 200 characters or fewer.' });
    }

    const clientIp = getClientIp(req);
    const ipHash = hashIp(clientIp);

    const comment = await dbService.addComment(id, text.trim(), ipHash);
    res.status(201).json(comment);
  } catch (error) {
    console.error('API Error in POST comment:', error);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// POST /api/report - File a report on a prayer criteria
app.post('/api/report', async (req, res) => {
  try {
    const { prayerId, reason } = req.body;
    if (!prayerId || !reason) {
      return res.status(400).json({ error: 'Prayer ID and report reason are required' });
    }

    await dbService.addReport(prayerId, reason);
    res.json({ success: true, message: 'Prayer has been flagged for moderation.' });
  } catch (error) {
    console.error('API Error in POST /api/report:', error);
    res.status(500).json({ error: 'Failed to report prayer' });
  }
});

// ━━━ ADMIN ENDPOINTS (SECRET GUARDED) ━━━

// Middleware to authenticate Admin
function adminProtectedRoute(req: express.Request, res: express.Response, next: express.NextFunction) {
  const adminPassword = process.env.ADMIN_PASSWORD || 'peace';
  const providedPassword = req.headers['x-admin-password'] || req.query.adminPassword;

  if (!providedPassword || providedPassword !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized access. Please provide the correct admin password.' });
  }
  next();
}

// GET /api/admin - Admin load stats and all prayers
app.get('/api/admin', adminProtectedRoute, async (req, res) => {
  try {
    const stats = await dbService.getStats();
    const prayers = await dbService.getAdminPrayers();
    res.json({ stats, prayers });
  } catch (error) {
    console.error('API Error in GET /api/admin:', error);
    res.status(500).json({ error: 'Failed to fetch administrator data' });
  }
});

// PATCH /api/admin - Update status of user prayer or delete it
app.patch('/api/admin', adminProtectedRoute, async (req, res) => {
  try {
    const { prayerId, action } = req.body;
    if (!prayerId || !action || !['approve', 'hide', 'delete'].includes(action)) {
      return res.status(400).json({ error: 'Valid prayerId and action ("approve" | "hide" | "delete") are required.' });
    }

    const success = await dbService.updatePrayerStatus(prayerId, action);
    res.json({ success });
  } catch (error) {
    console.error('API Error in PATCH /api/admin:', error);
    res.status(500).json({ error: 'Failed to execute administrative action.' });
  }
});


// ━━━ USER ACCOUNTS, AUTHENTICATION & NOTIFICATIONS ━━━

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields (name, email, password) are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = await dbService.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const hashed = hashPassword(password);
    const user = await dbService.createUser(email, hashed, name);
    const token = generateToken(user.id);

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('API Error in POST /api/auth/register:', error);
    res.status(500).json({ error: 'Failed to complete registration.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userWithHash = await dbService.getUserByEmail(email);
    if (!userWithHash) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const hashed = hashPassword(password);
    if (userWithHash.password_hash !== hashed) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(userWithHash.id);
    const { password_hash: _, ...user } = userWithHash;

    res.json({ user, token });
  } catch (error) {
    console.error('API Error in POST /api/auth/login:', error);
    res.status(500).json({ error: 'Failed to process login request.' });
  }
});

// POST /api/auth/reset-request
app.post('/api/auth/reset-request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const user = await dbService.getUserByEmail(email);
    if (!user) {
      // Safe privacy behavior
      return res.json({ success: true, message: 'If an account exists, a temporary security pin was sent.' });
    }

    // Generate 6 digit pin
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
    await dbService.setResetCode(email, pinCode);

    console.log(`[Email Gateway Sandbox] Sent Password Reset PIN: ${pinCode} to email ${email}`);

    res.json({
      success: true,
      message: 'If an account exists, a temporary security pin was sent.',
      devPinCode: pinCode // Return pin for local sandboxed app tests or manual confirmation
    });
  } catch (error) {
    console.error('API Error in POST /api/auth/reset-request:', error);
    res.status(500).json({ error: 'Failed to process reset request.' });
  }
});

// POST /api/auth/reset-confirm
app.post('/api/auth/reset-confirm', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'All fields (email, pin code, newPassword) are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const nextHash = hashPassword(newPassword);
    const verified = await dbService.verifyResetCodeAndChangePassword(email, code, nextHash);

    if (!verified) {
      return res.status(400).json({ error: 'Invalid or expired temporary security pin.' });
    }

    res.json({ success: true, message: 'Your password has been changed successfully. You can now login.' });
  } catch (error) {
    console.error('API Error in POST /api/auth/reset-confirm:', error);
    res.status(500).json({ error: 'Failed to update credentials.' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  res.json({ user: (req as any).user });
});

// PATCH /api/auth/preferences
app.patch('/api/auth/preferences', authMiddleware, async (req, res) => {
  try {
    const { notify_hearts, notify_comments, name } = req.body;
    const currentUser = (req as any).user;

    const updated = await dbService.updateUserPreferences(
      currentUser.id,
      notify_hearts !== undefined ? Boolean(notify_hearts) : currentUser.notify_hearts,
      notify_comments !== undefined ? Boolean(notify_comments) : currentUser.notify_comments,
      name
    );

    res.json({ user: updated });
  } catch (error) {
    console.error('API Error in PATCH /api/auth/preferences:', error);
    res.status(500).json({ error: 'Failed to save preferences.' });
  }
});

// GET /api/auth/prayers
app.get('/api/auth/prayers', authMiddleware, async (req, res) => {
  try {
    const currentUser = (req as any).user;
    const items = await dbService.getUserPrayers(currentUser.id);
    res.json(items);
  } catch (error) {
    console.error('API Error in GET /api/auth/prayers:', error);
    res.status(500).json({ error: 'Failed to load account submissions.' });
  }
});

// GET /api/auth/notifications
app.get('/api/auth/notifications', authMiddleware, async (req, res) => {
  try {
    const currentUser = (req as any).user;
    const list = await dbService.getNotifications(currentUser.id);
    res.json(list);
  } catch (error) {
    console.error('API Error in GET /api/auth/notifications:', error);
    res.status(500).json({ error: 'Failed to retrieve interaction notifications.' });
  }
});

// POST /api/auth/notifications/read
app.post('/api/auth/notifications/read', authMiddleware, async (req, res) => {
  try {
    const currentUser = (req as any).user;
    await dbService.markNotificationsRead(currentUser.id);
    res.json({ success: true });
  } catch (error) {
    console.error('API Error in POST /api/auth/notifications/read:', error);
    res.status(500).json({ error: 'Failed to dismiss activity feed notifications.' });
  }
});

// POST /api/push-subscription
app.post('/api/push-subscription', authMiddleware, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Valid subscription structure with endpoint and p256dh/auth keys is required.' });
    }

    const currentUser = (req as any).user;
    await dbService.addPushSubscription(currentUser.id, { endpoint, keys });
    res.json({ success: true, message: 'Device sub validated and listed.' });
  } catch (error) {
    console.error('API Error in POST /api/push-subscription:', error);
    res.status(500).json({ error: 'Failed to list device credentials.' });
  }
});


// ━━━ STATIC SITES AND VITE SERVING ━━━

async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    // Integrate Vite development middleware
    console.log('Running in Development mode. Integrating Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production build static files
    console.log('Running in Production mode. Serving static content from /dist...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PrayWith.me Server] Running on http://localhost:${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error('Failed to bootstrap server:', err);
});
