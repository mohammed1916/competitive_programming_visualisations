/**
 * Fetches problem descriptions from LeetCode's GraphQL API for all
 * implemented problems and saves them to public/data/problemDescriptions.json
 *
 * Usage: node scripts/fetch-problem-descriptions.mjs
 */

import fs from 'node:fs/promises'
import path from 'node:path'

// All problem numbers that have an implemented visualizer
const IMPLEMENTED_NUMBERS = new Set([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 15, 17, 19, 20, 21, 22, 23, 25, 26, 30, 31,
    33, 36, 37, 39, 41, 42, 44, 45, 46, 48, 49, 51, 53, 54, 55, 56, 57, 58, 62,
    66, 68, 70, 72, 73, 74, 75, 76, 78, 79, 84, 85, 88, 91, 97, 98, 102, 104,
    105, 110, 114, 115, 118, 121, 123, 124, 125, 127, 128, 131, 132, 133, 134,
    135, 136, 138, 139, 141, 143, 146, 148, 149, 150, 152, 153, 155, 160, 162,
    164, 167, 169, 174, 188, 189, 190, 191, 198, 199, 200, 202, 206, 207, 208,
    209, 210, 212, 213, 215, 217, 218, 224, 226, 230, 234, 235, 236, 238, 239,
    242, 268, 271, 283, 287, 295, 297, 300, 312, 322, 329, 338, 344, 347, 381,
    394, 416, 424, 435, 438, 460, 502, 543, 560, 567, 572, 647, 684, 704, 739,
    994, 1143,
])

const GRAPHQL_URL = 'https://leetcode.com/graphql/'
const QUERY = `
  query questionContent($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      content
      exampleTestcases
      metaData
    }
  }
`

async function fetchDescription(slug) {
    const res = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Referer': 'https://leetcode.com',
            'User-Agent': 'Mozilla/5.0',
        },
        body: JSON.stringify({ query: QUERY, variables: { titleSlug: slug } }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${slug}`)
    const json = await res.json()
    return json?.data?.question ?? null
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
    const catalogPath = path.resolve(process.cwd(), 'public/data/leetcodeCatalog.json')
    const outputPath = path.resolve(process.cwd(), 'public/data/problemDescriptions.json')

    const catalogRaw = await fs.readFile(catalogPath, 'utf-8')
    const catalog = JSON.parse(catalogRaw)

    // Build number -> slug map from catalog
    const slugByNumber = new Map()
    for (const p of catalog.problems) {
        slugByNumber.set(Number(p.number), p.slug)
    }

    // Load existing output to allow resuming interrupted runs
    let existing = {}
    try {
        const raw = await fs.readFile(outputPath, 'utf-8')
        existing = JSON.parse(raw)
    } catch {
        // fresh start
    }

    const toFetch = [...IMPLEMENTED_NUMBERS]
        .sort((a, b) => a - b)
        .filter((num) => {
            const slug = slugByNumber.get(num)
            return slug && !existing[slug]
        })

    console.log(`Fetching ${toFetch.length} problems (${Object.keys(existing).length} already cached)…`)

    let fetched = 0
    for (const num of toFetch) {
        const slug = slugByNumber.get(num)
        if (!slug) {
            console.warn(`  [SKIP] No slug found for problem #${num}`)
            continue
        }
        try {
            const data = await fetchDescription(slug)
            if (data) {
                existing[slug] = {
                    content: data.content ?? '',
                    exampleTestcases: data.exampleTestcases ?? '',
                }
                fetched++
                console.log(`  [OK] #${num} ${slug}`)
            } else {
                console.warn(`  [EMPTY] #${num} ${slug}`)
            }
        } catch (err) {
            console.error(`  [ERROR] #${num} ${slug}: ${err.message}`)
        }

        // Polite delay to avoid rate limiting
        await sleep(400)

        // Write checkpoint every 20 problems
        if (fetched % 20 === 0) {
            await fs.writeFile(outputPath, JSON.stringify(existing, null, 2) + '\n')
            console.log(`  [SAVED] checkpoint at ${fetched} fetched`)
        }
    }

    await fs.writeFile(outputPath, JSON.stringify(existing, null, 2) + '\n')
    console.log(`\nDone. ${fetched} new descriptions saved to ${outputPath}`)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
