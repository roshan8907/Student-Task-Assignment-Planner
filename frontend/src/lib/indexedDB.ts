import type { Assignment, StudyTask, SyncQueueItem } from '../types';

const DB_NAME = 'student_planner_db';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('assignments')) {
        db.createObjectStore('assignments', { keyPath: '_id' });
      }
      if (!db.objectStoreNames.contains('study_tasks')) {
        db.createObjectStore('study_tasks', { keyPath: '_id' });
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const offlineStorage = {
  // Assignments Cache
  async saveAssignments(assignments: Assignment[]): Promise<void> {
    const db = await openDB();
    const tx = db.transaction('assignments', 'readwrite');
    const store = tx.objectStore('assignments');
    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        assignments.forEach((a) => store.put(a));
        resolve();
      };
      clearReq.onerror = () => reject(clearReq.error);
    });
  },

  async getAssignments(): Promise<Assignment[]> {
    const db = await openDB();
    const tx = db.transaction('assignments', 'readonly');
    const store = tx.objectStore('assignments');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  // Study Tasks Cache
  async saveTasks(tasks: StudyTask[]): Promise<void> {
    const db = await openDB();
    const tx = db.transaction('study_tasks', 'readwrite');
    const store = tx.objectStore('study_tasks');
    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        tasks.forEach((t) => store.put(t));
        resolve();
      };
      clearReq.onerror = () => reject(clearReq.error);
    });
  },

  async getTasks(): Promise<StudyTask[]> {
    const db = await openDB();
    const tx = db.transaction('study_tasks', 'readonly');
    const store = tx.objectStore('study_tasks');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  // Sync Queue for Offline Mutation Operations
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): Promise<void> {
    const db = await openDB();
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    const queueItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    return new Promise((resolve, reject) => {
      const req = store.put(queueItem);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await openDB();
    const tx = db.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = await openDB();
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async clearUserCache(): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(['assignments', 'study_tasks', 'sync_queue'], 'readwrite');
    tx.objectStore('assignments').clear();
    tx.objectStore('study_tasks').clear();
    tx.objectStore('sync_queue').clear();
  },
};
