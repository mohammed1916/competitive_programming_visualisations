import { useMemo } from 'react'
import { getProblemCodeLines } from '../data/problemCodeRegistry'

export function useProblemCode(problem, fallbackSlug = '', fallbackLines = []) {
  return useMemo(() => {
    const candidateSlugs = [problem?.slug, fallbackSlug].filter(Boolean)
    for (const slug of candidateSlugs) {
      const lines = getProblemCodeLines(slug)
      if (lines.length > 0) return lines
    }
    return fallbackLines
  }, [fallbackLines, fallbackSlug, problem?.slug])
}
