import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import './LRUCacheVisualizer.css'

const DEFAULT_CAPACITY = 2
const DEFAULT_OPS = '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]'
const DEFAULT_ARGS = '[[2], [1,1], [2,2], [1], [3,3], [2], [4,4], [1], [3], [4]]'

const EXAMPLES = [
  {
    label: 'Cap 1 — Always Evicts (special)',
    capacity: 1,
    operations: '["LRUCache","put","get","put","get","put","get","put","get","put","get","put","get","put","get","put","get","put","get","put","get"]',
    arguments: '[[1],[1,10],[1],[2,20],[2],[3,30],[3],[4,40],[4],[5,50],[5],[6,60],[6],[7,70],[7],[8,80],[8],[9,90],[9],[10,100],[10]]',
    note: 'Cap=1 special case. Every new put evicts the previous entry. All gets hit right after their put.',
  },
  {
    label: 'Cap 3 — LeetCode Style',
    capacity: 3,
    operations: '["LRUCache","put","put","put","get","put","get","put","get","get","get","get","get"]',
    arguments: '[[3],[1,1],[2,2],[3,3],[1],[4,4],[2],[5,5],[1],[2],[3],[4],[5]]',
    note: 'Cap=3. Put 3 keys, then interleave gets and puts to observe evictions.',
  },
  {
    label: 'Cap 3 — Fill then Rolling Evictions',
    capacity: 3,
    operations: '["LRUCache","put","put","put","put","get","get","get","put","get","get","get","put","get","get","get","put","get","get","get","put","get","get","get","put","get","get","get","put","get","get","get","put","get","get","get"]',
    arguments: '[[3],[1,1],[2,2],[3,3],[4,4],[2],[3],[4],[5,5],[3],[4],[5],[6,6],[4],[5],[6],[7,7],[5],[6],[7],[8,8],[6],[7],[8],[9,9],[7],[8],[9],[10,10],[8],[9],[10],[11,11],[9],[10],[11]]',
    note: 'Cap=3, 36 ops. Fill 3, then each new put evicts oldest. Reads confirm which 3 keys are live after each eviction.',
  },
  {
    label: 'Cap 3 — Get Rescues from Eviction',
    capacity: 3,
    operations: '["LRUCache","put","put","put","get","get","put","get","get","get","put","get","get","get","put","get","get","get","put","get","get","get","put","get","get","get","put","get","get","get","put","get","get","get","put","get","get","get"]',
    arguments: '[[3],[1,1],[2,2],[3,3],[3],[2],[4,4],[3],[2],[1],[5,5],[4],[3],[2],[6,6],[5],[4],[3],[7,7],[6],[5],[4],[8,8],[7],[6],[5],[9,9],[8],[7],[6],[10,10],[9],[8],[7],[11,11],[10],[9],[8]]',
    note: 'Cap=3, 38 ops. Before each new put, the two newest keys are read (promoting to MRU), so only the oldest gets evicted.',
  },
  {
    label: 'Cap 3 — Only Updates, No Evictions',
    capacity: 3,
    operations: '["LRUCache","put","put","put","put","put","put","put","put","put","put","put","put","put","put","put","put","put","put","put","put","put","get","get","get"]',
    arguments: '[[3],[1,1],[2,2],[3,3],[1,10],[2,20],[3,30],[1,100],[2,200],[3,300],[1,1000],[2,2000],[3,3000],[1,50],[2,60],[3,70],[1,5],[2,6],[3,7],[1,9],[2,8],[3,0],[1],[2],[3]]',
    note: 'Cap=3. Only keys 1-3 used; repeated updates never cause eviction. Final: key1=9, key2=8, key3=0.',
  },
  {
    label: 'Cap 3 — All Misses Then Hits',
    capacity: 3,
    operations: '["LRUCache","get","get","get","get","get","get","get","get","get","get","put","put","put","get","get","get","get","get","get","get","get","get","get","put","put","put","get","get","get","get","get","get","get","get","get","get"]',
    arguments: '[[3],[1],[2],[3],[4],[5],[6],[7],[8],[9],[10],[1,100],[2,200],[3,300],[1],[2],[3],[4],[5],[6],[7],[8],[9],[10],[4,400],[5,500],[6,600],[1],[2],[3],[4],[5],[6],[7],[8],[9],[10]]',
    note: 'Cap=3, 36 ops. 10 misses on empty cache → fill 3 keys → all 3 hit, rest miss → fill 3 more, evicting oldest 3.',
  },
  {
    label: 'Cap 4 — Get Rescues Keys',
    capacity: 4,
    operations: '["LRUCache","put","put","put","put","get","get","put","get","get","get","get","put","get","get","get","get","put","get","get","get","get","put","get","get","get","get","put","get","get","get","get","put","get","get","get","get"]',
    arguments: '[[4],[1,10],[2,20],[3,30],[4,40],[4],[3],[5,50],[4],[3],[2],[1],[6,60],[5],[4],[3],[2],[7,70],[6],[5],[4],[3],[8,80],[7],[6],[5],[4],[9,90],[8],[7],[6],[5],[10,100],[9],[8],[7],[6]]',
    note: 'Cap=4, 37 ops. Two newest keys read before each new insert — they get promoted to MRU and survive; oldest is evicted.',
  },
  {
    label: 'Cap 4 — Thrash (Alternating Key Sets)',
    capacity: 4,
    operations: '["LRUCache","put","put","put","put","get","get","get","get","put","put","put","put","get","get","get","get","put","put","put","put","get","get","get","get","put","put","put","put","get","get","get","get","put","put","put","put","get","get","get","get","put","put","put","put","get","get","get","get"]',
    arguments: '[[4],[1,1],[2,2],[3,3],[4,4],[1],[2],[3],[4],[5,5],[6,6],[7,7],[8,8],[5],[6],[7],[8],[9,9],[10,10],[11,11],[12,12],[9],[10],[11],[12],[13,13],[14,14],[15,15],[16,16],[13],[14],[15],[16],[17,17],[18,18],[19,19],[20,20],[17],[18],[19],[20],[21,21],[22,22],[23,23],[24,24],[21],[22],[23],[24]]',
    note: 'Cap=4, 49 ops. Insert 4 unique keys per round, read all 4 (all hits), then replace with 4 new keys (4 evictions each round).',
  },
  {
    label: 'Cap 5 — Mixed Updates & Evictions',
    capacity: 5,
    operations: '["LRUCache","put","put","put","put","put","put","get","get","get","put","put","get","get","get","put","get","put","get","put","get","put","get","get","put","put","get","get","get","put","get","put","get","put","get","put","get","put","get","put","get","put","get","put","get","put","get","put","get","put","get"]',
    arguments: '[[5],[1,1],[2,2],[3,3],[4,4],[5,5],[1,10],[1],[2],[3],[6,6],[2,20],[6],[2],[3],[7,7],[7],[3,30],[3],[8,8],[8],[4,40],[4],[5],[9,9],[5,50],[9],[5],[4],[10,10],[10],[6,60],[6],[11,11],[11],[7,70],[7],[12,12],[12],[8,80],[8],[9,90],[9],[10,100],[10],[11,110],[11],[12,120],[12],[13,130],[13]]',
    note: 'Cap=5, 51 ops. Updates to existing keys (no eviction) mixed with inserts of new keys (eviction). Observe how updates move keys to MRU.',
  },
  {
    label: 'Cap 6 — Large Cache Stress',
    capacity: 6,
    operations: '["LRUCache","put","put","put","put","put","put","put","put","get","get","get","get","get","get","get","put","put","put","get","get","get","get","get","get","get","put","put","put","get","get","get","get","get","get","get","put","put","put","get","get","get","get","get","get","get","get","get","get","get","get"]',
    arguments: '[[6],[1,10],[2,20],[3,30],[4,40],[5,50],[6,60],[7,70],[8,80],[3],[4],[5],[6],[7],[8],[1],[9,90],[10,100],[11,110],[9],[10],[11],[7],[8],[1],[2],[12,120],[13,130],[14,140],[12],[13],[14],[9],[10],[11],[1],[15,150],[16,160],[17,170],[15],[16],[17],[12],[13],[14],[1],[2],[3],[4],[5],[6]]',
    note: 'Cap=6, 50 ops. Fill 8 keys (2 evicted), read survivors, keep adding while reading. Final gets show which 6 remain.',
  },
]

const SOLUTION_CODE = [
  { line: 1, text: 'class Node:' },
  { line: 2, text: '    def __init__(self, key=0, value=0):' },
  { line: 3, text: '        self.key = key; self.value = value' },
  { line: 4, text: '        self.prev = None; self.next = None' },
  { line: 5, text: '' },
  { line: 6, text: 'class LRUCache:' },
  { line: 7, text: '    def __init__(self, capacity: int):' },
  { line: 8, text: '        self.capacity = capacity' },
  { line: 9, text: '        self.cache = {}' },
  { line: 10, text: '        self.left = Node()   # LRU sentinel' },
  { line: 11, text: '        self.right = Node()  # MRU sentinel' },
  { line: 12, text: '        self.left.next = self.right; self.right.prev = self.left' },
  { line: 13, text: '' },
  { line: 14, text: '    def _remove(self, node):' },
  { line: 15, text: '        prev, nxt = node.prev, node.next' },
  { line: 16, text: '        prev.next = nxt; nxt.prev = prev' },
  { line: 17, text: '' },
  { line: 18, text: '    def _insert_mru(self, node):' },
  { line: 19, text: '        prev = self.right.prev; nxt = self.right' },
  { line: 20, text: '        prev.next = node; node.prev = prev' },
  { line: 21, text: '        node.next = nxt; nxt.prev = node' },
  { line: 22, text: '' },
  { line: 23, text: '    def get(self, key: int) -> int:' },
  { line: 24, text: '        if key not in self.cache: return -1' },
  { line: 25, text: '        node = self.cache[key]' },
  { line: 26, text: '        self._remove(node); self._insert_mru(node)' },
  { line: 27, text: '        return node.value' },
  { line: 28, text: '' },
  { line: 29, text: '    def put(self, key: int, value: int) -> None:' },
  { line: 30, text: '        if key in self.cache:' },
  { line: 31, text: '            self._remove(self.cache[key])' },
  { line: 32, text: '        self.cache[key] = Node(key, value)' },
  { line: 33, text: '        self._insert_mru(self.cache[key])' },
  { line: 34, text: '        if len(self.cache) > self.capacity:' },
  { line: 35, text: '            lru = self.left.next' },
  { line: 36, text: '            self._remove(lru)' },
  { line: 37, text: '            del self.cache[lru.key]' },
]

const PHASE_META = {
  init: { label: 'Init', color: 'blue' },
  'get-hit': { label: 'Get Hit', color: 'green' },
  'get-miss': { label: 'Get Miss', color: 'red' },
  'put-insert': { label: 'Put Insert', color: 'amber' },
  'put-update': { label: 'Put Update', color: 'violet' },
  'put-evict': { label: 'Put + Evict', color: 'orange' },
}

function parseJson(raw) {
  try {
    return { value: JSON.parse(raw) }
  } catch {
    return { error: 'Invalid JSON. Please use valid JSON arrays.' }
  }
}

function toNullableOutput(value) {
  return value === null ? 'null' : String(value)
}

function makeDescription({ phase, key, value, result, evictedKey }) {
  if (phase === 'init') return 'Initialize cache with empty hash map + doubly linked list sentinels.'
  if (phase === 'get-hit') return `get(${key}) → hit, value=${result}. Move key ${key} to MRU position.`
  if (phase === 'get-miss') return `get(${key}) → miss. key ${key} not in cache, return -1.`
  if (phase === 'put-update') return `put(${key}, ${value}) → key exists. Update value and move to MRU.`
  if (phase === 'put-evict') return `put(${key}, ${value}) → cache full! Insert key ${key} and evict LRU key ${evictedKey}.`
  return `put(${key}, ${value}) → new key. Insert at MRU end.`
}

function moveKeyToFront(order, key) {
  const idx = order.indexOf(key)
  if (idx !== -1) order.splice(idx, 1)
  order.unshift(key)
}

function snapshotEntries(order, store) {
  return order.map((key) => ({ key, value: store.get(key) }))
}

// Returns index of key in order array, or null
function getPrev(order, key) {
  const idx = order.indexOf(key)
  return idx > 0 ? order[idx - 1] : null  // null = left sentinel
}
function getNext(order, key) {
  const idx = order.indexOf(key)
  return idx < order.length - 1 ? order[idx + 1] : null  // null = right sentinel
}

function makeStep(base, overrides) {
  return { ...base, ...overrides }
}

function generateLRUSteps(initialCapacity, operations, args, detail = false) {
  const steps = []
  const outputs = []
  const store = new Map()
  const order = [] // MRU -> LRU (index 0 = MRU)
  let capacity = initialCapacity

  const snap = () => snapshotEntries(order, store)

  const push = (step) => steps.push(step)

  const base = (i, op, arg, phase, key, value, result, evictedKey) => ({
    index: i, op, arg, phase, key, value, result, evictedKey,
    capacity,
    entries: snap(),
    keysInMap: [...order],
    outputs: [...outputs],
    // detail-mode pointer highlights:
    highlightNode: null,   // key of node being operated on
    highlightPointers: null, // { prev: key|'L'|null, node: key, next: key|'R'|null }
    microLabel: null,
  })

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i]
    const arg = args[i]

    if (op === 'LRUCache') {
      capacity = Number(arg[0])
      store.clear()
      order.length = 0
      outputs.push(null)
      push({
        ...base(i, op, arg, 'init', null, null, null, null),
        activeLine: 8, relatedLines: [7, 8, 9, 10, 11, 12],
        description: 'Initialize LRUCache: capacity=' + capacity + '. Set up empty hash map and sentinel nodes left ↔ right.',
      })
      continue
    }

    if (op === 'get') {
      const key = Number(arg[0])

      if (store.has(key)) {
        const value = store.get(key)

        if (detail) {
          // Step 1: look up in map
          push({
            ...base(i, op, arg, 'get-hit', key, value, value, null),
            activeLine: 25, relatedLines: [23, 24, 25],
            highlightNode: key,
            highlightPointers: null,
            entries: snap(),
            description: `get(${key}): Look up key ${key} in cache → FOUND, node.value = ${value}.`,
            microLabel: 'Lookup',
          })
          // Step 2: find prev/next before removal
          const prevKey = getNext(order, key) // order is MRU→LRU, so visually "next" in list = higher index = LRU direction
          const nextKey = getPrev(order, key)
          push({
            ...base(i, op, arg, 'get-hit', key, value, value, null),
            activeLine: 15, relatedLines: [14, 15, 16],
            highlightNode: key,
            highlightPointers: { prev: nextKey ?? 'L', node: key, next: prevKey ?? 'R' },
            entries: snap(),
            description: `_remove(node): Read node.prev (key=${nextKey ?? 'LEFT'}) and node.next (key=${prevKey ?? 'RIGHT'}).`,
            microLabel: 'Read Pointers',
          })
          // Step 3: relink prev/next to skip node
          push({
            ...base(i, op, arg, 'get-hit', key, value, value, null),
            activeLine: 16, relatedLines: [14, 15, 16],
            highlightNode: key,
            highlightPointers: { prev: nextKey ?? 'L', node: key, next: prevKey ?? 'R' },
            entries: snap(),
            description: `_remove: Relink — prev.next = nxt, nxt.prev = prev. Node ${key} is unlinked from list.`,
            microLabel: 'Unlink Node',
          })
          // Actually remove and re-insert
          moveKeyToFront(order, key)
          // Step 4: find insert position (right before right sentinel = MRU end)
          const mruPrevKey = order.length > 1 ? order[1] : null
          push({
            ...base(i, op, arg, 'get-hit', key, value, value, null),
            activeLine: 19, relatedLines: [18, 19, 20, 21],
            highlightNode: key,
            highlightPointers: { prev: mruPrevKey ?? 'L', node: key, next: 'R' },
            entries: snap(),
            description: `_insert_mru: prev = right.prev (key=${mruPrevKey ?? 'LEFT'}), nxt = right sentinel.`,
            microLabel: 'Find MRU Slot',
          })
          // Step 5: wire new pointers
          push({
            ...base(i, op, arg, 'get-hit', key, value, value, null),
            activeLine: 21, relatedLines: [18, 19, 20, 21],
            highlightNode: key,
            highlightPointers: { prev: mruPrevKey ?? 'L', node: key, next: 'R' },
            entries: snap(),
            description: `_insert_mru: Wire node ${key} — prev.next=node, node.prev=prev, node.next=right, right.prev=node.`,
            microLabel: 'Wire Pointers',
          })
          // Step 6: return value
          outputs.push(value)
          push({
            ...base(i, op, arg, 'get-hit', key, value, value, null),
            activeLine: 27, relatedLines: [23, 27],
            highlightNode: key,
            highlightPointers: null,
            description: `get(${key}) → return ${value}. Key ${key} is now at MRU position.`,
            microLabel: 'Return Value',
          })
        } else {
          moveKeyToFront(order, key)
          outputs.push(value)
          push({
            ...base(i, op, arg, 'get-hit', key, value, value, null),
            activeLine: 26, relatedLines: [23, 24, 25, 26, 27],
            description: makeDescription({ phase: 'get-hit', key, result: value }),
          })
        }
      } else {
        if (detail) {
          outputs.push(-1)
          push({
            ...base(i, op, arg, 'get-miss', key, null, -1, null),
            activeLine: 24, relatedLines: [23, 24],
            highlightNode: key,
            highlightPointers: null,
            description: `get(${key}): key ${key} NOT in cache. Return -1. List unchanged.`,
            microLabel: 'Cache Miss',
          })
        } else {
          outputs.push(-1)
          push({
            ...base(i, op, arg, 'get-miss', key, null, -1, null),
            activeLine: 24, relatedLines: [23, 24],
            description: makeDescription({ phase: 'get-miss', key }),
          })
        }
      }
      continue
    }

    // put
    const key = Number(arg[0])
    const value = Number(arg[1])

    if (store.has(key)) {
      if (detail) {
        // Step 1: check map
        push({
          ...base(i, op, arg, 'put-update', key, value, null, null),
          activeLine: 30, relatedLines: [29, 30],
          highlightNode: key,
          entries: snap(),
          description: `put(${key}, ${value}): Key ${key} found in cache → will update value and move to MRU.`,
          microLabel: 'Key Exists',
        })
        // Step 2: read old node pointers
        const oldPrev = getNext(order, key)
        const oldNext = getPrev(order, key)
        push({
          ...base(i, op, arg, 'put-update', key, value, null, null),
          activeLine: 15, relatedLines: [14, 15, 16],
          highlightNode: key,
          highlightPointers: { prev: oldPrev ?? 'L', node: key, next: oldNext ?? 'R' },
          entries: snap(),
          description: `_remove: Read node.prev (key=${oldPrev ?? 'LEFT'}) and node.next (key=${oldNext ?? 'RIGHT'}).`,
          microLabel: 'Read Pointers',
        })
        // Step 3: unlink
        push({
          ...base(i, op, arg, 'put-update', key, value, null, null),
          activeLine: 16, relatedLines: [14, 15, 16],
          highlightNode: key,
          highlightPointers: { prev: oldPrev ?? 'L', node: key, next: oldNext ?? 'R' },
          entries: snap(),
          description: `_remove: Relink — prev.next = nxt, nxt.prev = prev. Node ${key} unlinked.`,
          microLabel: 'Unlink Node',
        })
        store.set(key, value)
        moveKeyToFront(order, key)
        // Step 4: update value + re-create node
        const mruPrev2 = order.length > 1 ? order[1] : null
        push({
          ...base(i, op, arg, 'put-update', key, value, null, null),
          activeLine: 32, relatedLines: [32, 33],
          highlightNode: key,
          highlightPointers: { prev: mruPrev2 ?? 'L', node: key, next: 'R' },
          entries: snap(),
          description: `cache[${key}] = Node(${key}, ${value}). New node created with updated value.`,
          microLabel: 'Update Node',
        })
        // Step 5: wire MRU
        push({
          ...base(i, op, arg, 'put-update', key, value, null, null),
          activeLine: 21, relatedLines: [18, 19, 20, 21],
          highlightNode: key,
          highlightPointers: { prev: mruPrev2 ?? 'L', node: key, next: 'R' },
          entries: snap(),
          description: `_insert_mru: Wire node ${key} at MRU end — prev.next=node, node.prev=prev, node.next=right, right.prev=node.`,
          microLabel: 'Wire MRU',
        })
        outputs.push(null)
        push({
          ...base(i, op, arg, 'put-update', key, value, null, null),
          activeLine: 33, relatedLines: [29, 32, 33],
          highlightNode: key,
          highlightPointers: null,
          description: `put(${key}, ${value}) complete. Key ${key} is now at MRU with new value ${value}.`,
          microLabel: 'Done',
        })
      } else {
        store.set(key, value)
        moveKeyToFront(order, key)
        outputs.push(null)
        push({
          ...base(i, op, arg, 'put-update', key, value, null, null),
          activeLine: 31, relatedLines: [29, 30, 31, 32, 33],
          description: makeDescription({ phase: 'put-update', key, value }),
        })
      }
      continue
    }

    // new key
    if (detail) {
      // Step 1: check map → not found
      push({
        ...base(i, op, arg, order.length >= capacity ? 'put-evict' : 'put-insert', key, value, null, null),
        activeLine: 30, relatedLines: [29, 30],
        highlightNode: null,
        entries: snap(),
        description: `put(${key}, ${value}): Key ${key} NOT in cache → insert new node.`,
        microLabel: 'New Key',
      })
      store.set(key, value)
      order.unshift(key)
      const mruPrev3 = order.length > 1 ? order[1] : null
      // Step 2: create node and add to map
      push({
        ...base(i, op, arg, order.length > capacity ? 'put-evict' : 'put-insert', key, value, null, null),
        activeLine: 32, relatedLines: [32],
        highlightNode: key,
        highlightPointers: null,
        entries: snap(),
        description: `cache[${key}] = Node(${key}, ${value}). Node created and added to hash map.`,
        microLabel: 'Create Node',
      })
      // Step 3: find MRU slot
      push({
        ...base(i, op, arg, order.length > capacity ? 'put-evict' : 'put-insert', key, value, null, null),
        activeLine: 19, relatedLines: [18, 19],
        highlightNode: key,
        highlightPointers: { prev: mruPrev3 ?? 'L', node: key, next: 'R' },
        entries: snap(),
        description: `_insert_mru: prev = right.prev (key=${mruPrev3 ?? 'LEFT'}), nxt = right sentinel.`,
        microLabel: 'Find MRU Slot',
      })
      // Step 4: wire pointers
      push({
        ...base(i, op, arg, order.length > capacity ? 'put-evict' : 'put-insert', key, value, null, null),
        activeLine: 21, relatedLines: [18, 19, 20, 21],
        highlightNode: key,
        highlightPointers: { prev: mruPrev3 ?? 'L', node: key, next: 'R' },
        entries: snap(),
        description: `_insert_mru: Wire — prev.next=node ${key}, node.prev=prev, node.next=right, right.prev=node.`,
        microLabel: 'Wire Pointers',
      })

      if (order.length > capacity) {
        // Step 5: check capacity
        push({
          ...base(i, op, arg, 'put-evict', key, value, null, null),
          activeLine: 34, relatedLines: [34],
          highlightNode: null,
          highlightPointers: null,
          entries: snap(),
          description: `len(cache)=${order.length} > capacity=${capacity}. Must evict LRU!`,
          microLabel: 'Check Capacity',
        })
        const lruKey = order[order.length - 1]
        const lruPrevKey = order[order.length - 2]
        // Step 6: identify LRU
        push({
          ...base(i, op, arg, 'put-evict', key, value, null, lruKey),
          activeLine: 35, relatedLines: [35],
          highlightNode: lruKey,
          highlightPointers: { prev: lruPrevKey ?? 'L', node: lruKey, next: 'R' },
          entries: snap(),
          description: `lru = left.next → key=${lruKey} is the least recently used node.`,
          microLabel: 'Identify LRU',
        })
        // Step 7: unlink LRU
        push({
          ...base(i, op, arg, 'put-evict', key, value, null, lruKey),
          activeLine: 36, relatedLines: [35, 36],
          highlightNode: lruKey,
          highlightPointers: { prev: lruPrevKey ?? 'L', node: lruKey, next: 'R' },
          entries: snap(),
          description: `_remove(lru): Relink — prev.next = right, right.prev = prev. Node ${lruKey} unlinked.`,
          microLabel: 'Unlink LRU',
        })
        order.pop()
        store.delete(lruKey)
        outputs.push(null)
        // Step 8: delete from map
        push({
          ...base(i, op, arg, 'put-evict', key, value, null, lruKey),
          activeLine: 37, relatedLines: [37],
          highlightNode: null,
          highlightPointers: null,
          entries: snap(),
          description: `del cache[${lruKey}]. Key ${lruKey} removed from hash map. Eviction complete.`,
          microLabel: 'Delete from Map',
        })
      } else {
        outputs.push(null)
        push({
          ...base(i, op, arg, 'put-insert', key, value, null, null),
          activeLine: 33, relatedLines: [32, 33],
          highlightNode: key,
          highlightPointers: null,
          entries: snap(),
          description: `put(${key}, ${value}) complete. Cache size=${order.length}/${capacity}. No eviction needed.`,
          microLabel: 'Done',
        })
      }
    } else {
      store.set(key, value)
      order.unshift(key)
      outputs.push(null)

      if (order.length > capacity) {
        const evictedKey = order.pop()
        store.delete(evictedKey)
        push({
          ...base(i, op, arg, 'put-evict', key, value, null, evictedKey),
          activeLine: 37, relatedLines: [29, 32, 33, 34, 35, 36, 37],
          description: makeDescription({ phase: 'put-evict', key, value, evictedKey }),
        })
      } else {
        push({
          ...base(i, op, arg, 'put-insert', key, value, null, null),
          activeLine: 33, relatedLines: [29, 32, 33],
          description: makeDescription({ phase: 'put-insert', key, value }),
        })
      }
    }
  }

  return steps
}

function validateInput(capacity, operations, args) {
  if (!Number.isInteger(capacity) || capacity <= 0 || capacity > 3000) {
    return 'Capacity must be an integer between 1 and 3000.'
  }
  if (!Array.isArray(operations) || !Array.isArray(args)) {
    return 'Operations and Arguments must both be arrays.'
  }
  if (operations.length !== args.length) {
    return 'Operations and Arguments length must match.'
  }
  if (operations.length === 0) {
    return 'Provide at least one operation.'
  }
  if (operations[0] !== 'LRUCache') {
    return 'First operation must be "LRUCache".'
  }
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i]
    const a = args[i]
    if (!Array.isArray(a)) return `Arguments at index ${i} must be an array.`
    if (op === 'LRUCache' && a.length !== 1) return 'LRUCache operation must have one argument: [capacity].'
    if (op === 'get' && a.length !== 1) return `get at index ${i} must be [key].`
    if (op === 'put' && a.length !== 2) return `put at index ${i} must be [key, value].`
    if (!['LRUCache', 'get', 'put'].includes(op)) return `Unsupported operation "${op}" at index ${i}.`
  }
  return null
}

function VariablesPanel({ step }) {
  const vars = step
    ? [
      { name: 'capacity', value: step.capacity, type: 'int', desc: 'max cache size' },
      { name: 'len(cache)', value: step.entries.length, type: 'int', desc: 'current entries' },
      { name: 'op', value: step.op, type: 'str', desc: 'current operation' },
      { name: 'key', value: step.key ?? '—', type: step.key != null ? 'int' : 'none', desc: 'operation key' },
      { name: 'value', value: step.value ?? '—', type: step.value != null ? 'int' : 'none', desc: 'operation value' },
      { name: 'result', value: step.result != null ? step.result : step.result === null ? 'None' : '—', type: step.result != null ? 'int' : 'none', desc: 'return value' },
      { name: 'evictedKey', value: step.evictedKey ?? '—', type: step.evictedKey != null ? 'int' : 'none', desc: 'LRU key evicted' },
      {
        name: 'left.next (LRU)',
        value: step.entries.length > 0 ? `key=${step.entries[step.entries.length - 1].key}` : 'right',
        type: 'node',
        desc: 'least-recently-used'
      },
      {
        name: 'right.prev (MRU)',
        value: step.entries.length > 0 ? `key=${step.entries[0].key}` : 'left',
        type: 'node',
        desc: 'most-recently-used'
      },
    ]
    : []

  return (
    <div className="lru-card">
      <div className="lru-card-head">
        <div className="lru-section-label">Variables</div>
        <div className="lru-subtitle">Live algorithm state</div>
      </div>
      {vars.length === 0 ? (
        <div className="lru-empty">Press Play or Next to see variables.</div>
      ) : (
        <div className="lru-vars-grid">
          {vars.map((v) => (
            <div key={v.name} className="lru-var-row">
              <div className="lru-var-left">
                <span className="lru-var-name mono">{v.name}</span>
                <span className={`lru-var-type lru-var-type-${v.type}`}>{v.type}</span>
              </div>
              <div className="lru-var-right">
                <motion.span
                  key={String(v.value)}
                  className="lru-var-value mono"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {String(v.value)}
                </motion.span>
                <span className="lru-var-desc">{v.desc}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CodePanel({ step }) {
  const codeRef = useRef(null)

  useEffect(() => {
    if (!step?.activeLine || !codeRef.current) return
    codeRef.current.querySelector(`[data-line="${step.activeLine}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [step])

  return (
    <div className="lru-code-card">
      <div className="lru-card-head">
        <div className="lru-section-label">Python O(1) Design</div>
        <div className="lru-subtitle">Hash map + doubly linked list</div>
      </div>
      <div className="lru-code-scroll" ref={codeRef}>
        {SOLUTION_CODE.map(({ line, text }) => {
          const isActive = step?.activeLine === line
          const isRelated = step?.relatedLines?.includes(line)
          return (
            <motion.div
              key={line}
              data-line={line}
              className={`lru-code-row ${isActive ? 'active' : ''} ${isRelated ? 'related' : ''}`}
              animate={{ x: isActive ? 6 : 0, opacity: isActive || isRelated || !step ? 1 : 0.55 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            >
              <span className="lru-code-line mono">{line}</span>
              <code className="lru-code-text">{text || ' '}</code>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function CacheOrder({ step }) {
  const entries = step?.entries ?? []
  const hp = step?.highlightPointers ?? null
  const highlightNode = step?.highlightNode ?? null

  // Build sets for quick lookup
  const activePrevKey = hp ? hp.prev : null
  const activeNodeKey = hp ? hp.node : null
  const activeNextKey = hp ? hp.next : null

  return (
    <div className="lru-card">
      <div className="lru-card-head">
        <div className="lru-section-label">Cache Order</div>
        <div className="lru-subtitle">MRU on left · LRU on right</div>
      </div>
      <div className="lru-order-wrap">
        {/* Left sentinel */}
        <div className={`lru-sentinel lru-sentinel-left${activePrevKey === 'L' || activeNextKey === 'L' ? ' pointer-active' : ''}`}>L</div>
        <span className={`lru-arrow${activeNextKey === 'L' || activePrevKey === 'L' ? ' arrow-active' : ''}`}>↔</span>

        {entries.length === 0 ? (
          <div className="lru-empty">Cache is empty</div>
        ) : (
          entries.map((entry, idx) => {
            const isHighlightNode = entry.key === activeNodeKey
            const isPrevPtr = entry.key === activePrevKey
            const isNextPtr = entry.key === activeNextKey
            const isFocused = entry.key === highlightNode && !hp
            const classes = [
              'lru-order-node',
              idx === 0 ? 'mru' : '',
              idx === entries.length - 1 ? 'lru' : '',
              isHighlightNode ? 'node-active' : '',
              isPrevPtr ? 'ptr-prev' : '',
              isNextPtr ? 'ptr-next' : '',
              isFocused ? 'node-focused' : '',
            ].filter(Boolean).join(' ')

            // Arrow between nodes
            const showArrow = idx < entries.length - 1
            const arrowToNext = entry.key === activePrevKey && entries[idx + 1]?.key === activeNodeKey
            const arrowFromNext = entry.key === activeNodeKey && entries[idx + 1]?.key === activeNextKey

            return (
              <div key={entry.key} className="lru-order-node-wrap">
                <motion.div
                  className={classes}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {isPrevPtr && <div className="ptr-label prev-label">prev</div>}
                  {isNextPtr && <div className="ptr-label next-label">next</div>}
                  {isHighlightNode && <div className="ptr-label active-label">active</div>}
                  <div className="lru-order-key mono">{entry.key}</div>
                  <div className="lru-order-val mono">{entry.value}</div>
                </motion.div>
                {showArrow && (
                  <span className={`lru-arrow${arrowToNext || arrowFromNext ? ' arrow-active' : ''}`}>↔</span>
                )}
              </div>
            )
          })
        )}

        {/* Right sentinel */}
        <span className={`lru-arrow${activePrevKey === 'R' || activeNextKey === 'R' ? ' arrow-active' : ''}`}>↔</span>
        <div className={`lru-sentinel lru-sentinel-right${activePrevKey === 'R' || activeNextKey === 'R' ? ' pointer-active' : ''}`}>R</div>
      </div>
      <div className="lru-order-legend">
        <span className="lru-badge mru">MRU</span>
        <span className="lru-badge lru">LRU</span>
        {hp && (
          <>
            <span className="lru-badge ptr-prev-badge">prev ptr</span>
            <span className="lru-badge node-active-badge">active node</span>
            <span className="lru-badge ptr-next-badge">next ptr</span>
          </>
        )}
      </div>
    </div>
  )
}

function MapTable({ step }) {
  const entries = step?.entries ?? []
  return (
    <div className="lru-card">
      <div className="lru-card-head">
        <div className="lru-section-label">Hash Map View</div>
        <div className="lru-subtitle">O(1) key -&gt; node lookup</div>
      </div>
      <div className="lru-map-grid">
        {entries.length === 0 ? (
          <div className="lru-empty">No keys</div>
        ) : (
          entries.map((entry) => (
            <div key={entry.key} className="lru-map-item">
              <span className="lru-map-key mono">{entry.key}</span>
              <span className="lru-map-sep">:</span>
              <span className="lru-map-val mono">{entry.value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function OutputPanel({ step }) {
  const outputs = step?.outputs ?? []
  return (
    <div className="lru-card">
      <div className="lru-card-head">
        <div className="lru-section-label">Output Stream</div>
        <div className="lru-subtitle">LeetCode-style return list</div>
      </div>
      <div className="lru-output mono">
        [
        {outputs.map((value, idx) => (
          <span key={`${idx}-${value}`} className="lru-output-item">
            {toNullableOutput(value)}
            {idx < outputs.length - 1 ? ', ' : ''}
          </span>
        ))}
        ]
      </div>
    </div>
  )
}

export default function LRUCacheVisualizer() {
  const [capacityInput, setCapacityInput] = useState(String(DEFAULT_CAPACITY))
  const [opsInput, setOpsInput] = useState(DEFAULT_OPS)
  const [argsInput, setArgsInput] = useState(DEFAULT_ARGS)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY)
  const [operations, setOperations] = useState(() => JSON.parse(DEFAULT_OPS))
  const [argumentsList, setArgumentsList] = useState(() => JSON.parse(DEFAULT_ARGS))
  const [steps, setSteps] = useState(() => generateLRUSteps(DEFAULT_CAPACITY, JSON.parse(DEFAULT_OPS), JSON.parse(DEFAULT_ARGS), false))

  const [stepIndex, setStepIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(560)
  const [detailMode, setDetailMode] = useState(false)
  const intervalRef = useRef(null)

  const parsedCapacity = Number(capacityInput)
  const parsedOps = useMemo(() => parseJson(opsInput), [opsInput])
  const parsedArgs = useMemo(() => parseJson(argsInput), [argsInput])

  const structuralError = useMemo(() => {
    if (parsedOps.error || parsedArgs.error) return null
    if (!parsedOps.value || !parsedArgs.value) return null
    return validateInput(parsedCapacity, parsedOps.value, parsedArgs.value)
  }, [parsedOps, parsedArgs, parsedCapacity])

  const inputError = attemptedSubmit
    ? (parsedOps.error || parsedArgs.error || structuralError)
    : null

  const currentStep = stepIndex >= 0 ? steps[stepIndex] : null
  const phaseMeta = currentStep ? PHASE_META[currentStep.phase] : null
  const progress = steps.length > 0 ? ((stepIndex + 1) / steps.length) * 100 : 0
  const isDone = stepIndex === steps.length - 1

  const applyExample = useCallback((example) => {
    setCapacityInput(String(example.capacity))
    setOpsInput(example.operations)
    setArgsInput(example.arguments)

    const parsedO = JSON.parse(example.operations)
    const parsedA = JSON.parse(example.arguments)

    setCapacity(example.capacity)
    setOperations(parsedO)
    setArgumentsList(parsedA)
    setSteps(generateLRUSteps(example.capacity, parsedO, parsedA, detailMode))
    setStepIndex(-1)
    setIsPlaying(false)
    setAttemptedSubmit(false)
  }, [detailMode])

  const handleVisualize = useCallback(() => {
    setAttemptedSubmit(true)
    if (parsedOps.error || parsedArgs.error || structuralError) return
    setCapacity(parsedCapacity)
    setOperations(parsedOps.value)
    setArgumentsList(parsedArgs.value)
    setSteps(generateLRUSteps(parsedCapacity, parsedOps.value, parsedArgs.value, detailMode))
    setStepIndex(-1)
    setIsPlaying(false)
  }, [parsedCapacity, parsedOps, parsedArgs, structuralError, detailMode])

  const stepForward = useCallback(() => {
    setStepIndex((cur) => {
      if (cur >= steps.length - 1) {
        setIsPlaying(false)
        return cur
      }
      return cur + 1
    })
  }, [steps.length])

  const stepBack = () => setStepIndex((cur) => Math.max(-1, cur - 1))
  const handleReset = () => {
    setStepIndex(-1)
    setIsPlaying(false)
  }

  const togglePlay = () => {
    if (stepIndex >= steps.length - 1) setStepIndex(-1)
    setIsPlaying((p) => !p)
  }

  useEffect(() => {
    clearInterval(intervalRef.current)
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setStepIndex((cur) => {
          if (cur >= steps.length - 1) {
            setIsPlaying(false)
            return cur
          }
          return cur + 1
        })
      }, speed)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, speed, steps.length])

  const activeOpIndex = currentStep?.index ?? -1

  return (
    <div className="lru">
      <div className="lru-card lru-input-card">
        <div className="lru-top-row">
          <div>
            <div className="lru-section-label">Problem Link</div>
            <a className="lru-link" href="https://leetcode.com/problems/lru-cache/" target="_blank" rel="noreferrer">
              https://leetcode.com/problems/lru-cache/
            </a>
          </div>
          <div className="lru-pill mono">Calls &lt;= 2 * 10^5</div>
        </div>

        <div className="lru-input-row">
          <div className="lru-field lru-field-sm">
            <label className="lru-label">Capacity</label>
            <input
              className={`lru-input ${attemptedSubmit && !Number.isInteger(parsedCapacity) ? 'has-error' : ''}`}
              value={capacityInput}
              onChange={(e) => {
                setCapacityInput(e.target.value.replace(/[^0-9]/g, ''))
                if (attemptedSubmit) setAttemptedSubmit(false)
              }}
              inputMode="numeric"
            />
          </div>

          <div className="lru-field">
            <label className="lru-label">Operations (JSON Array)</label>
            <textarea
              className={`lru-input lru-textarea mono ${attemptedSubmit && parsedOps.error ? 'has-error' : ''}`}
              value={opsInput}
              onChange={(e) => {
                setOpsInput(e.target.value)
                if (attemptedSubmit) setAttemptedSubmit(false)
              }}
              rows={2}
            />
          </div>

          <div className="lru-field">
            <label className="lru-label">Arguments (JSON Array of Arrays)</label>
            <textarea
              className={`lru-input lru-textarea mono ${attemptedSubmit && parsedArgs.error ? 'has-error' : ''}`}
              value={argsInput}
              onChange={(e) => {
                setArgsInput(e.target.value)
                if (attemptedSubmit) setAttemptedSubmit(false)
              }}
              rows={2}
            />
          </div>

          <button className="lru-btn lru-btn-primary" onClick={handleVisualize}>Visualize</button>
        </div>

        <div className="lru-support-row">
          <p className={`lru-hint ${inputError ? 'error' : ''}`}>
            {inputError || 'Use hash map + doubly linked list to keep get/put in O(1) average time.'}
          </p>
          <div className="lru-meta-row">
            <span className="lru-pill mono">capacity {capacity}</span>
            <span className="lru-pill mono">ops {operations.length}</span>
            <span className="lru-pill mono">args {argumentsList.length}</span>
          </div>
        </div>

        <div className="lru-examples">
          {EXAMPLES.map((ex) => (
            <button key={ex.label} type="button" className="lru-example" onClick={() => applyExample(ex)}>
              <span className="lru-example-label">{ex.label}</span>
              <span className="lru-example-note">{ex.note}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="lru-progress-card">
        <div className="lru-progress-track">
          <motion.div className="lru-progress-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
        </div>
        <div className="lru-progress-row">
          <span className="lru-step-counter">
            {stepIndex < 0 ? 'Not started' : `Step ${stepIndex + 1} / ${steps.length} (op index ${activeOpIndex})`}
          </span>
          {currentStep?.microLabel && <span className="lru-micro-label">{currentStep.microLabel}</span>}
          {phaseMeta && <span className={`lru-phase phase-${phaseMeta.color}`}>{phaseMeta.label}</span>}
        </div>
      </div>

      <div className="lru-layout">
        <div className="lru-main">
          <div className="lru-card">
            <div className="lru-card-head">
              <div className="lru-section-label">Operation Timeline</div>
              <div className="lru-subtitle">Click any operation to jump</div>
            </div>
            <div className="lru-timeline mono">
              {operations.map((op, idx) => (
                <button
                  key={`${op}-${idx}`}
                  type="button"
                  className={`lru-op-chip ${idx === activeOpIndex ? 'active' : ''}`}
                  onClick={() => {
                    // jump to last step with this op index
                    const target = steps.map((s, i) => s.index === idx ? i : -1).filter(x => x >= 0)
                    if (target.length > 0) setStepIndex(target[target.length - 1])
                    else setStepIndex(idx)
                  }}
                >
                  <span>{idx}</span>
                  <span>{op}</span>
                </button>
              ))}
            </div>
            <p className="lru-step-desc mono">{currentStep?.description || 'Press Play or Next to start simulation.'}</p>
          </div>

          <VariablesPanel step={currentStep} />
          <CacheOrder step={currentStep} />
          <MapTable step={currentStep} />
          <OutputPanel step={currentStep} />
        </div>

        <CodePanel step={currentStep} />
      </div>

      <div className="lru-controls">
        <div className="lru-controls-left">
          <button className="lru-btn lru-btn-ghost" onClick={handleReset} disabled={stepIndex < 0}>Reset</button>
          <button className="lru-btn lru-btn-ghost" onClick={stepBack} disabled={stepIndex < 0}>Prev</button>
          <button className="lru-btn lru-btn-play" onClick={togglePlay}>{isPlaying ? 'Pause' : isDone ? 'Replay' : 'Play'}</button>
          <button className="lru-btn lru-btn-ghost" onClick={stepForward} disabled={isDone}>Next</button>
        </div>

        <button
          className={`lru-btn lru-btn-detail${detailMode ? ' active' : ''}`}
          onClick={() => {
            const next = !detailMode
            setDetailMode(next)
            setSteps(generateLRUSteps(capacity, operations, argumentsList, next))
            setStepIndex(-1)
            setIsPlaying(false)
          }}
          title="Toggle pointer-level micro-step animation"
        >
          {detailMode ? '⚙ Detail ON' : '⚙ Detail OFF'}
        </button>

        <div className="lru-speed">
          <span className="lru-label">Speed</span>
          <input
            type="range"
            min={80}
            max={1400}
            step={60}
            value={1480 - speed}
            onChange={(e) => setSpeed(1480 - Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  )
}
