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

/** Extract individual JSON objects from a potentially malformed array string. */
function extractQuestions(text: string): { word: string; sentence: string; distractors: string[] }[] {
  const arrayMatch = text.match(/\[[\s\S]*\]/)
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0])
    } catch {
      // fall through to object-by-object extraction
    }
  }

  const results: { word: string; sentence: string; distractors: string[] }[] = []
  const objectRegex = /\{[^{}]*\}/g
  let match
  while ((match = objectRegex.exec(text)) !== null) {
    try {
      const obj = JSON.parse(match[0])
      if (obj.word && obj.sentence && Array.isArray(obj.distractors)) {
        results.push(obj)
      }
    } catch {
      // skip malformed object
    }
  }
  return results
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { words, level, wordPool } = await req.json()

    if (!words?.length) return jsonResponse({ error: 'No words provided' }, 400)

    const wordList = words
      .map((w: { word: string; definition_en?: string }) =>
        `- ${w.word}${w.definition_en ? ` (${w.definition_en})` : ''}`
      )
      .join('\n')

    // Other words in the deck that can serve as distractors
    const poolWords: string[] = (wordPool ?? [])
      .map((w: { word: string }) => w.word)
      .filter((w: string) => !words.find((t: { word: string }) => t.word === w))

    const poolSection = poolWords.length > 0
      ? `\nVocabulary pool (prefer picking distractors from this list):\n${poolWords.join(', ')}\n`
      : ''

    const prompt = `You are creating fill-in-the-blank vocabulary quiz questions for Japanese ESL students studying for ${level ?? 'Eiken 5'}.

For each target word below, write:
1. One simple English sentence with exactly "_____" (five underscores) replacing the target word.
2. Exactly 3 distractor words (wrong answers).
${poolSection}
CRITICAL — THE BLANK:
- The sentence field MUST contain the literal string "_____" (five underscores).
- The target word must NOT appear anywhere in the sentence — it is replaced by "_____".
- Wrong example: {"word":"runs","sentence":"She runs to school."} ← WRONG, word appears in sentence
- Correct example: {"word":"runs","sentence":"She _____ to school every day."} ← CORRECT

SENTENCE RULES:
- Keep sentences very short and simple (6-10 words). This is Eiken 5 / elementary level.
- Use only basic vocabulary and grammar (present simple, past simple).
- The sentence must make it clear that ONLY the target word fits the blank.
- Do NOT use apostrophes. Write "does not" not "doesn't", "I am" not "I'm".
- Topics: school, family, food, weather, sports, daily life.

DISTRACTOR RULES:
- Pick 2 distractors from the vocabulary pool above when possible (same part of speech as the answer).
- Add 1 distractor that is semantically related to the correct answer (e.g. a near-synonym or same category word).
- All 3 distractors must be clearly wrong in the sentence context.

Target words:
${wordList}

Respond ONLY with a JSON array, no markdown, no extra text:
[{"word":"runs","sentence":"She _____ to school every day.","distractors":["walks","swims","reads"]}]`

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
      const errBody = await res.text()
      console.error('Anthropic error', res.status, errBody)
      return jsonResponse({ error: `AI error ${res.status}: ${errBody}` }, 502)
    }

    const ai = await res.json()
    const text: string = ai.content?.[0]?.text ?? ''
    const questions = extractQuestions(text)

    // Validate that every sentence contains _____ — reject any that don't
    const validQuestions = questions.filter(q => {
      if (!q.sentence.includes('_____')) {
        console.error(`Question for "${q.word}" missing blank: ${q.sentence}`)
        return false
      }
      return true
    })

    if (!validQuestions.length) {
      console.error('No valid questions extracted from:', text.slice(0, 500))
      return jsonResponse({ error: 'Could not parse questions from AI response' }, 500)
    }

    return jsonResponse({ questions: validQuestions })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: `Internal error: ${String(err)}` }, 500)
  }
})
