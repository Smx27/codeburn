import { query } from '../database/pool.js';

const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export async function updateOfflineMachines(): Promise<number> {
  const result = await query<{ id: string }>(
    `UPDATE machines SET status = 'OFFLINE'
     WHERE status = 'ONLINE'
     AND last_seen < NOW() - INTERVAL '5 minutes'
     RETURNING id`
  );
  return result.length;
}

export function startOfflineDetection(intervalMs: number = 60000): NodeJS.Timeout {
  return setInterval(async () => {
    try {
      const updated = await updateOfflineMachines();
      if (updated > 0) {
        console.log(`[offline-detection] Marked ${updated} machine(s) as OFFLINE`);
      }
    } catch (error) {
      console.error('[offline-detection] Error updating offline machines:', error);
    }
  }, intervalMs);
}
