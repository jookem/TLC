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

const BATCH_SIZE = 20

async function categorizeBatch(batch: Question[]): Promise<{ id: string; category: string }[]> {
  const list = batch
    .map(q => `ID: ${q.id}\nSentence: ${q.sentence_with_blank}\nAnswer: "${q.answer}"${q.hint_ja ? `\nHint: ${q.hint_ja}` : ''}`)
    .join('\n\n')

  const prompt = `You are categorizing ESL grammar questions for Japanese students studying for the Eiken exam.

For each question, identify the specific English grammar category. Use clear, concise names like:
"Present Simple", "Present Continuous", "Past Simple", "Past Continuous",
"Present Perfect", "Past Perfect", "Future with will", "be going to",
"Modal Verbs", "Passive Voice", "Conditionals", "Comparatives", "Superlatives",
"Articles (a/an/the)", "Prepositions", "Gerunds and Infinitives", "Question Tags",
"Relative Clauses", "Reported Speech", "Conjunctions", "Possessive Adjectives",
"Demonstratives", "Plural Nouns", "Adjectives", "Adverbs", "Imperatives",
"Question Words (Wh- questions)", "There is / There are", "To Be (Simple Present)", etc.

Return ONLY a JSON array with exactly ${batch.length} entries, one per question — no extra text:
[{"id":"<id>","category":"<grammar category>"},...]

Questions:
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
    const { questions }: { questions: Question[] } = await req.json()
    if (!questions?.length) return jsonResponse({ categories: [] })

    // Process in batches to avoid token limits
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

    return jsonResponse({ categories: allCategories })
  } catch (err) {
    console.error('Unexpected error:', err)
    return jsonResponse({ error: String(err) }, 500)
  }
})
