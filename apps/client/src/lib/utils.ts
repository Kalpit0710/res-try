// Shared client-side utilities

/** Extract a MongoDB ObjectId string from a nested object or plain string */
export function extractClassId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return '';

  const candidate = value as Record<string, unknown>;
  const nested = candidate._id ?? candidate.id;
  if (typeof nested === 'string') return nested;

  if (nested && typeof nested === 'object') {
    const nestedObj = nested as Record<string, unknown>;
    if (typeof nestedObj.$oid === 'string') return nestedObj.$oid;
  }

  if (typeof candidate.$oid === 'string') return candidate.$oid;
  return '';
}

/** Returns true if the string looks like a Mongo ObjectId */
export function isObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}

/** Simple debounce hook helper — returns the debounced value */
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
