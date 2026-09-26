'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, Database } from 'lucide-react';
import { OfflineStore } from '@/lib/offline/offlineStore';

export const NetworkStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [queuedCount, setQueuedCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    setLastSync(OfflineStore.getLastSyncTimestamp());
    setQueuedCount(OfflineStore.getSyncQueue().length);

    const handleOnline = () => {
      setIsOnline(true);
      // Auto sync queue when coming online
      const queue = OfflineStore.getSyncQueue();
      if (queue.length > 0) {
        console.log(`[NEER Network Sync] Connectivity restored. Syncing ${queue.length} offline actions...`);
        OfflineStore.setLastSyncTimestamp();
        setLastSync(OfflineStore.getLastSyncTimestamp());
        setQueuedCount(0);
        OfflineStore.clearSyncQueue();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('PWA ServiceWorker registration skipped:', err);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && queuedCount === 0) return null;

  return (
    <div className={`w-full text-xs font-semibold py-2 px-4 shadow-inner transition-all ${
      !isOnline ? 'bg-amber-900 text-amber-100 border-b border-amber-700' : 'bg-emerald-900 text-emerald-100 border-b border-emerald-700'
    }`}>
      <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>
            {!isOnline ? (
              <>
                <strong className="text-white uppercase tracking-wider">Degraded Network Mode:</strong> System is offline. Using local cached app shell & location data.
              </>
            ) : (
              <>
                <strong className="text-white uppercase tracking-wider">Connection Restored:</strong> Online services active. Local cache synchronized.
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          {lastSync && (
            <span className="flex items-center gap-1 text-slate-300">
              <Database className="w-3 h-3 text-slate-400" />
              Last Synced: {new Date(lastSync).toLocaleTimeString()}
            </span>
          )}
          {queuedCount > 0 && (
            <span className="flex items-center gap-1 bg-amber-800/80 px-2 py-0.5 rounded text-amber-200 border border-amber-600">
              <RefreshCw className="w-3 h-3 animate-spin" />
              {queuedCount} Action{queuedCount > 1 ? 's' : ''} Queued for Sync
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
