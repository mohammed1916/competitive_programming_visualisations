import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './RedundantConnectionVisualizer.css'

const SOLUTION_CODE = [
  { line: 1, text: 'class Solution:' },
  { line: 2, text: '    def findRedundantConnection(self, edges):' },
  { line: 3, text: '        parent = [i for i in range(len(edges)+1)]' },
  { line: 4, text: '        rank = [1] * (len(edges)+1)' },
  { line: 5, text: '        def find(x):' },
  { line: 6, text: '            while x != parent[x]: x = parent[x]' },
  { line: 7, text: '            return x' },
  { line: 8, text: '        def union(a, b):' },
  { line: 9, text: '            ra, rb = find(a), find(b)' },
  { line: 10, text: '            if ra == rb: return False' },
  { line: 11, text: '            if rank[ra] < rank[rb]: parent[ra] = rb' },
  { line: 12, text: '            elif rank[ra] > rank[rb]: parent[rb] = ra' },
  { line: 13, text: '            else: parent[rb] = ra; rank[ra] += 1' },
  { line: 14, text: '            return True' },
  { line: 15, text: '        for u, v in edges:' },
  { line: 16, text: '            if not union(u, v): return [u, v]' },
]

function parseEdges(input) {
  const parsed = JSON.parse(input)
  if (!Array.isArray(parsed)) throw new Error('edges must be 2D array')
  return parsed.map((e) => [Number(e[0]), Number(e[1])])
}

function generateSteps(edges) {
  const n = edges.length
  const parent = Array.from({ length: n + 1 }, (_, i) => i)
  const rank = Array(n + 1).fill(1)
  const steps = [{ phase: 'init', activeLine: 4, edge: null, parent: [...parent], rank: [...rank], roots: [], redundant: null, message: 'Initialize parent and rank arrays.' }]

  const find = (x) => {
    while (x !== parent[x]) x = parent[x]
    return x
  }

  for (const [u, v] of edges) {
    const ru = find(u)
    const rv = find(v)
    steps.push({
      phase: 'check',
      activeLine: 10,
      edge: [u, v],
      parent: [...parent],
      rank: [...rank],
      roots: [ru, rv],
      redundant: null,
      message: `Edge [${u}, ${v}]: roots are ${ru} and ${rv}.`,
    })
    if (ru === rv) {
      steps.push({
        phase: 'done',
        activeLine: 16,
        edge: [u, v],
        parent: [...parent],
        rank: [...rank],
        roots: [ru, rv],
        redundant: [u, v],
        message: `Cycle found. Redundant edge is [${u}, ${v}].`,
      })
      return steps
    }
    if (rank[ru] < rank[rv]) parent[ru] = rv
    else if (rank[ru] > rank[rv]) parent[rv] = ru
    else {
      parent[rv] = ru
      rank[ru] += 1
    }
    steps.push({
      phase: 'union',
      activeLine: 14,
      edge: [u, v],
      parent: [...parent],
      rank: [...rank],
      roots: [ru, rv],
      redundant: null,
      message: `Union ${u} and ${v}.`,
    })
  }

  steps.push({ phase: 'done', activeLine: 16, edge: null, parent: [...parent], rank: [...rank], roots: [], redundant: null, message: 'No redundant edge found.' })
  return steps
}

const EXAMPLES = [
  { label: 'Triangle', edges: [[1, 2], [1, 3], [2, 3]] },
  { label: 'Late Cycle', edges: [[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]] },
]

export default function RedundantConnectionVisualizer() {
  const [edgesInput, setEdgesInput] = useState('[[1,2],[1,3],[2,3]]')
  const { edges, inputError } = useMemo(() => {
    try {
      return { edges: parseEdges(edgesInput), inputError: '' }
    } catch (e) {
      return { edges: [[1, 2], [1, 3], [2, 3]], inputError: e.message || 'Invalid input' }
    }
  }, [edgesInput])

  const steps = useMemo(() => generateSteps(edges), [edges])
  const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)
  const step = stepIndex >= 0 ? steps[stepIndex] : null

  const applyExample = useCallback((ex) => { setEdgesInput(JSON.stringify(ex.edges)); handleReset() }, [handleReset])
  const nodes = useMemo(() => Array.from(new Set(edges.flat())), [edges])

  return (
    <div className="rc-shell">
      <div className="rc-top">
        <section className="rc-panel">
          <header className="rc-head"><span>Union-Find Edges</span>{inputError && <span className="rc-error">{inputError}</span>}</header>
          <div className="rc-body">
            <div className="rc-examples">{EXAMPLES.map((ex) => <button key={ex.label} className="rc-chip" onClick={() => applyExample(ex)}>{ex.label}</button>)}</div>
            <input className="rc-input" value={edgesInput} onChange={(e) => { setEdgesInput(e.target.value); handleReset() }} />
            <div className="rc-edges">
              {edges.map(([u, v], i) => (
                <motion.div key={`${u}-${v}-${i}`} className={`rc-edge ${step?.edge?.[0] === u && step?.edge?.[1] === v ? 'active' : ''}`}>
                  [{u}, {v}]
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <section className="rc-panel side">
          <header className="rc-head"><span>Parent / Rank</span></header>
          <div className="rc-body">
            <div className="rc-grid">
              {nodes.map((n) => (
                <div key={n} className="rc-node-card">
                  <span>node {n}</span>
                  <strong>p:{step?.parent?.[n] ?? n} r:{step?.rank?.[n] ?? 1}</strong>
                </div>
              ))}
            </div>
            <div className={`rc-result ${step?.redundant ? 'bad' : ''}`}>
              {step?.redundant ? `Return [${step.redundant[0]}, ${step.redundant[1]}]` : 'Scanning edges'}
            </div>
          </div>
        </section>
      </div>
      <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />
      <div className={`rc-status ${step?.redundant ? 'bad' : ''}`}>{step?.message || 'Press Play.'}</div>
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
