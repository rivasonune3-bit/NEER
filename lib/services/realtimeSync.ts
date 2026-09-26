import { useEffect, useRef, useCallback } from 'react';

export interface RealtimeEvent {
  id: string;
  type: 'ALERT_DISPATCHED' | 'ASSIGNMENT_DISPATCHED' | 'ASSIGNMENT_STATUS_UPDATED' | 'ALERT_ACKNOWLEDGED' | 'INCIDENT_CREATED' | 'SYSTEM_EVENT';
  timestamp: string;
  version: number;
  payload: any;
}

export function useRealtimeSync(options?: {
  onEvent?: (event: RealtimeEvent) => void;
  pollIntervalMs?: number;
  enabled?: boolean;
}) {
  const { onEvent, pollIntervalMs = 4000, enabled = true } = options || {};
  const lastVersionRef = useRef<number>(0);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  // Poll fallback / catchup
  const pollEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/poll?since=${lastVersionRef.current}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.events && data.events.length > 0) {
          data.events.forEach((evt: RealtimeEvent) => {
            if (evt.version > lastVersionRef.current) {
              lastVersionRef.current = evt.version;
            }
            if (onEventRef.current) onEventRef.current(evt);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('neer:realtime_event', { detail: evt }));
            }
          });
        }
        if (data.current_version > lastVersionRef.current) {
          lastVersionRef.current = data.current_version;
        }
      }
    } catch (e) {
      // Background poll silently fails on network blips
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // 1. Initial quick poll to get latest version
    pollEvents();

    // 2. Setup Server-Sent Events (SSE)
    let eventSource: EventSource | null = null;
    let fallbackTimer: NodeJS.Timeout | null = null;

    if (typeof window !== 'undefined' && window.EventSource) {
      try {
        eventSource = new EventSource('/api/events/stream');

        eventSource.onmessage = (e) => {
          try {
            const parsed: RealtimeEvent = JSON.parse(e.data);
            if (parsed.version > lastVersionRef.current) {
              lastVersionRef.current = parsed.version;
            }
            if (onEventRef.current) onEventRef.current(parsed);
            window.dispatchEvent(new CustomEvent('neer:realtime_event', { detail: parsed }));
          } catch (err) {
            // Non-JSON or keep-alive ping
          }
        };

        eventSource.onerror = () => {
          // SSE reconnects automatically, but keep poll active as insurance
        };
      } catch (err) {
        console.warn('SSE not supported or failed to initialize, relying on polling', err);
      }
    }

    // 3. Fallback interval polling for high reliability across tab switching
    fallbackTimer = setInterval(pollEvents, pollIntervalMs);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackTimer) {
        clearInterval(fallbackTimer);
      }
    };
  }, [enabled, pollIntervalMs, pollEvents]);

  return {
    pollNow: pollEvents,
    lastVersion: lastVersionRef.current
  };
}
