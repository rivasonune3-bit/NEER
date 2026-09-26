'use client';

/**
 * NEER Offline Store & Local Sync Queue
 * Manages localStorage / IndexedDB caching for offline access, last-sync timestamps,
 * and queues offline citizen actions (e.g. SOS reports) for sync when connectivity returns.
 */

export interface QueuedOfflineAction {
  id: string;
  type: 'REPORT_SOS' | 'SUBMIT_REPORT' | 'RESPONSE_UPDATE';
  payload: any;
  timestamp: string;
  synced: boolean;
}

const CACHED_RISK_DATA_KEY = 'neer_offline_risk_cache';
const CACHED_SHELTERS_KEY = 'neer_offline_shelters_cache';
const CACHED_GUIDELINES_KEY = 'neer_offline_guidelines_cache';
const LAST_SYNC_KEY = 'neer_last_sync_timestamp';
const SYNC_QUEUE_KEY = 'neer_offline_sync_queue';

export class OfflineStore {
  static setLastSyncTimestamp(isoTime: string = new Date().toISOString()) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LAST_SYNC_KEY, isoTime);
  }

  static getLastSyncTimestamp(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LAST_SYNC_KEY);
  }

  // --- Risk Data Caching ---
  static cacheRiskData(locationId: string, data: any) {
    if (typeof window === 'undefined') return;
    try {
      const existing = this.getCachedRiskDataMap();
      existing[locationId] = {
        data,
        cachedAt: new Date().toISOString()
      };
      localStorage.setItem(CACHED_RISK_DATA_KEY, JSON.stringify(existing));
      this.setLastSyncTimestamp();
    } catch (e) {
      console.warn('Failed to cache risk data offline:', e);
    }
  }

  static getCachedRiskData(locationId: string): any | null {
    if (typeof window === 'undefined') return null;
    try {
      const map = this.getCachedRiskDataMap();
      return map[locationId]?.data || null;
    } catch (e) {
      return null;
    }
  }

  static getCachedRiskDataMap(): Record<string, { data: any; cachedAt: string }> {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem(CACHED_RISK_DATA_KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  // --- Shelter Caching for Mountain Off-Grid Emergencies ---
  static cacheShelters(shelters: any[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CACHED_SHELTERS_KEY, JSON.stringify({
        shelters,
        cachedAt: new Date().toISOString()
      }));
    } catch (e) {}
  }

  static getCachedShelters(): any[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CACHED_SHELTERS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed.shelters || [];
    } catch (e) {
      return [];
    }
  }

  // --- Guidelines Caching ---
  static cacheGuidelines(guidelines: any[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CACHED_GUIDELINES_KEY, JSON.stringify(guidelines));
    } catch (e) {}
  }

  static getCachedGuidelines(): any[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CACHED_GUIDELINES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  // --- Action Queue for Offline Citizen SOS & Fleet Reports ---
  static enqueueAction(type: 'REPORT_SOS' | 'SUBMIT_REPORT' | 'RESPONSE_UPDATE', payload: any): QueuedOfflineAction {
    const queue = this.getSyncQueue();
    const action: QueuedOfflineAction = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type,
      payload,
      timestamp: new Date().toISOString(),
      synced: false
    };
    queue.push(action);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    }
    return action;
  }

  static getSyncQueue(): QueuedOfflineAction[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  static getPendingCount(): number {
    return this.getSyncQueue().filter(a => !a.synced).length;
  }

  static clearSyncQueue() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SYNC_QUEUE_KEY);
  }

  /**
   * Automatically attempts to flush queued offline actions when connectivity returns.
   */
  static async syncPendingQueue(): Promise<number> {
    if (typeof window === 'undefined' || !navigator.onLine) return 0;
    const queue = this.getSyncQueue();
    const pending = queue.filter(a => !a.synced);
    if (pending.length === 0) return 0;

    let syncedCount = 0;
    for (const item of pending) {
      try {
        if (item.type === 'REPORT_SOS' || item.type === 'SUBMIT_REPORT') {
          await fetch('/api/incidents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload)
          });
          item.synced = true;
          syncedCount++;
        }
      } catch (e) {
        console.warn('Sync pending item failed:', e);
      }
    }

    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue.filter(a => !a.synced)));
    this.setLastSyncTimestamp();
    return syncedCount;
  }
}
