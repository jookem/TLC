const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (!ANTHROPIC_API_KEY) {
    return jsonResponse({ error: 'ANTHROPIC_API_KEY secret is not set.' }, 500)
  }

  try {
    const { answers }: { answers: Array<{ id: string; answer: string }> } = await req.json()
    if (!Array.isArray(answers) || answers.length === 0) {
      return jsonResponse({ error: 'answers array is required' }, 400)
    }

    const list = answers.map((a, i) => `${i + 1}. ${a.answer}`).join('\n')

    const prompt = `You are translating English grammar answers into Japanese for an ESL study app for Japanese students.

For each English word or phrase below, provide the natural Japanese translation that a student would write in the blank.
Keep translations SHORT — just the key word or phrase, not a full sentence.

${list}

Return ONLY a valid JSON array of strings, one translation per item, in the same order.
Example output for 3 items: ["より大きい", "走っている", "できる"]
No text before or after. No markdown fences.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
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

    let translations: string[]
    try {
      const match = text.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('No JSON array found')
      translations = JSON.parse(match[0])
    } catch (e) {
      console.error('Parse error:', e, 'Raw:', text)
      return jsonResponse({ error: 'Failed to parse translation response' }, 500)
    }

    if (translations.length !== answers.length) {
      return jsonResponse({ error: `Got ${translations.length} translations for ${answers.length} answers` }, 500)
    }

    const results = answers.map((a, i) => ({ id: a.id, answer_ja: translations[i] }))
    return jsonResponse({ results })
  } catch (err) {
    console.error('Unexpected error:', err)
    return jsonResponse({ error: String(err) }, 500)
  }
})
