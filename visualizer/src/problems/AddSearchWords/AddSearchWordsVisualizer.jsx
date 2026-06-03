import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { useCodeVisualConnectivity } from '../../hooks/useCodeVisualConnectivity'
import './AddSearchWordsVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class WordDictionary:' },
    { line: 2, text: '    def __init__(self):' },
    { line: 3, text: '        self.root = {}' },
    { line: 4, text: '    def addWord(self, word: str):' },
    { line: 5, text: '        node = self.root' },
    { line: 6, text: '        for char in word:' },
    { line: 7, text: '            if char not in node:' },
    { line: 8, text: '                node[char] = {}' },
    { line: 9, text: '            node = node[char]' },
    { line: 10, text: '        node["*"] = True' },
    { line: 11, text: '    def search(self, word: str):' },
    { line: 12, text: '        def dfs(node, i):' },
    { line: 13, text: '            if i == len(word):' },
    { line: 14, text: '                return "*" in node' },
    { line: 15, text: '            char = word[i]' },
    { line: 16, text: '            if char == ".":' },
    { line: 17, text: '                for child in node.values():' },
    { line: 18, text: '                    if dfs(child, i + 1): return True' },
    { line: 19, text: '            elif char in node:' },
    { line: 20, text: '                if dfs(node[char], i + 1): return True' },
    { line: 21, text: '            return False' },
]

function buildTrie(words) {
    const trie = {}
    for (const word of words) {
        let node = trie
        for (const char of word) {
            if (!node[char]) node[char] = {}
            node = node[char]
        }
        node['*'] = true
    }
    return trie
}

function generateSearchSteps(trie, searchWord) {
    const steps = []
    const visited = new Set()

    const dfs = (node, i, path, depth) => {
        const pathStr = path.join('')
        const key = `${pathStr}_${i}`
        if (visited.has(key) && depth > 0) return false

        if (i === searchWord.length) {
            steps.push({
                phase: 'check_end',
                activeLine: 14,
                path,
                found: '*' in node,
                message: `End of pattern. Word "${pathStr}" is ${('*' in node) ? 'FOUND' : 'NOT FOUND'}.`,
            })
            return '*' in node
        }

        const char = searchWord[i]

        if (char === '.') {
            steps.push({
                phase: 'wildcard',
                activeLine: 16,
                path,
                char,
                childCount: Object.keys(node).filter(k => k !== '*').length,
                message: `Wildcard '.': try all ${Object.keys(node).filter(k => k !== '*').length} children.`,
            })

            for (const child of Object.keys(node)) {
                if (child === '*') continue
                const newPath = [...path, child]
                steps.push({
                    phase: 'wildcard_try',
                    activeLine: 17,
                    path: newPath,
                    char: child,
                    message: `Try child: '${child}'`,
                })
                if (dfs(node[child], i + 1, newPath, depth + 1)) return true
            }
            steps.push({
                phase: 'wildcard_fail',
                activeLine: 21,
                path,
                message: `No valid child for '.'. Backtrack.`,
            })
            return false
        } else {
            steps.push({
                phase: 'char_check',
                activeLine: 19,
                path,
                char,
                exists: char in node,
                message: `Check if '${char}' exists: ${(char in node) ? 'YES' : 'NO'}.`,
            })

            if (char in node) {
                const newPath = [...path, char]
                steps.push({
                    phase: 'char_advance',
                    activeLine: 20,
                    path: newPath,
                    char,
                    message: `Move to child '${char}'.`,
                })
                if (dfs(node[char], i + 1, newPath, depth + 1)) return true
            }
            steps.push({
                phase: 'char_fail',
                activeLine: 21,
                path,
                message: `'${char}' not found or not end. Backtrack.`,
            })
            return false
        }
    }

    steps.push({
        phase: 'search_start',
        activeLine: 11,
        path: [],
        message: `Search for "${searchWord}".`,
    })

    const result = dfs(trie, 0, [], 0)
    return steps
}

function renderTrieNode(node, x, y, isRoot = false) {
    const chars = Object.keys(node).filter(k => k !== '*').sort()
    const isWord = '*' in node
    const nodeCount = chars.length
    const radius = isRoot ? 20 : 16

    const nodes = [
        <motion.g
            key={`node-${x}-${y}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            <circle
                cx={x}
                cy={y}
                r={radius}
                fill={isRoot ? '#a6e3a1' : isWord ? '#94e2d5' : '#f5c2e7'}
                stroke={isWord ? '#00ff00' : '#ccc'}
                strokeWidth={isWord ? 2.5 : 1.5}
            />
            <text
                x={x}
                y={y}
                textAnchor="middle"
                dy="0.3em"
                fontSize="11"
                fontWeight="600"
                fill="#1e1e2e"
            >
                {isRoot ? '∅' : ''}
            </text>
        </motion.g>
    ]

    const spacing = 60
    chars.forEach((char, idx) => {
        const offsetX = (idx - (nodeCount - 1) / 2) * spacing
        const childX = x + offsetX
        const childY = y + 80

        nodes.push(
            <motion.line
                key={`line-${x}-${y}-${char}`}
                x1={x}
                y1={y}
                x2={childX}
                y2={childY}
                stroke="#888"
                strokeWidth="1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            />
        )

        nodes.push(
            <motion.text
                key={`label-${x}-${y}-${char}`}
                x={(x + childX) / 2}
                y={(y + childY) / 2 - 5}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill="#22c55e"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                {char}
            </motion.text>
        )

        nodes.push(...renderTrieNode(node[char], childX, childY, false))
    })

    return nodes
}

function AddSearchWordsVisualizer() {
    const [inputWord, setInputWord] = useState('')
    const [words, setWords] = useState(['bad', 'dad', 'mad'])
    const [searchWord, setSearchWord] = useState('pad')
    const [mode, setMode] = useState('add')

    const trie = useMemo(() => buildTrie(words), [words])

    const steps = useMemo(() => {
        if (mode === 'search') {
            return generateSearchSteps(trie, searchWord)
        }
        return []
    }, [trie, searchWord, mode])

    const { currentStep, isPlaying, setIsPlaying, setCurrentStep } =
        usePlaybackState(steps.length)
    const { lineConnections } = useCodeVisualConnectivity(
        currentStep < steps.length ? steps[currentStep]?.activeLine : -1
    )

    const currentStepData = currentStep < steps.length ? steps[currentStep] : null

    const handleAddWord = (e) => {
        e.preventDefault()
        if (inputWord.trim() && !words.includes(inputWord.trim())) {
            setWords([...words, inputWord.trim()])
            setInputWord('')
        }
    }

    const handleRemoveWord = (idx) => {
        setWords(words.filter((_, i) => i !== idx))
    }

    const handleExampleSearch = (example) => {
        setSearchWord(example)
        setMode('search')
        setCurrentStep(0)
    }

    const examples = ['pad', 'bad', '.ad', 'b..', '...']

    return (
        <div className="asw-shell">
            <div className="asw-panel">
                <div className="asw-head">
                    <span>Trie Structure & Wildcard Search</span>
                </div>
                <div className="asw-body">
                    <div className="asw-top-row">
                        <label className="asw-label">Add Words:</label>
                        <form onSubmit={handleAddWord} className="asw-input-group">
                            <input
                                type="text"
                                value={inputWord}
                                onChange={(e) => setInputWord(e.target.value)}
                                placeholder="Enter word"
                                className="asw-input"
                            />
                            <button type="submit" className="asw-btn-add">
                                Add
                            </button>
                        </form>
                    </div>

                    <div className="asw-words-list">
                        {words.length === 0 ? (
                            <span className="asw-empty">No words added</span>
                        ) : (
                            words.map((word, idx) => (
                                <motion.div
                                    key={idx}
                                    className="asw-word-chip"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                >
                                    <span>{word}</span>
                                    <button
                                        onClick={() => handleRemoveWord(idx)}
                                        className="asw-chip-remove"
                                    >
                                        ×
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </div>

                    <div className="asw-divider" />

                    <div className="asw-top-row">
                        <label className="asw-label">Search Pattern:</label>
                        <input
                            type="text"
                            value={searchWord}
                            onChange={(e) => setSearchWord(e.target.value)}
                            placeholder="Enter pattern (use . for wildcard)"
                            className="asw-input asw-search-input"
                        />
                        <button
                            onClick={() => {
                                setMode('search')
                                setCurrentStep(0)
                            }}
                            className="asw-btn-search"
                        >
                            Search
                        </button>
                    </div>

                    <div className="asw-examples">
                        <span className="asw-example-label">Examples:</span>
                        {examples.map((ex) => (
                            <button
                                key={ex}
                                onClick={() => handleExampleSearch(ex)}
                                className="asw-example-btn"
                            >
                                {ex}
                            </button>
                        ))}
                    </div>

                    {mode === 'search' && currentStepData && (
                        <div className="asw-status">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="asw-message"
                            >
                                {currentStepData.message}
                            </motion.div>
                        </div>
                    )}

                    <svg
                        viewBox="0 0 600 300"
                        className="asw-trie-viz"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        <AnimatePresence>
                            {renderTrieNode(trie, 300, 30, true)}
                        </AnimatePresence>
                    </svg>
                </div>
            </div>

            <CodeTracePanel code={SOLUTION_CODE} lineConnections={lineConnections} />

            <PlaybackControls
                currentStep={currentStep}
                totalSteps={steps.length}
                isPlaying={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onStepForward={() => setCurrentStep(Math.min(currentStep + 1, steps.length - 1))}
                onStepBackward={() => setCurrentStep(Math.max(currentStep - 1, 0))}
                onReset={() => setCurrentStep(0)}
            />
        </div>
    )
}

export default AddSearchWordsVisualizer
