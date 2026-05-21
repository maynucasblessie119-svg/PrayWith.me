export type PrayerCategory = 'Healing' | 'Family' | 'Peace' | 'Gratitude' | 'Protection' | 'Other';

export interface Prayer {
  id: string;
  text: string;
  category: PrayerCategory;
  image_url: string | null;  // base64, static gradient identifier, or storage URL
  heart_count: number;
  status: 'visible' | 'hidden' | 'pending';
  ip_hash: string;
  user_id?: string | null; // Optional link to registered author account
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  notify_hearts: boolean;
  notify_comments: boolean;
  created_at: string;
}

export interface PushSubscriptionItem {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  prayer_id: string;
  title: string;
  body: string;
  type: 'heart' | 'comment';
  read: boolean;
  created_at: string;
}


export interface Heart {
  id: string;
  prayer_id: string;
  ip_hash: string;
  created_at: string;
}

export interface Comment {
  id: string;
  prayer_id: string;
  text: string;
  ip_hash: string;
  created_at: string;
}

export interface Report {
  id: string;
  prayer_id: string;
  reason: string;
  created_at: string;
}

export interface AppStats {
  totalPrayers: number;
  totalHeartsToday: number;
}
