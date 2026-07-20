export interface ActionLogEntry {
  message: string;
  at: string;
}

const STORAGE_KEY = "raj-yamal:action-log";
const MAX_ENTRIES = 50;

export function logAction(message: string): void {
  const entries = getActionLog();
  entries.unshift({ message, at: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function getActionLog(): ActionLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ActionLogEntry[];
  } catch {
    return [];
  }
}

export function clearActionLog(): void {
  localStorage.removeItem(STORAGE_KEY);
}
