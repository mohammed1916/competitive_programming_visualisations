import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pb.autoScrollCode';

export function useAutoScroll(defaultValue = true) {
  const [autoScroll, setAutoScroll] = useState(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored !== null ? stored === '1' : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, autoScroll ? '1' : '0');
    } catch {
      // localStorage unavailable
    }
  }, [autoScroll]);

  return [autoScroll, setAutoScroll];
}
