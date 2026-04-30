const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface Question {
  id: string
  sentence_with_blank: string
  answer: string
  hint_ja?: string
}

const BATCH_SIZE = 50

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.content?.[0]?.text?.trim() ?? ''
}

async function categorizeBatch(batch: Question[]): Promise<{ id: string; category: string }[]> {
  const total = batch.length
  const targetMin = 4
  const targetMax = 12

  const list = batch
    .map(q => `ID: ${q.id}\nSentence: ${q.sentence_with_blank}\nAnswer: "${q.answer}"`)
    .join('\n\n')

  const prompt = `You are grouping ${total} ESL grammar questions into balanced study categories for Japanese students (Eiken levels 5–3).

GROUPING RULES — follow these strictly:
1. Target ${targetMin}–${targetMax} questions per category. Never create a category with only 1–2 questions.
2. Use broad category names. Do NOT add sub-type parentheticals like "(whose)" or "(whom)" or "(Type 1)".
   - ✗ "Relative Clauses (whose)", "Conditionals (Zero)", "Questions (Wh-)"
   - ✓ "Relative Clauses", "Conditionals", "Wh- Questions"
3. If similar questions could form a tiny group, fold them into the nearest broader category instead.
4. Use consistent, well-known names:
   "Present Simple", "Present Continuous", "Past Simple", "Past Continuous",
   "Present Perfect", "Past Perfect", "Future Forms", "Modal Verbs",
   "Passive Voice", "Conditionals", "Comparatives and Superlatives",
   "Articles", "Prepositions", "Gerunds and Infinitives", "Question Tags",
   "Relative Clauses", "Reported Speech", "Conjunctions",
   "Possessive Adjectives", "Plural Nouns", "Adjectives and Adverbs",
   "There is / There are", "To Be", "Wh- Questions", "Imperatives", etc.

Return ONLY a JSON array with exactly ${total} entries, no extra text:
[{"id":"<id>","category":"<category>"},...]

Questions:
${list}`

  const text = await callClaude(prompt)
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error(`No JSON array in response. Raw: ${text.slice(0, 200)}`)
  return JSON.parse(match[0])
}

async function consolidateSmallCategories(
  categories: { id: string; category: string }[],
  minSize: number,
): Promise<{ id: string; category: string }[]> {
  // Count entries per category
  const counts = new Map<string, number>()
  for (const c of categories) counts.set(c.category, (counts.get(c.category) ?? 0) + 1)

  const smallCats = [...counts.entries()].filter(([, n]) => n < minSize).map(([name]) => name)
  if (smallCats.length === 0) return categories

  const largeCats = [...counts.entries()].filter(([, n]) => n >= minSize).map(([name]) => name)
  if (largeCats.length === 0) return categories

  // Build the list of questions that need reassigning
  const toReassign = categories.filter(c => smallCats.includes(c.category))

  const prompt = `You are merging small grammar categories into broader ones.

Existing categories with enough questions (keep these names exactly):
${largeCats.map(c => `- ${c}`).join('\n')}

For each item below, pick the BEST matching category from the list above.
Return ONLY a JSON array, no extra text:
[{"id":"<id>","category":"<one of the categories above>"},...]

Items to reassign:
${toReassign.map(c => `ID: ${c.id}  current category: "${c.category}"`).join('\n')}`

  const text = await callClaude(prompt)
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) {
    console.warn('Consolidation parse failed, returning original')
    return categories
  }

  const reassigned: { id: string; category: string }[] = JSON.parse(match[0])
  const reassignMap = new Map(reassigned.map(r => [r.id, r.category]))

  return categories.map(c =>
    reassignMap.has(c.id) ? { ...c, category: reassignMap.get(c.id)! } : c
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { questions }: { questions: Question[] } = await req.json()
    if (!questions?.length) return jsonResponse({ categories: [] })

    // Phase 1: categorize in batches of BATCH_SIZE
    const allCategories: { id: string; category: string }[] = []
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE)
      try {
        const result = await categorizeBatch(batch)
        allCategories.push(...result)
      } catch (e) {
        console.error(`Batch ${i}–${i + batch.length} failed:`, e)
        return jsonResponse({ error: String(e) }, 500)
      }
    }

    // Phase 2: merge any categories that ended up with fewer than 3 entries
    const consolidated = await consolidateSmallCategories(allCategories, 3)

    return jsonResponse({ categories: consolidated })
  } catch (err) {
    console.error('Unexpected error:', err)
    return jsonResponse({ error: String(err) }, 500)
  }
})
