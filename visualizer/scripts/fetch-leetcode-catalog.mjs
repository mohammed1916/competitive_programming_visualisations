import fs from 'node:fs/promises'
import path from 'node:path'

const API_URL = 'https://leetcode.com/api/problems/algorithms/'

const TAG_RULES = [
  { tag: 'Dynamic Programming', patterns: [/dynamic-programming|dp|palindrome|subsequence|knapsack|partition|edit-distance|coin-change|longest/i] },
  { tag: 'Graph', patterns: [/graph|course|topological|network|path|tree|island|union-find|mst|dijkstra|bfs|dfs/i] },
  { tag: 'Tree', patterns: [/tree|binary-tree|bst|trie|n-ary/i] },
  { tag: 'String', patterns: [/string|substring|atoi|palindrome|anagram|word|pattern|regex|roman|zigzag/i] },
  { tag: 'Array', patterns: [/array|matrix|subarray|prefix|sum|rotate|merge|interval/i] },
  { tag: 'Design', patterns: [/design|cache|iterator|stack|queue|logger|browser|calendar|stream/i] },
  { tag: 'Greedy', patterns: [/greedy|max|min|jump|gas-station|assign|schedule|profit/i] },
  { tag: 'Backtracking', patterns: [/backtracking|combination|permutation|subset|n-queens|sudoku/i] },
  { tag: 'Math', patterns: [/math|number|integer|prime|pow|sqrt|gcd|fraction|bitwise/i] },
  { tag: 'Two Pointers', patterns: [/two-sum|two-pointers|container|trap|sliding-window|window/i] },
  { tag: 'Linked List', patterns: [/linked-list|lru|reverse-list|cycle|merge-lists/i] },
  { tag: 'Heap', patterns: [/heap|priority-queue|kth|median|top-k/i] },
  { tag: 'Binary Search', patterns: [/binary-search|search|sorted|lower-bound|upper-bound/i] },
  { tag: 'Bit Manipulation', patterns: [/bit|xor|and|or|parity|hamming|mask/i] },
]

function difficultyLabel(level) {
  if (level === 1) return 'Easy'
  if (level === 2) return 'Medium'
  if (level === 3) return 'Hard'
  return 'Unknown'
}

function inferTags(title, slug) {
  const haystack = `${title} ${slug}`
  const tags = TAG_RULES.filter((rule) => rule.patterns.some((pattern) => pattern.test(haystack))).map((rule) => rule.tag)
  if (tags.length === 0) tags.push('General')
  return tags.slice(0, 4)
}

async function main() {
  const outputDir = path.resolve(process.cwd(), 'public/data')
  await fs.mkdir(outputDir, { recursive: true })

  const response = await fetch(API_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch catalog: ${response.status} ${response.statusText}`)
  }

  const payload = await response.json()
  const pairs = Array.isArray(payload.stat_status_pairs) ? payload.stat_status_pairs : []

  const problems = pairs
    .map((entry) => {
      const stat = entry.stat || {}
      const frontendId = String(stat.frontend_question_id || '')
      const title = stat.question__title || ''
      const slug = stat.question__title_slug || ''
      const difficulty = difficultyLabel(entry.difficulty?.level)

      if (!frontendId || !title || !slug) return null

      return {
        id: `lc-${frontendId}`,
        number: frontendId,
        title,
        slug,
        difficulty,
        paidOnly: Boolean(entry.paid_only),
        tags: inferTags(title, slug),
      }
    })
    .filter(Boolean)
    .sort((a, b) => Number(a.number) - Number(b.number))

  const outputPath = path.resolve(outputDir, 'leetcodeCatalog.json')
  await fs.writeFile(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), count: problems.length, problems }, null, 2)}\n`)

  console.log(`Saved ${problems.length} problems to ${outputPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
