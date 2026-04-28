// ============================================================
// Server-side log store for SSE streaming
// ============================================================
import type { LogEvent } from "./types";

/** In-memory log store keyed by migration ID */
const logStore = new Map<string, LogEvent[]>();

/** Subscribers waiting for new logs */
const subscribers = new Map<string, Set<(event: LogEvent) => void>>();

/**
 * Push a log event for a specific migration session.
 */
export function pushLog(
  migrationId: string,
  step: string,
  message: string,
  status: LogEvent["status"],
  progress?: number
): void {
  const event: LogEvent = {
    timestamp: new Date().toISOString(),
    step,
    message,
    status,
    progress,
  };

  // Store
  if (!logStore.has(migrationId)) {
    logStore.set(migrationId, []);
  }
  logStore.get(migrationId)!.push(event);

  // Notify subscribers
  const subs = subscribers.get(migrationId);
  if (subs) {
    for (const callback of subs) {
      callback(event);
    }
  }
}

/**
 * Get all logs for a migration session.
 */
export function getLogs(migrationId: string): LogEvent[] {
  return logStore.get(migrationId) || [];
}

/**
 * Subscribe to log events for a migration session.
 * Returns an unsubscribe function.
 */
export function subscribeLogs(
  migrationId: string,
  callback: (event: LogEvent) => void
): () => void {
  if (!subscribers.has(migrationId)) {
    subscribers.set(migrationId, new Set());
  }
  subscribers.get(migrationId)!.add(callback);

  return () => {
    const subs = subscribers.get(migrationId);
    if (subs) {
      subs.delete(callback);
      if (subs.size === 0) {
        subscribers.delete(migrationId);
      }
    }
  };
}

/**
 * Clean up logs for a migration session.
 */
export function clearLogs(migrationId: string): void {
  logStore.delete(migrationId);
  subscribers.delete(migrationId);
}
