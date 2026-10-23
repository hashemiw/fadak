"use client";
import { useSyncExternalStore } from "react";

// Saved gallery ids live only in this browser (localStorage); they are sent only if the visitor attaches them to an enquiry.
const KEY = "fadak:favorites:v1";
const empty: string[] = [];
let cache: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch { return []; }
}
const snapshot = () => (cache ??= read());
const emit = () => listeners.forEach(l => l());

export function toggleFavorite(id: string) {
  const cur = snapshot();
  cache = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* kept in memory for this page only */ }
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; emit(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}

export const useFavorites = () => useSyncExternalStore(subscribe, snapshot, () => empty);
