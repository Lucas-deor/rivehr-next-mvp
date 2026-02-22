import { useState, useEffect, useRef, useCallback } from 'react'
import { useDebounce } from '@/hooks/use-debounce'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseAutosaveOptions<T> {
  /** The value to watch and auto-save. */
  value: T
  /** Async function that persists the value. Should throw on failure. */
  saveFn: (value: T) => Promise<void>
  /** Debounce delay in ms before triggering save. Default: 1500. */
  delay?: number
  /** Whether to skip the initial save on mount. Default: true. */
  skipInitial?: boolean
}

/**
 * Watches a value and calls saveFn after it stops changing for `delay` ms.
 *
 * @returns status — 'idle' | 'saving' | 'saved' | 'error'
 * @returns save — call manually to force an immediate save
 */
export function useAutosave<T>({
  value,
  saveFn,
  delay = 1500,
  skipInitial = true,
}: UseAutosaveOptions<T>) {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const debouncedValue = useDebounce(value, delay)
  const isFirstRun = useRef(true)
  const latestSaveFn = useRef(saveFn)

  // Keep ref up-to-date without re-triggering the effect
  useEffect(() => {
    latestSaveFn.current = saveFn
  }, [saveFn])

  const save = useCallback(async (valueToSave: T) => {
    setStatus('saving')
    try {
      await latestSaveFn.current(valueToSave)
      setStatus('saved')
      // Reset to idle after 2s so the indicator fades away
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      if (skipInitial) return
    }
    save(debouncedValue)
  }, [debouncedValue, save, skipInitial])

  return {
    status,
    /** Force an immediate save with the current value */
    save: () => save(value),
  }
}
