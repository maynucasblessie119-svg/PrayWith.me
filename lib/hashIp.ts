import { createHash } from 'crypto';

/**
 * Hashes an IP address using SHA-256 to ensure anonymity.
 * Never stores raw IP addresses.
 */
export function hashIp(ip: string | undefined): string {
  const ipStr = ip || 'unknown-ip';
  return createHash('sha256').update(ipStr).digest('hex');
}
