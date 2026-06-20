const STORAGE_KEY = "qwen-ui-lab:sessions";
const MAX_SESSIONS = 8;

export interface SessionRecord {
  id: string;
  timestamp: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  modeLabel: string;
  providerState: "qwen" | "fallback";
  savedBy?: string;
  summary?: string;
  artifact: {
    plan: Array<{ title: string; body: string }>;
    previewStats: Array<{ label: string; value: string }>;
    generatedCode: string;
    modeLabel?: string;
    summary?: string;
  };
}

export function loadSessionHistory(): SessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SessionRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSession(record: SessionRecord) {
  if (typeof window === "undefined") return;
  const existing = loadSessionHistory().filter((item) => item.id !== record.id);
  const next = [record, ...existing].slice(0, MAX_SESSIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function removeSession(id: string) {
  if (typeof window === "undefined") return;
  const next = loadSessionHistory().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
