import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pb.showPatternOverlay';

export function usePatternOverlay(defaultValue = true) {
  const [showPatternOverlay, setShowPatternOverlay] = useState(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored !== null ? stored === '1' : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const [activeLineDom, setActiveLineDom] = useState(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, showPatternOverlay ? '1' : '0');
    } catch {
      // localStorage unavailable
    }
  }, [showPatternOverlay]);

  return {
    showPatternOverlay,
    setShowPatternOverlay,
    activeLineDom,
    setActiveLineDom,
  };
}
