import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const inputPath = process.argv[2]
const outputPath = process.argv[3]

if (!inputPath) {
  console.error('Usage: node scripts/convert-to-tsv.mjs <input.txt> [output.tsv]')
  process.exit(1)
}

const text = readFileSync(resolve(inputPath), 'utf8')

// Split into blocks separated by blank lines
const blocks = text.split(/\r?\n\s*\r?\n/).map(b => b.trim()).filter(Boolean)

const rows = []
for (const block of blocks) {
  const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) continue          // skip if no definition
  const front = lines[0]
  const back = lines.slice(1).join(' ')   // join extra lines into one back
  rows.push(`${front}\t${back}`)
}

const out = rows.join('\n')
const dest = outputPath ?? inputPath.replace(/\.[^.]+$/, '') + '_converted.tsv'
writeFileSync(resolve(dest), out, 'utf8')
console.log(`Converted ${rows.length} cards → ${dest}`)
