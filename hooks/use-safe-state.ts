import { useCallback, useRef } from 'react'

export function useSafeState<T>(
  setState: React.Dispatch<React.SetStateAction<T>>
) {
  const isMountedRef = useRef(true)
  
  const safeSetState = useCallback((value: T | ((prev: T) => T)) => {
    if (isMountedRef.current) {
      try {
        setState(value)
      } catch (error) {
        console.error('Safe setState error:', error)
      }
    }
  }, [setState])

  // Effect cleanup to mark component as unmounted
  const cleanup = useCallback(() => {
    isMountedRef.current = false
  }, [])

  return { safeSetState, cleanup }
}
