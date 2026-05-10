import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './ImplementTrieVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class TrieNode:' },
  { line: 2, text: '    def __init__(self): self.children = {}; self.end = False' },
  { line: 3, text: 'class Trie:' },
  { line: 4, text: '    def insert(self, word):' },
  { line: 5, text: '        node = self.root' },
  { line: 6, text: '        for ch in word:' },
  { line: 7, text: '            if ch not in node.children: node.children[ch] = TrieNode()' },
  { line: 8, text: '            node = node.children[ch]' },
  { line: 9, text: '        node.end = True' },
  { line: 10, text: '    def search(self, word): return walk(word) and node.end' },
  { line: 11, text: '    def startsWith(self, prefix): return walk(prefix)' },
]

function parseOps(input) {
  const parsed = JSON.parse(input)
  if (!Array.isArray(parsed)) throw new Error('ops must be array')
  return parsed
}

function generateSteps(ops) {
  const root = { end: false, children: {} }
  const steps = []
  const clone = (obj) => JSON.parse(JSON.stringify(obj))

  const walk = (word) => {
    let node = root
    for (const ch of word) {
      if (!node.children[ch]) return null
      node = node.children[ch]
    }
    return node
  }

  for (const [type, arg] of ops) {
    if (type === 'insert') {
      let node = root
      for (const ch of arg) {
        steps.push({ phase: 'insert_step', activeLine: 7, op: [type, arg], char: ch, trie: clone(root), result: null, message: `Insert '${ch}' for "${arg}".` })
        if (!node.children[ch]) node.children[ch] = { end: false, children: {} }
        node = node.children[ch]
      }
      node.end = true
      steps.push({ phase: 'insert_done', activeLine: 9, op: [type, arg], char: null, trie: clone(root), result: true, message: `Word "${arg}" inserted.` })
    } else if (type === 'search') {
      const node = walk(arg)
      const ok = !!node && node.end
      steps.push({ phase: 'search', activeLine: 10, op: [type, arg], char: null, trie: clone(root), result: ok, message: `search("${arg}") => ${ok}` })
    } else if (type === 'startsWith') {
      const ok = !!walk(arg)
      steps.push({ phase: 'prefix', activeLine: 11, op: [type, arg], char: null, trie: clone(root), result: ok, message: `startsWith("${arg}") => ${ok}` })
    }
  }
  return steps
}

const EXAMPLES = [
  { label: 'Core', ops: [['insert', 'apple'], ['search', 'apple'], ['search', 'app'], ['startsWith', 'app'], ['insert', 'app'], ['search', 'app']] },
  { label: 'Simple', ops: [['insert', 'cat'], ['insert', 'car'], ['startsWith', 'ca'], ['search', 'cab']] },
]

function renderTrie(node, prefix = '', depth = 0) {
  const keys = Object.keys(node.children).sort()
  return keys.flatMap((k) => {
    const n = node.children[k]
    const word = `${prefix}${k}`
    return [{ word, end: n.end, depth }, ...renderTrie(n, word, depth + 1)]
  })
}

export default function ImplementTrieVisualizer() {
  const [opsInput, setOpsInput] = useState('[["insert","apple"],["search","apple"],["search","app"],["startsWith","app"],["insert","app"],["search","app"]]')
  const { ops, inputError } = useMemo(() => {
    try {
      return { ops: parseOps(opsInput), inputError: '' }
    } catch (e) {
      return { ops: EXAMPLES[0].ops, inputError: e.message || 'Invalid input' }
    }
  }, [opsInput])
  const steps = useMemo(() => generateSteps(ops), [ops])
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
  const step = stepIndex >= 0 ? steps[stepIndex] : null
  const nodes = useMemo(() => renderTrie(step?.trie || { end: false, children: {} }), [step])
  const applyExample = useCallback((ex) => { setOpsInput(JSON.stringify(ex.ops)); handleReset() }, [handleReset])

  return (
    <div className="trie-shell">
      <div className="trie-top">
        <section className="trie-panel">
          <header className="trie-head"><span>Operations</span>{inputError && <span className="trie-error">{inputError}</span>}</header>
          <div className="trie-body">
            <div className="trie-examples">{EXAMPLES.map((ex) => <button key={ex.label} className="trie-chip" onClick={() => applyExample(ex)}>{ex.label}</button>)}</div>
            <input className="trie-input" value={opsInput} onChange={(e) => { setOpsInput(e.target.value); handleReset() }} />
            <div className="trie-op">{step?.op ? `${step.op[0]}("${step.op[1]}")` : 'Press Play'}</div>
          </div>
        </section>
        <section className="trie-panel side">
          <header className="trie-head"><span>Trie Nodes</span></header>
          <div className="trie-body">
            <div className="trie-nodes">
              <AnimatePresence>
                {nodes.map((n) => (
                  <motion.div key={`${n.word}-${n.depth}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`trie-node ${n.end ? 'end' : ''}`} style={{ marginLeft: `${n.depth * 16}px` }}>
                    <span>{n.word}</span>
                    {n.end && <strong>end</strong>}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className={`trie-result ${step?.result === false ? 'bad' : step?.result === true ? 'ok' : ''}`}>
              {step?.result === null || step?.result === undefined ? 'Pending' : `Result: ${String(step.result)}`}
            </div>
          </div>
        </section>
      </div>
      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      <div className={`trie-status ${step?.result === false ? 'bad' : step?.result === true ? 'ok' : ''}`}>{step?.message || 'Press Play.'}</div>
      <PlaybackControls
        isPlaying={isPlaying}
        isDone={isDone}
        speed={speed}
        onPlayToggle={togglePlay}
        onPrev={stepBack}
        onNext={stepForward}
        onReset={handleReset}
        prevDisabled={stepIndex < 0}
        nextDisabled={isDone}
        resetDisabled={stepIndex < 0}
        onSpeedChange={(e) => setSpeed(Number(e.target.value))}
      />
    </div>
  )
}
