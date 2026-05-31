import { useCallback } from 'react'

export function useApplyExample(applyFn, handleReset) {
  return useCallback(
    (example) => {
      applyFn(example)
      handleReset()
    },
    [applyFn, handleReset],
  )
}
