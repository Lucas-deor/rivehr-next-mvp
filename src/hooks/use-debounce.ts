import { useState, useEffect } from 'react'

/**
 * Debounces a value by the given delay (ms).
 * Returns the debounced value that only updates after the delay elapses
 * without the source value changing.
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
