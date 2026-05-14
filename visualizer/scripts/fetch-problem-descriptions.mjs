/**
 * Fetches problem descriptions from LeetCode's GraphQL API for ALL
 * free (non-paid) problems in the catalog and saves them to
 * public/data/problemDescriptions.json
 *
 * Usage: node scripts/fetch-problem-descriptions.mjs
 * Supports resuming — already-cached slugs are skipped.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

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

    // Load existing output to allow resuming interrupted runs
    let existing = {}
    try {
        const raw = await fs.readFile(outputPath, 'utf-8')
        existing = JSON.parse(raw)
    } catch {
        // fresh start
    }

    // All free (non-paid) problems from catalog, sorted by number
    const toFetch = catalog.problems
        .filter((p) => !p.paidOnly && !existing[p.slug])
        .sort((a, b) => Number(a.number) - Number(b.number))

    const totalFree = catalog.problems.filter((p) => !p.paidOnly).length
    console.log(`Fetching ${toFetch.length} problems (${Object.keys(existing).length}/${totalFree} free problems already cached)…`)

    let fetched = 0
    for (const problem of toFetch) {
        const { number: num, slug } = problem
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
