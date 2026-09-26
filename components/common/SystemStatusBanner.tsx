'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, Shield } from 'lucide-react';
import { OfflineStore } from '@/lib/offline/offlineStore';

export const SystemStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    setPendingCount(OfflineStore.getPendingCount());

    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      await OfflineStore.syncPendingQueue();
      setPendingCount(OfflineStore.getPendingCount());
      setIsSyncing(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setPendingCount(OfflineStore.getPendingCount());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      setPendingCount(OfflineStore.getPendingCount());
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await OfflineStore.syncPendingQueue();
    setPendingCount(OfflineStore.getPendingCount());
    setIsSyncing(false);
  };

  if (isOnline && pendingCount === 0) {
    return null; // Keep dashboard completely clean when normal and synced
  }

  return (
    <div className={`px-4 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
      !isOnline
        ? 'bg-amber-500 text-slate-950 border-b border-amber-600'
        : 'bg-sky-700 text-white border-b border-sky-800'
    }`}>
      <div className="flex items-center gap-2 max-w-[1700px] mx-auto w-full justify-between">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4 text-slate-950 animate-pulse" />
              <span>
                <strong>OFFLINE / MOUNTAIN DEGRADED MODE:</strong> Internet connection lost. Operating on local cache.
              </span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 text-sky-200" />
              <span>
                <strong>Connection Restored:</strong> Pending offline reports ready to synchronize.
              </span>
            </>
          )}

          {pendingCount > 0 && (
            <span className="bg-black/20 px-2 py-0.5 rounded-full font-mono text-[11px]">
              {pendingCount} offline action(s) queued
            </span>
          )}
        </div>

        {isOnline && pendingCount > 0 && (
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-2.5 py-0.5 rounded bg-white text-sky-900 font-bold hover:bg-sky-50 transition-all flex items-center gap-1 text-[11px]"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Pending'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
