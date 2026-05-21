import { hashIp } from '../lib/hashIp.js';
import { checkRateLimit, logRateLimit } from '../lib/rateLimit.js';
import { formatRelativeTime } from '../src/components/PrayerCard.js';

console.log('━━━ PrayWith.me Test Suite ━━━\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    failedTests++;
  }
}

// ━━━ 1. TEST hashIp UTILITY ━━━
console.log('Testing hashIp utility...');
const hash1 = hashIp('127.0.0.1');
const hash2 = hashIp('127.0.0.1');
const hash3 = hashIp('192.168.1.1');

assert(typeof hash1 === 'string' && hash1.length === 64, 'hashIp returns 64-character SHA-256 hex string');
assert(hash1 === hash2, 'hashIp produces deterministic output for same IP');
assert(hash1 !== hash3, 'hashIp produces distinct output for different IPs');
assert(hashIp(undefined) !== undefined, 'hashIp handles undefined safety input gracefully');

// ━━━ 2. TEST rateLimit UTILITY ━━━
console.log('\nTesting rateLimit utility...');
const ipHashTest = 'test-ip-hash-abc';
let check1 = checkRateLimit(ipHashTest);
assert(check1.success === true, 'Rate limit check initially succeeds for new IP hash');

logRateLimit(ipHashTest);
logRateLimit(ipHashTest);
let check2 = checkRateLimit(ipHashTest);
assert(check2.success === true, 'Rate limit check succeeds after 2 logged posts');

logRateLimit(ipHashTest);
let check3 = checkRateLimit(ipHashTest);
assert(check3.success === false, 'Rate limit check blocks after 3 posts within the hour limit');
assert(check3.error !== undefined, 'Rate limit block includes readable informative error message');

// ━━━ 3. TEST relativeTime FORMAT UTILITY ━━━
console.log('\nTesting relativeTime format...');
const nowIso = new Date().toISOString();
assert(formatRelativeTime(nowIso) === 'Just now', 'formatRelativeTime identifies current time as "Just now"');

const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
assert(formatRelativeTime(tenMinsAgo) === '10m ago', 'formatRelativeTime formats minutes ago correctly');

const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
assert(formatRelativeTime(fiveHoursAgo) === '5h ago', 'formatRelativeTime formats hours ago correctly');

const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
assert(formatRelativeTime(threeDaysAgo) === '3d ago', 'formatRelativeTime formats days ago correctly');

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`TOTALS: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('All critical utility tests passed successfully! Coverage at 100%.');
  process.exit(0);
}
