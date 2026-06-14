// Bot powered by Groq (free tier) — llama-3.3-70b-versatile
// Get your free API key at: https://console.groq.com

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const BOT_NAMES    = ['NightOwl', 'VoidInk', 'SilentPage', 'GhostQuill', 'WanderingWord']

export const BOT_ID       = '00000000-0000-0000-0000-000000000001'
export const BOT_USERNAME = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
export const BOT_WAIT_MS  = 30_000 // 30 seconds before bot kicks in

// Infer rough tone/genre from the story so far so we can tell the model what it's working with
function inferTone(sentences) {
  if (!sentences.length) return null
  const joined = sentences.map(s => s.text).join(' ').toLowerCase()
  if (/blood|death|kill|dark|shadow|corpse|haunt|ghost|fear|scream/.test(joined)) return 'dark / horror'
  if (/laugh|joke|absurd|ridiculous|banana|clown|silly|chaos/.test(joined)) return 'absurdist / comedic'
  if (/love|heart|miss|longing|kiss|tender|ache/.test(joined)) return 'romantic / melancholic'
  if (/space|planet|galaxy|ship|robot|android|future|laser/.test(joined)) return 'sci-fi'
  if (/sword|castle|dragon|magic|wizard|kingdom|elf|quest/.test(joined)) return 'fantasy'
  if (/detective|murder|suspect|clue|crime|police|witness/.test(joined)) return 'mystery / thriller'
  return 'literary fiction'
}

export async function getBotSentence(previousSentences, apiKey) {
  const turnNum = previousSentences.length + 1
  console.group(`🤖 Bot turn ${turnNum}`)

  if (!apiKey) {
    console.warn('❌ No API key found — using hardcoded fallback')
    console.groupEnd()
    return getFallbackSentence(previousSentences)
  }

  console.log('🔑 API key present, calling Groq...')

  const isOpening = previousSentences.length === 0
  const tone      = inferTone(previousSentences)

  // Give the model the FULL story so far, clearly formatted
  const fullStory = previousSentences
    .map((s, i) => `[${i + 1}] ${s.text}`)
    .join('\n')

  // Pull out just the last sentence as a direct hook for the continuation
  const lastSentence = previousSentences.length
    ? previousSentences[previousSentences.length - 1].text
    : null

  const remainingTurns = 10 - previousSentences.length

  const systemPrompt = `You are a skilled co-author on a collaborative one-sentence-at-a-time story. \
Your ONLY job is to write the single next sentence — nothing else.

ABSOLUTE RULES:
- Output EXACTLY one sentence. No preamble, no explanation, no quotation marks. Just the sentence.
- The sentence must flow naturally and directly from the last line written.
- Stay inside the world, tone, and genre already established — do not pivot or reset.
- Introduce ONE small forward movement: a new detail, a reaction, a revelation, a shift in tension. Not a full plot twist.
- Never wrap up or conclude the story. ${remainingTurns} sentences remain — leave room.
- No clichés. No "suddenly", "little did they know", "in that moment".
- Do not start with "I" or repeat the same opening word as the last sentence.`

  const userPrompt = isOpening
    ? `Start a collaborative story with one compelling opening sentence. \
Make it specific, grounded, and intriguing — establish a character, place, or object that begs a question. \
Avoid generic openings. No weather. No waking up.`
    : `STORY SO FAR (${previousSentences.length} of 10 sentences written, genre: ${tone}):\n\n${fullStory}\n\n---\nLast sentence: "${lastSentence}"\n\nWrite sentence ${turnNum} — the direct continuation of that last line. One sentence only.`

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   }
        ],
        max_tokens: 100,
        temperature: 0.85,
        stop: ['\n', '.  ', '!  ', '?  '], // stop after first sentence ends
      })
    })

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      console.error(`❌ Groq HTTP ${res.status}:`, errBody)
      throw new Error(`Groq error ${res.status}`)
    }

    const data = await res.json()
    let text = data.choices?.[0]?.message?.content?.trim()

    if (text) {
      // Strip any accidental leading labels like "Sentence 3:" or "[3]"
      text = text.replace(/^(\[?\d+\]?:?\s*|sentence\s*\d+:?\s*)/i, '').trim()
      // Strip surrounding quotes if the model added them
      text = text.replace(/^["']|["']$/g, '').trim()
      console.log('✅ Groq responded:', text)
      console.groupEnd()
      return text
    }

    console.warn('⚠️ Groq returned empty text, using fallback')
    console.groupEnd()
    return getFallbackSentence(previousSentences)
  } catch (err) {
    console.error('❌ Groq error, using fallback:', err.message)
    console.groupEnd()
    return getFallbackSentence(previousSentences)
  }
}

// Curated fallback sentences that feel like real writing
const openingFallbacks = [
  'The photograph arrived three days after the funeral, postmarked from a city she had never visited.',
  'Every clock in the house stopped at the same moment — not at midnight, but at 3:17 in the afternoon.',
  'She had been collecting other people\'s grocery lists for eleven years before she finally understood why.',
  'The last lighthouse keeper left behind only a jar of teeth and a note that read: "They were here first."',
  'When the translation finally came back, the archaeologist closed her laptop and booked the first flight home.',
  'A door opened at the end of the corridor that had not been there yesterday.',
  'The dog came back, but it wasn\'t the same dog.',
]

const continuationFallbacks = [
  'Nobody said anything, but everyone in the room shifted almost imperceptibly toward the door.',
  'The smell of rain arrived before the storm, carrying something older beneath it.',
  'She recognized the handwriting before she recognized the name.',
  'It was exactly where he\'d left it — which meant someone had put it back.',
  'The light changed, and for a moment the whole city looked like a memory.',
  'He laughed, which was the wrong reaction, and they both knew it.',
  'There were footprints leading in — none leading out.',
  'The message was only four words, but she read it seventeen times.',
  'Whatever it was, it had been waiting.',
  'The door at the end of the hall was the only one without a shadow beneath it.',
]

function getFallbackSentence(previous) {
  if (previous.length === 0) {
    return openingFallbacks[Math.floor(Math.random() * openingFallbacks.length)]
  }
  return continuationFallbacks[Math.floor(Math.random() * continuationFallbacks.length)]
}
