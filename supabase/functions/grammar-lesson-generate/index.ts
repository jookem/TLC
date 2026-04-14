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

interface SampleQuestion {
  sentence_with_blank: string
  answer: string
  hint_ja?: string
}

interface SlideResult {
  title: string
  explanation: string
  examples: string[]
  hint_ja: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { category, samples }: { category: string; samples: SampleQuestion[] } = await req.json()
    if (!category) return jsonResponse({ error: 'category is required' }, 400)

    const sampleList = (samples ?? [])
      .slice(0, 5)
      .map(q => `- ${q.sentence_with_blank.replace('_____', `[${q.answer}]`)}`)
      .join('\n')

    const prompt = `You are creating a grammar lesson slide for Japanese students studying English for the Eiken exam.

Grammar category: "${category}"

Sample quiz questions from this category:
${sampleList || '(none provided)'}

Generate a lesson slide with exactly this JSON structure — no extra text:
{
  "title": "<the grammar category name, e.g. 'Present Simple'>",
  "explanation": "<2-3 sentences in English explaining HOW to form this grammar: the structure/formula, when to use it, key rules>",
  "examples": ["<sentence 1>", "<sentence 2>", "<sentence 3>", "<sentence 4>"],
  "hint_ja": "<clear Japanese explanation of the grammar structure and usage, 2-3 sentences>"
}

Rules:
- title: use the exact category name provided
- explanation: explain the grammar formula/structure (e.g. "Subject + have/has + past participle"), when it's used, and any key rules. Be concise but informative for Eiken level students.
- examples: write 4 natural English sentences that clearly demonstrate this grammar point. Use simple vocabulary appropriate for Eiken 5–3 level.
- hint_ja: explain the grammar structure and usage clearly in Japanese. Include the formula in Japanese notation (e.g. 「主語 + have/has + 過去分詞」の形). 2-3 sentences.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Anthropic error:', err)
      return jsonResponse({ error: `Anthropic API error: ${res.status}` }, 500)
    }

    const data = await res.json()
    const text: string = data.content?.[0]?.text?.trim() ?? ''

    let slide: SlideResult
    try {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No JSON found')
      slide = JSON.parse(match[0])
    } catch (e) {
      console.error('Parse error:', e, 'Raw:', text)
      return jsonResponse({ error: 'Failed to parse slide response' }, 500)
    }

    return jsonResponse({ slide })
  } catch (err) {
    console.error('Unexpected error:', err)
    return jsonResponse({ error: String(err) }, 500)
  }
})
