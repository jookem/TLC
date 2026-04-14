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

interface Word {
  id: string
  word: string
  definition_en?: string | null
  definition_ja?: string | null
  example?: string | null
}

const BATCH_SIZE = 20

async function categorizeBatch(batch: Word[]): Promise<{ id: string; category: string }[]> {
  const list = batch
    .map(w => {
      const parts = [`ID: ${w.id}`, `Word: ${w.word}`]
      if (w.definition_en) parts.push(`EN: ${w.definition_en}`)
      if (w.definition_ja) parts.push(`JA: ${w.definition_ja}`)
      if (w.example) parts.push(`Example: ${w.example}`)
      return parts.join(' | ')
    })
    .join('\n')

  const prompt = `You are categorizing English vocabulary words for Japanese ESL students studying for the Eiken exam.

For each word, assign it to the BEST matching semantic/thematic category from this list:
- People & Family
- Places
- Food & Drink
- Animals & Nature
- Actions
- Feelings & Emotions
- Daily Life
- School & Study
- Sports & Activities
- Time & Frequency
- Weather & Seasons
- Describing Things
- Health & Body
- Technology
- Business & Work
- Society & Environment
- Expressions & Phrases

RULES:
- Use the definition and example to judge the best fit.
- "Expressions & Phrases" is for multi-word expressions, idioms, or fixed phrases (e.g. "be afraid of", "look forward to").
- "Time & Frequency" is for adverbs and expressions of time/frequency (e.g. "always", "sometimes", "every day").
- "Describing Things" is for adjectives and adverbs that describe qualities (e.g. "beautiful", "quickly", "expensive").
- "Actions" is for standalone verbs (e.g. "run", "study", "eat").
- If a word fits multiple categories, choose the most specific one.
- You may use a category not in this list if clearly more appropriate (e.g. "Numbers & Math", "Colors & Shapes").

Return ONLY a JSON array with exactly ${batch.length} entries — no extra text:
[{"id":"<id>","category":"<category>"},...]

Words:
${list}`

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

  if (!res.ok) {
    const err = await res.text()
    console.error('Anthropic error:', err)
    throw new Error(`Anthropic API error: ${res.status}`)
  }

  const data = await res.json()
  const text: string = data.content?.[0]?.text?.trim() ?? ''

  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error(`No JSON array in response. Raw: ${text.slice(0, 200)}`)
  return JSON.parse(match[0])
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { words }: { words: Word[] } = await req.json()
    if (!words?.length) return jsonResponse({ categories: [] })

    const allCategories: { id: string; category: string }[] = []
    for (let i = 0; i < words.length; i += BATCH_SIZE) {
      const batch = words.slice(i, i + BATCH_SIZE)
      try {
        const result = await categorizeBatch(batch)
        allCategories.push(...result)
      } catch (e) {
        console.error(`Batch ${i}–${i + batch.length} failed:`, e)
        return jsonResponse({ error: String(e) }, 500)
      }
    }

    return jsonResponse({ categories: allCategories })
  } catch (err) {
    console.error('Unexpected error:', err)
    return jsonResponse({ error: String(err) }, 500)
  }
})
