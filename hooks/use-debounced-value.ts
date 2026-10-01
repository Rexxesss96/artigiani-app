"use client";

import { useEffect, useState } from "react";

// Returns `value`, but only after it has stopped changing for `delayMs`.
// Typing "Varese" fires one search, not six (V, Va, Var, ...).
export function useDebouncedValue<T>(value: T, delayMs = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    // Typed again before the delay? Cancel the previous timer.
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
