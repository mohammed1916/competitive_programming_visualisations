export function normalizeConnectivityStep(step) {
  if (!step || typeof step !== 'object') {
    return {
      activeLine: null,
      relatedLines: [],
      message: '',
      snippetId: null,
      focusTargets: [],
      phase: null,
    }
  }

  const activeLine = Number.isInteger(step.activeLine) ? step.activeLine : null
  const relatedLines = Array.isArray(step.relatedLines)
    ? step.relatedLines.filter((line) => Number.isInteger(line))
    : activeLine != null
      ? [activeLine]
      : []

  return {
    ...step,
    activeLine,
    relatedLines: [...new Set(relatedLines)],
    message: typeof step.message === 'string' ? step.message : '',
    snippetId: step.snippetId ?? null,
    focusTargets: Array.isArray(step.focusTargets) ? step.focusTargets : [],
    phase: step.phase ?? null,
  }
}

export function collectStepLines(step) {
  if (!step) return []
  const lines = []
  if (Number.isInteger(step.activeLine)) lines.push(step.activeLine)
  if (Array.isArray(step.relatedLines)) {
    for (const line of step.relatedLines) {
      if (Number.isInteger(line)) lines.push(line)
    }
  }
  return [...new Set(lines)].sort((a, b) => a - b)
}

export function inferSnippetId(step) {
  if (!step) return null
  const phase = String(step.phase || '').toLowerCase()

  if (phase.includes('parse')) return 'parse'
  if (phase.includes('init')) return 'init'
  if (phase.includes('done') || phase.includes('return')) return 'return'
  if (phase.includes('loop') || phase.includes('while') || phase.includes('for') || phase.includes('call') || phase.includes('expand')) return 'loop'
  if (phase.includes('update') || phase.includes('shrink') || phase.includes('best') || phase.includes('calc') || phase.includes('advance') || phase.includes('right')) return 'update'

  return null
}

export function getStepSnippetId(step, snippetOptions = []) {
  if (!step) return null
  if (step.snippetId && snippetOptions.some((snippet) => snippet.id === step.snippetId)) {
    return step.snippetId
  }

  return inferSnippetId(step)
}

export function findNearestStepIndexByLine(steps, currentIndex, line) {
  if (!Array.isArray(steps) || !Number.isInteger(line)) return -1
  if (!steps.length) return -1

  let bestIndex = -1
  let bestDistance = Number.POSITIVE_INFINITY

  steps.forEach((step, index) => {
    const lines = collectStepLines(step)
    if (!lines.includes(line)) return
    const distance = Math.abs(index - (Number.isInteger(currentIndex) ? currentIndex : -1))
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  })

  return bestIndex
}
