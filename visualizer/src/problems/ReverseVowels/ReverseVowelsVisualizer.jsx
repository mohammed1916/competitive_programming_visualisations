import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import './ReverseVowelsVisualizer.css'

const CANVAS_W = 500
const CANVAS_H = 280
const CHAR_SIZE = 32

const SOLUTION_CODE = [
    { line: 1, text: 'def reverseVowels(s: str) -> str:' },
    { line: 2, text: '    s = list(s)' },
    { line: 3, text: '    left, right = 0, len(s) - 1' },
    { line: 4, text: '    while left < right:' },
    { line: 5, text: '        while left < right and s[left] not in vowels:' },
    { line: 6, text: '            left += 1' },
    { line: 7, text: '        while left < right and s[right] not in vowels:' },
    { line: 8, text: '            right -= 1' },
    { line: 9, text: '        s[left], s[right] = s[right], s[left]' },
    { line: 10, text: '        left += 1' },
    { line: 11, text: '        right -= 1' },
    { line: 12, text: '    return "".join(s)' },
]

const VOWELS = new Set('aeiouAEIOU')

function generateSteps(input) {
    const chars = input.split('')
    const steps = []

    steps.push({
        phase: 'init',
        activeLine: 3,
        chars: [...chars],
        left: 0,
        right: chars.length - 1,
        message: `Initialize: left=0, right=${chars.length - 1}`,
        swapped: new Set(),
    })

    let left = 0
    let right = chars.length - 1
    const swapped = new Set()

    while (left < right) {
        // Move left pointer
        while (left < right && !VOWELS.has(chars[left])) {
            steps.push({
                phase: 'move-left',
                activeLine: 5,
                chars: [...chars],
                left,
                right,
                message: `left=${left}: '${chars[left]}' not vowel, advance left`,
                swapped: new Set(swapped),
            })
            left++
        }

        // Move right pointer
        while (left < right && !VOWELS.has(chars[right])) {
            steps.push({
                phase: 'move-right',
                activeLine: 7,
                chars: [...chars],
                left,
                right,
                message: `right=${right}: '${chars[right]}' not vowel, advance right`,
                swapped: new Set(swapped),
            })
            right--
        }

        if (left < right) {
            // Found vowels at both pointers
            steps.push({
                phase: 'vowel-found',
                activeLine: 9,
                chars: [...chars],
                left,
                right,
                message: `Found vowels: left='${chars[left]}' @ ${left}, right='${chars[right]}' @ ${right}`,
                swapped: new Set(swapped),
            })

            // Swap
            ;[chars[left], chars[right]] = [chars[right], chars[left]]
            swapped.add(left)
            swapped.add(right)

            steps.push({
                phase: 'swapped',
                activeLine: 9,
                chars: [...chars],
                left,
                right,
                message: `Swapped: s[${left}] ↔ s[${right}] → '${chars[left]}' ↔ '${chars[right]}'`,
                swapped: new Set(swapped),
            })

            left++
            right--

            steps.push({
                phase: 'advance-pointers',
                activeLine: 10,
                chars: [...chars],
                left,
                right,
                message: `Advance: left=${left}, right=${right}`,
                swapped: new Set(swapped),
            })
        }
    }

    steps.push({
        phase: 'done',
        activeLine: 12,
        chars: [...chars],
        left: -1,
        right: -1,
        message: `Done: "${chars.join('')}"`,
        swapped: new Set(swapped),
    })

    return steps
}

const EXAMPLES = [
    { label: '"hello"', input: 'hello' },
    { label: '"leetcode"', input: 'leetcode' },
    { label: '"aA"', input: 'aA' },
]

export default function ReverseVowelsVisualizer() {
    const [input, setInput] = useState('hello')
    const [inputError, setInputError] = useState('')
    const steps = useMemo(() => generateSteps(input), [input])
    const { currentStep, isPlaying, setCurrentStep, setIsPlaying } = usePlaybackState(steps.length)

    const handleInputChange = (e) => {
        const val = e.target.value
        setInput(val)
        setInputError('')
        setCurrentStep(0)
    }

    const handleExample = useCallback((ex) => {
        setInput(ex.input)
        setInputError('')
        setCurrentStep(0)
    }, [setCurrentStep])

    if (steps.length === 0) return null

    const step = steps[currentStep]
    const xSpacing = CANVAS_W / (step.chars.length + 1)
    const yCenter = CANVAS_H / 2

    return (
        <div className="rv-shell">
            <div className="rv-top">
                <div className="rv-panel rv-panel-input">
                    <div className="rv-head">Input</div>
                    <div className="rv-body">
                        <input
                            type="text"
                            className="rv-input"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Enter string..."
                        />
                        {inputError && <div className="rv-error">{inputError}</div>}
                        <div className="rv-examples">
                            {EXAMPLES.map((ex) => (
                                <button key={ex.label} className="rv-chip" onClick={() => handleExample(ex)}>
                                    {ex.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rv-panel rv-panel-stats">
                    <div className="rv-head">Info</div>
                    <div className="rv-body">
                        <div className="rv-metric">
                            <span className="rv-label">Length</span>
                            <span className="rv-val">{step.chars.length}</span>
                        </div>
                        <div className="rv-metric">
                            <span className="rv-label">Pointers</span>
                            <span className="rv-val">
                                L={step.left >= 0 ? step.left : '—'} R={step.right >= 0 ? step.right : '—'}
                            </span>
                        </div>
                        <div className="rv-legend">
                            <div className="rv-legend-item">
                                <span className="rv-dot vowel"></span> Vowel
                            </div>
                            <div className="rv-legend-item">
                                <span className="rv-dot consonant"></span> Consonant
                            </div>
                            <div className="rv-legend-item">
                                <span className="rv-dot swapped"></span> Swapped
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rv-panel rv-panel-main">
                <div className="rv-head">Visualization</div>
                <div className="rv-canvas-container">
                    <svg className="rv-canvas" width={CANVAS_W} height={CANVAS_H}>
                        {/* Character cells */}
                        {step.chars.map((char, idx) => {
                            const x = xSpacing * (idx + 1)
                            const isVowel = VOWELS.has(char)
                            const isLeft = idx === step.left
                            const isRight = idx === step.right
                            const isSwapped = step.swapped.has(idx)

                            return (
                                <g key={idx}>
                                    <motion.rect
                                        x={x - CHAR_SIZE / 2}
                                        y={yCenter - CHAR_SIZE / 2}
                                        width={CHAR_SIZE}
                                        height={CHAR_SIZE}
                                        rx="6"
                                        fill={
                                            isSwapped
                                                ? '#a6e3a1'
                                                : isLeft || isRight
                                                  ? '#f38ba8'
                                                  : isVowel
                                                    ? '#89b4fa'
                                                    : '#313244'
                                        }
                                        stroke={
                                            isLeft
                                                ? '#f38ba8'
                                                : isRight
                                                  ? '#3b82f6'
                                                  : isVowel
                                                    ? '#89b4fa'
                                                    : '#45475a'
                                        }
                                        strokeWidth={isLeft || isRight ? '2.5' : '2'}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                    />
                                    <motion.text
                                        x={x}
                                        y={yCenter + 6}
                                        textAnchor="middle"
                                        fontSize="16"
                                        fontWeight="700"
                                        fill="#11111b"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        {char}
                                    </motion.text>
                                    <motion.text
                                        x={x}
                                        y={yCenter - 24}
                                        textAnchor="middle"
                                        fontSize="11"
                                        fill="#a6adc8"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        {idx}
                                    </motion.text>
                                </g>
                            )
                        })}

                        {/* Pointer labels */}
                        {step.left >= 0 && step.left < step.chars.length && (
                            <motion.text
                                x={xSpacing * (step.left + 1)}
                                y={yCenter - 55}
                                textAnchor="middle"
                                fontSize="12"
                                fontWeight="700"
                                fill="#f38ba8"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                L
                            </motion.text>
                        )}
                        {step.right >= 0 && step.right < step.chars.length && (
                            <motion.text
                                x={xSpacing * (step.right + 1)}
                                y={yCenter - 55}
                                textAnchor="middle"
                                fontSize="12"
                                fontWeight="700"
                                fill="#3b82f6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                R
                            </motion.text>
                        )}
                    </svg>
                </div>
            </div>

            <CodeTracePanel code={SOLUTION_CODE} activeLine={step.activeLine} />

            <div className="rv-panel">
                <div className="rv-head">Status</div>
                <div className="rv-status">{step.message}</div>
            </div>

            <PlaybackControls currentStep={currentStep} totalSteps={steps.length} onStepChange={setCurrentStep} isPlaying={isPlaying} onPlayingChange={setIsPlaying} />
        </div>
    )
}
