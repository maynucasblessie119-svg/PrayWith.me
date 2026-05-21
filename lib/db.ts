import fs from 'fs';
import path from 'path';
import { getSupabase } from './supabase.js';
import { getSupabaseAdmin } from './supabaseAdmin.js';
import { Prayer, Heart, Comment, Report, PrayerCategory, AppStats, User, PushSubscriptionItem, AppNotification } from '../src/types.js';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

interface LocalResetCode {
  email: string;
  code: string;
  expiresAt: string;
}

interface DBData {
  prayers: Prayer[];
  hearts: Heart[];
  comments: Comment[];
  reports: Report[];
  users: (User & { password_hash: string })[];
  push_subscriptions: PushSubscriptionItem[];
  notifications: AppNotification[];
  reset_codes: LocalResetCode[];
}

function initLocalDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initialData: DBData = {
      prayers: [
        {
          id: 'p1',
          text: 'For my grandmother who is recovering from major heart surgery. Please grant her comfort, strength, and complete restoration of health.',
          category: 'Healing',
          image_url: null,
          heart_count: 42,
          status: 'visible',
          ip_hash: 'seed-hash-1',
          user_id: null,
          created_at: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString()
        },
        {
          text: 'Feeling grateful for the gift of a silent morning and a warm cup of coffee. May we all find moments of quiet rest amid our busy schedules.',
          category: 'Gratitude',
          id: 'p2',
          image_url: null,
          heart_count: 57,
          status: 'visible',
          ip_hash: 'seed-hash-2',
          user_id: null,
          created_at: new Date(Date.now() - 6.2 * 3600 * 1000).toISOString()
        },
        {
          text: 'Praying for my family to find understanding and peace. We are navigating a season of miscommunication and disagreement; send grace.',
          category: 'Family',
          id: 'p3',
          image_url: null,
          heart_count: 24,
          status: 'visible',
          ip_hash: 'seed-hash-3',
          user_id: null,
          created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString()
        },
        {
          text: 'Please guard and protect our doctors, nurses, and humanitarian workers globally who run towards hardship to serve others.',
          category: 'Protection',
          id: 'p4',
          image_url: null,
          heart_count: 19,
          status: 'visible',
          ip_hash: 'seed-hash-4',
          user_id: null,
          created_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString()
        }
      ],
      hearts: [],
      comments: [
        {
          id: 'c1',
          prayer_id: 'p1',
          text: 'Standing with you in prayer for her full recovery. Love and hope to your family.',
          ip_hash: 'seed-hash-commenter',
          created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
        }
      ],
      reports: [],
      users: [],
      push_subscriptions: [],
      notifications: [],
      reset_codes: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
  } else {
    // Migrate existing db format silently
    try {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      const db = JSON.parse(content);
      let updated = false;
      if (!db.users) { db.users = []; updated = true; }
      if (!db.push_subscriptions) { db.push_subscriptions = []; updated = true; }
      if (!db.notifications) { db.notifications = []; updated = true; }
      if (!db.reset_codes) { db.reset_codes = []; updated = true; }
      
      // Ensure all initial seed prayers have user_id
      db.prayers.forEach((p: any) => {
        if (p.user_id === undefined) {
          p.user_id = null;
          updated = true;
        }
      });
      
      if (updated) {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
      }
    } catch (e) {
      console.error('Migration error:', e);
    }
  }
}

function readLocalDB(): DBData {
  initLocalDB();
  try {
    const content = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading local fallback database:', error);
    return { 
      prayers: [], 
      hearts: [], 
      comments: [], 
      reports: [],
      users: [],
      push_subscriptions: [],
      notifications: [],
      reset_codes: []
    };
  }
}

function writeLocalDB(data: DBData) {
  initLocalDB();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to local fallback database:', error);
  }
}

// Generate an UUID-like string for local fallback
function createUID(): string {
  return 'local-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}

export type DbPrayerWithReportCount = Prayer & { report_count: number };

export const dbService = {
  /**
   * Fetch visible prayers filtered by category
   */
  async getPrayers(category?: string): Promise<Prayer[]> {
    const supabase = getSupabase() as any;
    if (supabase) {
      try {
        let query = supabase
          .from('prayers')
          .select('*')
          .eq('status', 'visible')
          .order('created_at', { ascending: false });

        if (category && category !== 'All') {
          query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (!error && data) return data as Prayer[];
        console.error('Supabase query error, reverting to local:', error);
      } catch (e) {
        console.error('Supabase getPrayers failed:', e);
      }
    }

    // Fallback: local db
    const db = readLocalDB();
    let result = db.prayers.filter(p => p.status === 'visible');
    if (category && category !== 'All') {
      result = result.filter(p => p.category === category);
    }
    // Sort descending by created_at
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  /**
   * Fetch a single prayer by ID
   */
  async getPrayerById(id: string): Promise<Prayer | null> {
    const supabase = getSupabase() as any;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('prayers')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) return data as Prayer;
      } catch (e) {
        console.error('Supabase getPrayerById failed:', e);
      }
    }

    const db = readLocalDB();
    return db.prayers.find(p => p.id === id) || null;
  },

  /**
   * Insert a new prayer request
   */
  async addPrayer(text: string, category: PrayerCategory, image_url: string | null, ipHash: string, userId: string | null = null): Promise<Prayer> {
    const supabaseAdmin = getSupabaseAdmin() as any;
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('prayers')
          .insert({
            text,
            category,
            image_url,
            ip_hash: ipHash,
            status: 'visible',
            user_id: userId
          })
          .select()
          .single();
        if (!error && data) return data as Prayer;
        console.error('Supabase insert error, reverting to local:', error);
      } catch (e) {
        console.error('Supabase addPrayer failed:', e);
      }
    }

    // Fallback: local db
    const db = readLocalDB();
    const newPrayer: Prayer = {
      id: createUID(),
      text,
      category,
      image_url,
      heart_count: 0,
      status: 'visible',
      ip_hash: ipHash,
      user_id: userId,
      created_at: new Date().toISOString()
    };
    db.prayers.push(newPrayer);
    writeLocalDB(db);
    return newPrayer;
  },

  /**
   * Check if a heart records exists for validation (prevents client routing tricks)
   */
  async hasHearted(prayerId: string, ipHash: string): Promise<boolean> {
    const supabase = getSupabase() as any;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('hearts')
          .select('id')
          .eq('prayer_id', prayerId)
          .eq('ip_hash', ipHash);
        if (!error && data && data.length > 0) return true;
      } catch (e) {
        console.error('Supabase check hasHearted failed:', e);
      }
    }

    const db = readLocalDB();
    return db.hearts.some(h => h.prayer_id === prayerId && h.ip_hash === ipHash);
  },

  /**
   * Add a heart to a prayer and increment its heart_count
   */
  async addHeart(prayerId: string, ipHash: string): Promise<number> {
    const supabaseAdmin = getSupabaseAdmin() as any;
    let nextCount = 0;
    if (supabaseAdmin) {
      try {
        const { error: heartError } = await supabaseAdmin
          .from('hearts')
          .insert({
            id: genRandomUUIDFallback(),
            prayer_id: prayerId,
            ip_hash: ipHash
          });
        
        if (!heartError) {
          // Increment prayers count (could also do via db trigger if setup, but API logic is reliable)
          const { data, error: prError } = await supabaseAdmin.rpc('increment_heart', { prayer_id: prayerId });
          if (!prError) {
            nextCount = data as number;
          } else {
            // RPC fallback
            const prayer = await this.getPrayerById(prayerId);
            if (prayer) {
              const tentativeCount = (prayer.heart_count || 0) + 1;
              const { error: updateError } = await supabaseAdmin
                .from('prayers')
                .update({ heart_count: tentativeCount })
                .eq('id', prayerId);
              if (!updateError) {
                nextCount = tentativeCount;
              }
            }
          }
        }
      } catch (e) {
        console.error('Supabase addHeart failed:', e);
      }
    } else {
      // Fallback: local db
      const db = readLocalDB();
      const alreadyHearted = db.hearts.some(h => h.prayer_id === prayerId && h.ip_hash === ipHash);
      
      // Find index of prayer
      const prayerIndex = db.prayers.findIndex(p => p.id === prayerId);
      if (prayerIndex !== -1) {
        if (!alreadyHearted) {
          const newHeart: Heart = {
            id: createUID(),
            prayer_id: prayerId,
            ip_hash: ipHash,
            created_at: new Date().toISOString()
          };
          db.hearts.push(newHeart);
          db.prayers[prayerIndex].heart_count = (db.prayers[prayerIndex].heart_count || 0) + 1;
          writeLocalDB(db);
        }
        nextCount = db.prayers[prayerIndex].heart_count;
      }
    }

    if (nextCount > 0) {
      // Trigger notification (non-blocking async)
      this.triggerNotification(prayerId, 'heart').catch(err => console.error('Notification trigger error:', err));
    }
    return nextCount;
  },

  /**
   * Add a comment to a prayer
   */
  async addComment(prayerId: string, text: string, ipHash: string): Promise<Comment> {
    const supabaseAdmin = getSupabaseAdmin() as any;
    let commentResult: Comment | null = null;
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('comments')
          .insert({
            prayer_id: prayerId,
            text,
            ip_hash: ipHash
          })
          .select()
          .single();
        if (!error && data) {
          commentResult = data as Comment;
        }
      } catch (e) {
        console.error('Supabase addComment failed:', e);
      }
    }

    if (!commentResult) {
      const db = readLocalDB();
      const newComment: Comment = {
        id: createUID(),
        prayer_id: prayerId,
        text,
        ip_hash: ipHash,
        created_at: new Date().toISOString()
      };
      db.comments.push(newComment);
      writeLocalDB(db);
      commentResult = newComment;
    }

    // Trigger notification (non-blocking async)
    this.triggerNotification(prayerId, 'comment', text).catch(err => console.error('Notification trigger error:', err));

    return commentResult;
  },

  /**
   * Fetch comments of a prayer
   */
  async getComments(prayerId: string): Promise<Comment[]> {
    const supabase = getSupabase() as any;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('prayer_id', prayerId)
          .order('created_at', { ascending: true });
        if (!error && data) return data as Comment[];
      } catch (e) {
        console.error('Supabase getComments failed:', e);
      }
    }

    const db = readLocalDB();
    return db.comments
      .filter(c => c.prayer_id === prayerId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  /**
   * File a report on a prayer card
   */
  async addReport(prayerId: string, reason: string): Promise<boolean> {
    const supabaseAdmin = getSupabaseAdmin() as any;
    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin
          .from('reports')
          .insert({
            prayer_id: prayerId,
            reason
          });
        if (!error) return true;
      } catch (e) {
        console.error('Supabase addReport failed:', e);
      }
    }

    const db = readLocalDB();
    const newReport: Report = {
      id: createUID(),
      prayer_id: prayerId,
      reason,
      created_at: new Date().toISOString()
    };
    db.reports.push(newReport);
    writeLocalDB(db);
    return true;
  },

  /**
   * Fetch admin prayers list with report counts nested
   */
  async getAdminPrayers(): Promise<DbPrayerWithReportCount[]> {
    const supabaseAdmin = getSupabaseAdmin() as any;
    if (supabaseAdmin) {
      try {
        const { data: prayers, error: pErr } = await supabaseAdmin
          .from('prayers')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: reports, error: rErr } = await supabaseAdmin
          .from('reports')
          .select('*');

        if (!pErr && prayers) {
          const reportMap = new Map<string, number>();
          reports?.forEach((r: any) => {
            reportMap.set(r.prayer_id, (reportMap.get(r.prayer_id) || 0) + 1);
          });
          return prayers.map((p: any) => ({
            ...p,
            report_count: reportMap.get(p.id) || 0
          })) as DbPrayerWithReportCount[];
        }
      } catch (e) {
        console.error('Supabase getAdminPrayers failed:', e);
      }
    }

    const db = readLocalDB();
    const reportMap = new Map<string, number>();
    db.reports.forEach(r => {
      reportMap.set(r.prayer_id, (reportMap.get(r.prayer_id) || 0) + 1);
    });

    return db.prayers
      .map(p => ({
        ...p,
        report_count: reportMap.get(p.id) || 0
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  /**
   * Update status of user prayer or delete it
   */
  async updatePrayerStatus(prayerId: string, action: 'approve' | 'hide' | 'delete'): Promise<boolean> {
    const supabaseAdmin = getSupabaseAdmin() as any;
    if (supabaseAdmin) {
      try {
        if (action === 'delete') {
          const { error } = await supabaseAdmin
            .from('prayers')
            .delete()
            .eq('id', prayerId);
          if (!error) return true;
        } else {
          const newStatus = action === 'approve' ? 'visible' : 'hidden';
          const { error } = await supabaseAdmin
            .from('prayers')
            .update({ status: newStatus })
            .eq('id', prayerId);
          if (!error) return true;
        }
      } catch (e) {
        console.error('Supabase updatePrayerStatus failed:', e);
      }
    }

    const db = readLocalDB();
    if (action === 'delete') {
      db.prayers = db.prayers.filter(p => p.id !== prayerId);
      db.hearts = db.hearts.filter(h => h.prayer_id !== prayerId);
      db.comments = db.comments.filter(c => c.prayer_id !== prayerId);
      db.reports = db.reports.filter(r => r.prayer_id !== prayerId);
    } else {
      const idx = db.prayers.findIndex(p => p.id === prayerId);
      if (idx !== -1) {
        db.prayers[idx].status = action === 'approve' ? 'visible' : 'hidden';
      }
    }
    writeLocalDB(db);
    return true;
  },

  /**
   * Get app statistics summary
   */
  async getStats(): Promise<AppStats> {
    const supabaseAdmin = getSupabaseAdmin() as any;
    if (supabaseAdmin) {
      try {
        const { count: prayerCount } = await supabaseAdmin
          .from('prayers')
          .select('*', { count: 'exact', head: true });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count: heartCount } = await supabaseAdmin
          .from('hearts')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString());

        return {
          totalPrayers: prayerCount || 0,
          totalHeartsToday: heartCount || 0
        };
      } catch (e) {
        console.error('Supabase getStats failed:', e);
      }
    }

    const db = readLocalDB();
    const todayStr = new Date().toISOString().split('T')[0];
    const heartsToday = db.hearts.filter(h => h.created_at.startsWith(todayStr)).length;

    return {
      totalPrayers: db.prayers.length,
      totalHeartsToday: heartsToday || db.hearts.length // fall back to total in case dates don't match exactly
    };
  },

  /**
   * Asynchronously trigger notification for prayer author (non-blocking)
   */
  async triggerNotification(prayerId: string, type: 'heart' | 'comment', detailText?: string): Promise<void> {
    try {
      const prayer = await this.getPrayerById(prayerId);
      if (!prayer || !prayer.user_id) return; // Anonymous, no active user account link

      const user = await this.getUserById(prayer.user_id);
      if (!user) return;

      if (type === 'heart' && !user.notify_hearts) return;
      if (type === 'comment' && !user.notify_comments) return;

      const title = type === 'heart' ? 'Stand in Solidarity ❤️' : 'New Sanctuary Message 💬';
      const body = type === 'heart'
        ? `Someone stood in quiet solidarity and lit a candle for your prayer!`
        : `A commenter shared comfort: "${detailText && detailText.length > 50 ? detailText.substring(0, 47) + '...' : detailText}"`;

      // Log notification entry in notifications table
      await this.createNotification(user.id, prayer.id, title, body, type);

      // Print trace to showcase Web Push deployment delivery
      const subs = await this.getPushSubscriptions(user.id);
      console.log(`[Push Notification Gateway] Dispatching "${title}" containing "${body}" to ${subs.length} registered devices of user ${user.name}`);
    } catch (e) {
      console.error('Failed to trigger notification:', e);
    }
  },

  /**
   * Fetch user by email
   */
  async getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
    const supabase = getSupabase() as any;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email.toLowerCase())
          .single();
        if (!error && data) return data as User & { password_hash: string };
      } catch (err) {
        console.error('Supabase getUserByEmail failed:', err);
      }
    }

    const db = readLocalDB();
    const user = db.users.find(u => u.email === email.toLowerCase());
    return user || null;
  },

  /**
   * Fetch user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    const supabase = getSupabase() as any;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, name, notify_hearts, notify_comments, created_at')
          .eq('id', id)
          .single();
        if (!error && data) return data as User;
      } catch (err) {
        console.error('Supabase getUserById failed:', err);
      }
    }

    const db = readLocalDB();
    const user = db.users.find(u => u.id === id);
    if (user) {
      const { password_hash, ...safeUser } = user;
      return safeUser as User;
    }
    return null;
  },

  /**
   * Create a new user
   */
  async createUser(email: string, password_hash: string, name: string): Promise<User> {
    const supabaseAdmin = getSupabaseAdmin() as any;
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('users')
          .insert({
            email: email.toLowerCase(),
            password_hash,
            name,
            notify_hearts: true,
            notify_comments: true
          })
          .select('id, email, name, notify_hearts, notify_comments, created_at')
          .single();
        if (!error && data) return data as User;
        console.error('Supabase user insert failed, using fallback:', error);
      } catch (err) {
        console.error('Supabase createUser failed:', err);
      }
    }

    const db = readLocalDB();
    const id = createUID();
    const newUser = {
      id,
      email: email.toLowerCase(),
      name,
      password_hash,
      notify_hearts: true,
      notify_comments: true,
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    writeLocalDB(db);

    const { password_hash: _, ...safeUser } = newUser;
    return safeUser as User;
  },

  /**
   * Update user settings/preferences
   */
  async updateUserPreferences(userId: string, notify_hearts: boolean, notify_comments: boolean, name?: string): Promise<User | null> {
    const supabaseAdmin = getSupabaseAdmin() as any;
    const updateObj: any = { notify_hearts, notify_comments };
    if (name) updateObj.name = name;

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('users')
          .update(updateObj)
          .eq('id', userId)
          .select('id, email, name, notify_hearts, notify_comments, created_at')
          .single();
        if (!error && data) return data as User;
      } catch (err) {
        console.error('Supabase updatePreferences failed:', err);
      }
    }

    const db = readLocalDB();
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      db.users[idx].notify_hearts = notify_hearts;
      db.users[idx].notify_comments = notify_comments;
      if (name) db.users[idx].name = name;
      writeLocalDB(db);
      const { password_hash, ...safeUser } = db.users[idx];
      return safeUser as User;
    }
    return null;
  },

  /**
   * Set dynamic verification code for password reset helper
   */
  async setResetCode(email: string, code: string): Promise<void> {
    const db = readLocalDB();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    
    // Remove if there is existing reset code for this email
    db.reset_codes = db.reset_codes.filter(rc => rc.email !== email.toLowerCase());
    db.reset_codes.push({ email: email.toLowerCase(), code, expiresAt });
    writeLocalDB(db);
  },

  /**
   * Verify dynamic pin reset and update credentials
   */
  async verifyResetCodeAndChangePassword(email: string, code: string, nextPasswordHash: string): Promise<boolean> {
    const db = readLocalDB();
    const resetRecord = db.reset_codes.find(rc => rc.email === email.toLowerCase() && rc.code === code);
    
    if (!resetRecord) return false;
    
    if (new Date(resetRecord.expiresAt).getTime() < Date.now()) {
      return false;
    }

    const idx = db.users.findIndex(u => u.email === email.toLowerCase());
    if (idx !== -1) {
      db.users[idx].password_hash = nextPasswordHash;
    }

    const supabaseAdmin = getSupabaseAdmin() as any;
    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('users')
          .update({ password_hash: nextPasswordHash })
          .eq('email', email.toLowerCase());
      } catch (err) {
        console.error('Supabase sync password update failed:', err);
      }
    }

    db.reset_codes = db.reset_codes.filter(rc => rc.email !== email.toLowerCase());
    writeLocalDB(db);
    return true;
  },

  /**
   * Push subscription register
   */
  async addPushSubscription(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin() as any;
    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('push_subscriptions')
          .insert({
            user_id: userId,
            endpoint: subscription.endpoint,
            keys: subscription.keys
          });
        return;
      } catch (err) {
        console.error('Supabase addPushSubscription failed:', err);
      }
    }

    const db = readLocalDB();
    db.push_subscriptions = db.push_subscriptions.filter(s => s.endpoint !== subscription.endpoint);
    db.push_subscriptions.push({
      id: createUID(),
      user_id: userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      created_at: new Date().toISOString()
    });
    writeLocalDB(db);
  },

  /**
   * Get push registrations of owner
   */
  async getPushSubscriptions(userId: string): Promise<PushSubscriptionItem[]> {
    const supabase = getSupabase() as any;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', userId);
        if (!error && data) return data as PushSubscriptionItem[];
      } catch (err) {
        console.error('Supabase getPushSubscriptions failed:', err);
      }
    }

    const db = readLocalDB();
    return db.push_subscriptions.filter(s => s.user_id === userId);
  },

  /**
   * Create notification history record
   */
  async createNotification(userId: string, prayerId: string, title: string, body: string, type: 'heart' | 'comment'): Promise<AppNotification> {
    const supabaseAdmin = getSupabaseAdmin() as any;
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: userId,
            prayer_id: prayerId,
            title,
            body,
            type,
            read: false
          })
          .select()
          .single();
        if (!error && data) return data as AppNotification;
      } catch (err) {
        console.error('Supabase createNotification failed:', err);
      }
    }

    const db = readLocalDB();
    const newNotification: AppNotification = {
      id: createUID(),
      user_id: userId,
      prayer_id: prayerId,
      title,
      body,
      type,
      read: false,
      created_at: new Date().toISOString()
    };
    db.notifications.push(newNotification);
    writeLocalDB(db);
    return newNotification;
  },

  /**
   * Fetch user notifications list
   */
  async getNotifications(userId: string): Promise<AppNotification[]> {
    const supabase = getSupabase() as any;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (!error && data) return data as AppNotification[];
      } catch (err) {
        console.error('Supabase getNotifications failed:', err);
      }
    }

    const db = readLocalDB();
    return db.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  /**
   * Mark all unread notifications of user as read
   */
  async markNotificationsRead(userId: string): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin() as any;
    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('notifications')
          .update({ read: true })
          .eq('user_id', userId);
        return;
      } catch (err) {
        console.error('Supabase markNotificationsRead failed:', err);
      }
    }

    const db = readLocalDB();
    db.notifications.forEach(n => {
      if (n.user_id === userId) {
        n.read = true;
      }
    });
    writeLocalDB(db);
  },

  /**
   * Get prayers shared by a specific user
   */
  async getUserPrayers(userId: string): Promise<Prayer[]> {
    const supabase = getSupabase() as any;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('prayers')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (!error && data) return data as Prayer[];
      } catch (err) {
        console.error('Supabase getUserPrayers failed:', err);
      }
    }

    const db = readLocalDB();
    return db.prayers
      .filter(p => p.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
};

function genRandomUUIDFallback(): string {
  return 'uuid-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
