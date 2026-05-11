import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './GroupAnagramsVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:' },
    { line: 3, text: '        anagram_map = {}' },
    { line: 4, text: '' },
    { line: 5, text: '        for word in strs:' },
    { line: 6, text: '            key = tuple(sorted(word))' },
    { line: 7, text: '' },
    { line: 8, text: '            if key not in anagram_map:' },
    { line: 9, text: '                anagram_map[key] = []' },
    { line: 10, text: '' },
    { line: 11, text: '            anagram_map[key].append(word)' },
    { line: 12, text: '' },
    { line: 13, text: '        return list(anagram_map.values())' },
]

const COLORS = ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#14b8a6', '#eab308', '#ef4444', '#ec4899']

function generateSteps(strs) {
    const steps = []
    const anagramMap = {}  // key (sorted string) → [words]
    const keyToColor = {}
    let colorIdx = 0

    steps.push({
        phase: 'init', activeLine: 3,
        currentWordIdx: -1, currentKey: null,
        anagramMap: {}, keyToColor: {},
        message: 'Initialize empty hash map.',
    })

    for (let i = 0; i < strs.length; i++) {
        const word = strs[i]

        steps.push({
            phase: 'pick', activeLine: 5,
            currentWordIdx: i, currentKey: null,
            anagramMap: JSON.parse(JSON.stringify(anagramMap)),
            keyToColor: JSON.parse(JSON.stringify(keyToColor)),
            message: `Processing word "${word}" (index ${i}).`,
        })

        const key = word.split('').sort().join('')

        steps.push({
            phase: 'sort', activeLine: 6,
            currentWordIdx: i, currentKey: key,
            anagramMap: JSON.parse(JSON.stringify(anagramMap)),
            keyToColor: JSON.parse(JSON.stringify(keyToColor)),
            message: `Sorted "${word}" → key = "${key}".`,
        })

        const isNew = !(key in anagramMap)

        if (isNew) {
            keyToColor[key] = COLORS[colorIdx % COLORS.length]
            colorIdx++
            anagramMap[key] = []
            steps.push({
                phase: 'new_group', activeLine: 9,
                currentWordIdx: i, currentKey: key,
                anagramMap: JSON.parse(JSON.stringify(anagramMap)),
                keyToColor: JSON.parse(JSON.stringify(keyToColor)),
                message: `Key "${key}" is new → create new group.`,
            })
        } else {
            steps.push({
                phase: 'existing', activeLine: 8,
                currentWordIdx: i, currentKey: key,
                anagramMap: JSON.parse(JSON.stringify(anagramMap)),
                keyToColor: JSON.parse(JSON.stringify(keyToColor)),
                message: `Key "${key}" already exists → join its group.`,
            })
        }

        anagramMap[key].push(word)

        steps.push({
            phase: 'append', activeLine: 11,
            currentWordIdx: i, currentKey: key,
            anagramMap: JSON.parse(JSON.stringify(anagramMap)),
            keyToColor: JSON.parse(JSON.stringify(keyToColor)),
            message: `Appended "${word}" to group [${anagramMap[key].join(', ')}].`,
        })
    }

    steps.push({
        phase: 'done', activeLine: 13,
        currentWordIdx: -1, currentKey: null,
        anagramMap: JSON.parse(JSON.stringify(anagramMap)),
        keyToColor: JSON.parse(JSON.stringify(keyToColor)),
        message: `Done. ${Object.keys(anagramMap).length} group(s) found.`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'Classic', strs: ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'] },
    { label: 'Single', strs: ['a'] },
    { label: 'Mixed', strs: ['abc', 'bca', 'xyz', 'zyx', 'foo', 'oof', 'bar'] },
    { label: 'Same key', strs: ['abc', 'acb', 'bac', 'bca', 'cab', 'cba'] },
]

export default function GroupAnagramsVisualizer() {
    const [input, setInput] = useState('["eat","tea","tan","ate","nat","bat"]')

    const { strs, inputError } = useMemo(() => {
        try {
            const parsed = JSON.parse(input)
            if (!Array.isArray(parsed) || !parsed.every(s => typeof s === 'string'))
                throw new Error('Must be a JSON array of strings')
            if (parsed.length > 12) throw new Error('Max 12 words for clarity')
            return { strs: parsed, inputError: '' }
        } catch (e) {
            return { strs: ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'], inputError: e.message }
        }
    }, [input])

    const steps = useMemo(() => generateSteps(strs), [strs])
    const { stepIndex, stepForward, stepBack, togglePlay, handleReset, isPlaying, speed, setSpeed, isDone } = usePlaybackState(steps.length)

    const step = stepIndex >= 0 ? steps[stepIndex] : null
    const applyExample = useCallback((ex) => {
        setInput(JSON.stringify(ex.strs))
        handleReset()
    }, [handleReset])

    const anagramMap = step?.anagramMap ?? {}
    const keyToColor = step?.keyToColor ?? {}
    const currentKey = step?.currentKey ?? null
    const currentWordIdx = step?.currentWordIdx ?? -1

    return (
        <div className="ga-shell">
            <section className="ga-panel">
                <header className="ga-head">
                    <span>Group Anagrams · Hash Map</span>
                    {inputError && <span className="ga-error">{inputError}</span>}
                </header>
                <div className="ga-body">
                    {/* Controls */}
                    <div className="ga-top-row">
                        <div className="ga-examples">
                            {EXAMPLES.map(ex => (
                                <button key={ex.label} className="ga-chip" onClick={() => applyExample(ex)}>{ex.label}</button>
                            ))}
                        </div>
                        <div className="ga-input-group">
                            <label className="ga-label">strs (JSON array of strings)</label>
                            <input className="ga-input" value={input}
                                onChange={e => { setInput(e.target.value); handleReset() }} />
                        </div>
                    </div>

                    {/* Words row */}
                    <div className="ga-section-title">Input Words</div>
                    <div className="ga-words-row">
                        {strs.map((w, idx) => {
                            const isCurrent = idx === currentWordIdx
                            const groupKey = step?.anagramMap && step.currentWordIdx > idx
                                ? Object.keys(step.anagramMap).find(k => step.anagramMap[k].includes(w))
                                : (isCurrent ? currentKey : null)
                            const col = groupKey ? keyToColor[groupKey] : null
                            return (
                                <motion.div
                                    key={idx}
                                    className={['ga-word', isCurrent ? 'active' : ''].filter(Boolean).join(' ')}
                                    style={col ? { borderColor: col, color: col, background: col + '22' } : {}}
                                    animate={{ y: isCurrent ? -6 : 0, scale: isCurrent ? 1.1 : 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                                >
                                    {w}
                                    <span className="ga-word-idx">{idx}</span>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Current key */}
                    {currentKey && (
                        <motion.div className="ga-key-box"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ borderColor: keyToColor[currentKey] ?? '#475569', color: keyToColor[currentKey] ?? 'var(--text)' }}>
                            sorted key: <strong>"{currentKey}"</strong>
                        </motion.div>
                    )}

                    {/* Groups */}
                    <div className="ga-section-title">Hash Map Groups</div>
                    <div className="ga-groups">
                        <AnimatePresence>
                            {Object.entries(anagramMap).map(([k, words]) => {
                                const col = keyToColor[k] ?? '#475569'
                                const isActive = k === currentKey
                                return (
                                    <motion.div key={k} className={['ga-group', isActive ? 'active' : ''].filter(Boolean).join(' ')}
                                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                        style={{ borderColor: col + (isActive ? 'cc' : '55'), background: col + '11' }}>
                                        <span className="ga-group-key" style={{ color: col }}>"{k}"</span>
                                        <span className="ga-group-arrow">→</span>
                                        <div className="ga-group-words">
                                            {words.map((w, i) => (
                                                <span key={i} className="ga-group-word" style={{ borderColor: col + '88', color: col }}>{w}</span>
                                            ))}
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            </section>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} />

            <div className={`ga-status${step?.phase === 'done' ? ' ok' : ''}`}>
                {step?.message ?? 'Press Play or Step to begin.'}
            </div>

            <PlaybackControls
                isPlaying={isPlaying} isDone={isDone} speed={speed}
                onPlayToggle={togglePlay} onPrev={stepBack} onNext={stepForward}
                onReset={handleReset} prevDisabled={stepIndex < 0}
                nextDisabled={isDone} resetDisabled={stepIndex < 0}
                onSpeedChange={e => setSpeed(Number(e.target.value))}
            />
        </div>
    )
}
