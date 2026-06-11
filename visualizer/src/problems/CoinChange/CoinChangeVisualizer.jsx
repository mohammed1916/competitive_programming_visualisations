import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodeTracePanel from '../../components/CodeTracePanel'
import PlaybackControls from '../../components/PlaybackControls'
import PatternOverlay from '../../components/PatternOverlay'
import { usePlaybackState } from '../../hooks/usePlaybackState'
import { usePatternOverlay } from '../../hooks/usePatternOverlay'
import './CoinChangeVisualizer.css'

const SOLUTION_CODE = [
    { line: 1, text: 'class Solution:' },
    { line: 2, text: '    def coinChange(self, coins: List[int], amount: int) -> int:' },
    { line: 3, text: '        dp = [float("inf")] * (amount + 1)' },
    { line: 4, text: '        dp[0] = 0' },
    { line: 5, text: '' },
    { line: 6, text: '        for a in range(1, amount + 1):' },
    { line: 7, text: '            for c in coins:' },
    { line: 8, text: '                if c <= a:' },
    { line: 9, text: '                    dp[a] = min(dp[a], dp[a - c] + 1)' },
    { line: 10, text: '' },
    { line: 11, text: '        return dp[amount] if dp[amount] != float("inf") else -1' },
]

const INF = Infinity

function generateSteps(coins, amount) {
    const steps = []

    if (amount <= 0 || coins.length === 0) {
        const dp = amount === 0 ? [0] : Array(amount + 1).fill(INF)
        steps.push({
            phase: 'done', activeLine: 11, coins, amount, dp,
            activeA: -1, activeC: -1, result: amount === 0 ? 0 : -1,
            message: amount === 0 ? 'Amount is 0. Return 0.' : 'No coins given. Return -1.',
        })
        return steps
    }

    const dp = Array(amount + 1).fill(INF)
    dp[0] = 0

    steps.push({
        phase: 'init', activeLine: 4, coins, amount, dp: [...dp],
        activeA: -1, activeC: -1, result: null,
        message: 'Initialize dp[0] = 0 (zero coins needed for amount 0); all other entries = ∞.',
    })

    for (let a = 1; a <= amount; a++) {
        steps.push({
            phase: 'outer', activeLine: 6, coins, amount, dp: [...dp],
            activeA: a, activeC: -1, result: null,
            message: `Compute dp[${a}] — minimum coins needed to make amount ${a}.`,
        })

        for (let ci = 0; ci < coins.length; ci++) {
            const c = coins[ci]

            steps.push({
                phase: 'check_coin', activeLine: 8, coins, amount, dp: [...dp],
                activeA: a, activeC: ci, result: null,
                message: `Try coin ${c}: is ${c} ≤ ${a}? ${c <= a ? 'Yes.' : 'No, skip.'}`,
            })

            if (c <= a) {
                const prev = dp[a - c]
                const candidate = prev === INF ? INF : prev + 1
                const before = dp[a]

                if (candidate < before) {
                    dp[a] = candidate
                }

                steps.push({
                    phase: 'update', activeLine: 9, coins, amount, dp: [...dp],
                    activeA: a, activeC: ci, result: null,
                    improved: candidate < before,
                    message: `dp[${a}] = min(${before === INF ? '∞' : before}, dp[${a - c}]+1) = min(${before === INF ? '∞' : before}, ${prev === INF ? '∞' : prev}+1) = ${dp[a] === INF ? '∞' : dp[a]}.`,
                })
            }
        }
    }

    const result = dp[amount] === INF ? -1 : dp[amount]

    steps.push({
        phase: 'done', activeLine: 11, coins, amount, dp: [...dp],
        activeA: amount, activeC: -1, result,
        message: result === -1
            ? `dp[${amount}] is still ∞. Amount ${amount} cannot be made. Return -1.`
            : `dp[${amount}] = ${result}. Minimum ${result} coin(s) needed. Return ${result}.`,
    })

    return steps
}

const EXAMPLES = [
    { label: 'Classic', coins: [1, 5, 10, 25], amount: 30 },
    { label: 'LeetCode 1', coins: [1, 5, 6, 9], amount: 11 },
    { label: 'Impossible', coins: [2], amount: 3 },
    { label: 'Amount 0', coins: [1, 2, 5], amount: 0 },
    { label: 'Big coins', coins: [186, 419, 83, 408], amount: 6249 },
]

export default function CoinChangeVisualizer() {
    const [coinsInput, setCoinsInput] = useState('[1,5,6,9]')
    const [amountInput, setAmountInput] = useState('11')

    const { coins, amount, inputError } = useMemo(() => {
        try {
            const c = JSON.parse(coinsInput)
            const a = Number(amountInput)
            if (!Array.isArray(c) || !c.every(Number.isFinite)) throw new Error('coins must be array of numbers')
            if (!Number.isInteger(a) || a < 0) throw new Error('amount must be a non-negative integer')
            if (a > 50) throw new Error('Max amount 50 for clarity')
            if (c.length > 8) throw new Error('Max 8 coin types')
            return { coins: c, amount: a, inputError: '' }
        } catch (e) {
            return { coins: [1, 5, 6, 9], amount: 11, inputError: e.message || 'Invalid input' }
        }
    }, [coinsInput, amountInput])

    const steps = useMemo(() => generateSteps(coins, amount), [coins, amount])

    const {
        stepIndex, stepForward, stepBack, togglePlay,
        handleReset, isPlaying, speed, setSpeed, isDone,
    } = usePlaybackState(steps.length)

    const { showPatternOverlay, setShowPatternOverlay, activeLineDom, setActiveLineDom } = usePatternOverlay()

    const step = stepIndex >= 0 ? steps[stepIndex] : null

    const applyExample = useCallback((ex) => {
        setCoinsInput(JSON.stringify(ex.coins))
        setAmountInput(String(ex.amount))
        handleReset()
    }, [handleReset])

    const dp = step?.dp ?? Array(amount + 1).fill(INF).map((_, i) => (i === 0 ? 0 : INF))
    const activeA = step?.activeA ?? -1
    const activeC = step?.activeC ?? -1

    // Clamp display to at most 30 cells to avoid overflow
    const displayCount = Math.min(dp.length, 31)
    const displayDp = dp.slice(0, displayCount)

    return (
        <div className="cc-shell">
            <div className="cc-top">
                {/* ── DP table ── */}
                <section className="cc-panel main">
                    <header className="cc-head">
                        <span>Coin Change · Bottom-up DP</span>
                        {inputError && <span className="cc-error">{inputError}</span>}
                    </header>
                    <div className="cc-body">
                        <div className="cc-top-row">
                            <div className="cc-examples">
                                {EXAMPLES.map((ex) => (
                                    <button key={ex.label} className="cc-chip" onClick={() => applyExample(ex)}>
                                        {ex.label}
                                    </button>
                                ))}
                            </div>
                            <div className="cc-inputs">
                                <label className="cc-input-label">coins</label>
                                <input
                                    className="cc-input"
                                    value={coinsInput}
                                    onChange={(e) => { setCoinsInput(e.target.value); handleReset() }}
                                    placeholder="[1,5,6,9]"
                                />
                                <label className="cc-input-label">amount</label>
                                <input
                                    className="cc-input small"
                                    value={amountInput}
                                    onChange={(e) => { setAmountInput(e.target.value); handleReset() }}
                                    placeholder="11"
                                />
                            </div>
                        </div>

                        {/* Coin chips */}
                        <div className="cc-coins-row">
                            <span className="cc-coins-label">coins:</span>
                            {coins.map((c, ci) => (
                                <motion.span
                                    key={ci}
                                    className={`cc-coin${activeC === ci ? ' active' : ''}`}
                                    animate={{ scale: activeC === ci ? 1.2 : 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                >
                                    {c}
                                </motion.span>
                            ))}
                        </div>

                        {/* DP array */}
                        <div className="cc-dp-wrap">
                            <div className="cc-dp-array">
                                {displayDp.map((val, a) => {
                                    const isActive = activeA === a
                                    const isFinal = step?.phase === 'done' && a === amount
                                    const reachable = val !== INF
                                    return (
                                        <div key={a} className="cc-dp-col">
                                            <motion.div
                                                className={`cc-dp-cell${isActive ? ' active' : ''}${isFinal ? ' final' : ''}${!reachable ? ' inf' : ''}`}
                                                animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -6 : 0 }}
                                                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                                            >
                                                {val === INF ? '∞' : val}
                                            </motion.div>
                                            <span className="cc-dp-idx">{a}</span>
                                        </div>
                                    )
                                })}
                                {dp.length > displayCount && (
                                    <div className="cc-dp-col">
                                        <div className="cc-dp-cell trunc">…</div>
                                        <span className="cc-dp-idx">{dp.length - 1}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Result */}
                        <AnimatePresence>
                            {step?.phase === 'done' && (
                                <motion.div
                                    className={`cc-result${step.result === -1 ? ' fail' : ' ok'}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {step.result === -1
                                        ? `Cannot make amount ${amount} with given coins. Return -1.`
                                        : `Minimum coins to make ${amount}: ${step.result}`}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* ── Side: current cell detail ── */}
                <section className="cc-panel side">
                    <header className="cc-head"><span>Current State</span></header>
                    <div className="cc-body">
                        <div className="cc-state-row">
                            <span className="cc-state-label">a (amount)</span>
                            <span className="cc-state-val mono">{activeA >= 0 ? activeA : '—'}</span>
                        </div>
                        <div className="cc-state-row">
                            <span className="cc-state-label">coin c</span>
                            <span className="cc-state-val mono">{activeC >= 0 ? coins[activeC] : '—'}</span>
                        </div>
                        <div className="cc-state-row">
                            <span className="cc-state-label">dp[a]</span>
                            <span className="cc-state-val mono">{activeA >= 0 && dp[activeA] !== undefined ? (dp[activeA] === INF ? '∞' : dp[activeA]) : '—'}</span>
                        </div>
                        {activeC >= 0 && activeA >= 0 && coins[activeC] <= activeA && (
                            <div className="cc-state-row highlight">
                                <span className="cc-state-label">dp[a − c]</span>
                                <span className="cc-state-val mono">
                                    {dp[activeA - coins[activeC]] === INF ? '∞' : dp[activeA - coins[activeC]]}
                                </span>
                            </div>
                        )}
                        {step?.improved && (
                            <div className="cc-improved">Improved dp[{activeA}] ↓</div>
                        )}
                    </div>
                </section>
            </div>

            <CodeTracePanel step={step} codeLines={SOLUTION_CODE} onActiveLineDomChange={setActiveLineDom} />

            <div className={`cc-status${step?.result === -1 ? ' fail' : step?.result > 0 ? ' ok' : ''}`}>
                {step?.message ?? 'Press Play or Step to begin.'}
            </div>

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
                showPatternOverlay={showPatternOverlay}
                onShowPatternOverlayChange={setShowPatternOverlay}
                patternOverlayLabel="Show pattern overlay"
                showPatternOverlayToggle
            />
            {showPatternOverlay && step && <PatternOverlay step={step} activeLineDom={activeLineDom} />}
        </div>
    )
}
