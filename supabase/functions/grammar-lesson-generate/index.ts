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

    const prompt = `You are writing a grammar lesson slide for Japanese students studying for the Eiken exam (levels 5, 4, and 3). These are young learners, so keep all English simple and easy to understand.

Grammar point: "${category}"

Sample sentences from this grammar category:
${sampleList || '(none provided)'}

OUTPUT: Return ONLY a valid JSON object. No text before or after. No markdown fences.

Field instructions:

"title": Use exactly "${category}"

"explanation": Write in simple English mixed with Japanese where it helps. Show the grammar formula using English + Japanese notation, e.g. "There is + 名詞 (noun)." or "主語 + can + 動詞の原形." Then add 1-2 short simple sentences explaining when to use it. Keep it very easy — imagine explaining to a 12-year-old.

"examples": An array of exactly 4 strings. Each string is TWO lines separated by \\n:
  Line 1: A simple English example sentence.
  Line 2: The Japanese translation of that sentence.
  Format each string exactly like: "There is a cat on the roof.\\nネコが屋根の上にいます。"

"hint_ja": 2 sentences in Japanese only. Explain the grammar structure and when to use it. Include the formula in Japanese (e.g.「There is ＋ 名詞」の形で、〜があります・います、という意味を表します。).

Return this exact structure:
{
  "title": "${category}",
  "explanation": "...",
  "examples": ["English 1.\\n日本語1。", "English 2.\\n日本語2。", "English 3.\\n日本語3。", "English 4.\\n日本語4。"],
  "hint_ja": "..."
}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
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

    if (!Array.isArray(slide.examples)) slide.examples = []

    return jsonResponse({ slide })
  } catch (err) {
    console.error('Unexpected error:', err)
    return jsonResponse({ error: String(err) }, 500)
  }
})
