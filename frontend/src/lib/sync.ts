import { offlineStorage } from './indexedDB';
import { api } from './api';

export async function flushSyncQueue(onProgress?: (remaining: number) => void): Promise<{ synced: number; failed: number }> {
  if (!navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const queue = await offlineStorage.getSyncQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await api(item.url, {
        method: item.method,
        body: item.body ? JSON.stringify(item.body) : undefined,
      });
      await offlineStorage.removeSyncQueueItem(item.id);
      synced++;
      if (onProgress) onProgress(queue.length - synced);
    } catch (err) {
      console.error('Failed to sync offline action:', item, err);
      failed++;
    }
  }

  return { synced, failed };
}
