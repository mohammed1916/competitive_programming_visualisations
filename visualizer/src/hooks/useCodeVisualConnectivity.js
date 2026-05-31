import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  collectStepLines,
  findNearestStepIndexByLine,
  getStepSnippetId,
  normalizeConnectivityStep,
} from '../components/connectivity/stepContract'

export function useCodeVisualConnectivity({
  steps,
  stepIndex,
  snippetOptions = [],
  onStepJump,
}) {
  const normalizedSteps = useMemo(
    () => (Array.isArray(steps) ? steps.map((step) => normalizeConnectivityStep(step)) : []),
    [steps],
  )

  const currentStep = stepIndex >= 0 ? normalizedSteps[stepIndex] : null
  const [manualLines, setManualLines] = useState([])
  const [linkInfo, setLinkInfo] = useState(null)

  useEffect(() => {
    setManualLines([])
    setLinkInfo(null)
  }, [stepIndex])

  const stepLines = useMemo(() => collectStepLines(currentStep), [currentStep])

  const highlightedLines = useMemo(
    () => [...new Set([...stepLines, ...manualLines])].sort((a, b) => a - b),
    [manualLines, stepLines],
  )

  const activeSnippetId = useMemo(
    () => getStepSnippetId(currentStep, snippetOptions),
    [currentStep, snippetOptions],
  )

  const setVisualFocus = useCallback(({ lines = [], reason, targetType = 'visual', targetId = '' }) => {
    const normalizedLines = [...new Set(lines.filter((line) => Number.isInteger(line)))].sort((a, b) => a - b)
    setManualLines(normalizedLines)
    setLinkInfo({
      lines: normalizedLines,
      reason: reason || 'Visual element selected.',
      targetType,
      targetId,
    })
  }, [])

  const handleLineSelect = useCallback((line) => {
    if (!Number.isInteger(line)) return

    const targetStepIndex = findNearestStepIndexByLine(normalizedSteps, stepIndex, line)
    if (targetStepIndex >= 0 && targetStepIndex !== stepIndex && onStepJump) {
      onStepJump(targetStepIndex)
    }

    setVisualFocus({
      lines: [line],
      reason: `Code line ${line} selected.`,
      targetType: 'code',
      targetId: String(line),
    })
  }, [normalizedSteps, onStepJump, setVisualFocus, stepIndex])

  const handleSnippetSelect = useCallback((snippet) => {
    if (!snippet) return
    const snippetLines = Array.isArray(snippet.lines)
      ? snippet.lines.filter((line) => Number.isInteger(line))
      : []

    if (snippetLines.length > 0) {
      const targetStepIndex = findNearestStepIndexByLine(normalizedSteps, stepIndex, snippetLines[0])
      if (targetStepIndex >= 0 && targetStepIndex !== stepIndex && onStepJump) {
        onStepJump(targetStepIndex)
      }
    }

    setVisualFocus({
      lines: snippetLines,
      reason: `Snippet "${snippet.label}" selected.`,
      targetType: 'snippet',
      targetId: snippet.id,
    })
  }, [normalizedSteps, onStepJump, setVisualFocus, stepIndex])

  const clearVisualFocus = useCallback(() => {
    setManualLines([])
    setLinkInfo(null)
  }, [])

  return {
    currentStep,
    highlightedLines,
    activeSnippetId,
    linkInfo,
    setVisualFocus,
    clearVisualFocus,
    handleLineSelect,
    handleSnippetSelect,
  }
}
