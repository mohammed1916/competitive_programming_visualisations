import { useMemo } from 'react'

export function useParsedInput(input, parseFn, fallbackValue, fallbackError = 'Invalid input') {
  return useMemo(() => {
    try {
      return {
        value: parseFn(input),
        error: '',
      }
    } catch (error) {
      return {
        value: fallbackValue,
        error: error?.message || fallbackError,
      }
    }
  }, [fallbackError, fallbackValue, input, parseFn])
}
