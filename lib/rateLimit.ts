interface RateLimitRecord {
  timestamps: number[];
}

const prayerLimits = new Map<string, RateLimitRecord>();

/**
 * Checks if a hashed IP address has exceeded the rate limit of 3 prayers per hour.
 * Keeps track of requests in-memory dynamically.
 */
export function checkRateLimit(ipHash: string): { success: boolean; error?: string } {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  const record = prayerLimits.get(ipHash) || { timestamps: [] };
  
  // Filter out timestamps older than one hour
  record.timestamps = record.timestamps.filter(ts => now - ts < oneHour);
  
  if (record.timestamps.length >= 3) {
    return { success: false, error: 'Rate limit exceeded. You can post up to 3 prayers per hour.' };
  }
  
  return { success: true };
}

/**
 * Logs a new prayer submission timestamp for the given hashed IP.
 */
export function logRateLimit(ipHash: string): void {
  const record = prayerLimits.get(ipHash) || { timestamps: [] };
  record.timestamps.push(Date.now());
  prayerLimits.set(ipHash, record);
}
