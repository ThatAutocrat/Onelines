// Bot powered by Groq (free tier) — llama3-70b
// Get your free API key at: https://console.groq.com

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const BOT_NAMES    = ['NightOwl', 'VoidInk', 'SilentPage', 'GhostQuill', 'WanderingWord']

export const BOT_ID       = 'bot-oneline'
export const BOT_USERNAME = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
export const BOT_WAIT_MS  = 30_000 // 30 seconds before bot kicks in

export async function getBotSentence(previousSentences, apiKey) {
  if (!apiKey) {
    // Fallback sentences if no API key — still feels creative
    return getFallbackSentence(previousSentences)
  }

  const storyText = previousSentences
    .map((s, i) => `${i + 1}. ${s.text}`)
    .join('\n')

  const isOpening = previousSentences.length === 0

  const systemPrompt = `You are a creative fiction writer collaborating on a one-sentence-at-a-time story with a stranger. 
Your writing style is literary, unpredictable, and vivid — like a real author. 
You avoid clichés. You surprise the reader. You advance the story meaningfully.
Rules:
- Write EXACTLY one sentence. No more.
- Never start with "I" or "The" if the previous sentence already did.
- Match the tone and genre of what's already written.
- Don't wrap up or end the story — leave it open.
- No quotation marks around your response. Just the sentence itself.`

  const userPrompt = isOpening
    ? `Start a story with one compelling opening sentence. Make it intriguing — something that makes the reader desperate to know what happens next.`
    : `Here is the story so far:\n\n${storyText}\n\nWrite the next sentence to continue this story. Be creative and unexpected.`

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt }
        ],
        max_tokens: 120,
        temperature: 0.92,
      })
    })

    if (!res.ok) throw new Error(`Groq error ${res.status}`)
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content?.trim()
    return text || getFallbackSentence(previousSentences)
  } catch (err) {
    console.warn('Groq bot error, using fallback:', err)
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
]

function getFallbackSentence(previous) {
  if (previous.length === 0) {
    return openingFallbacks[Math.floor(Math.random() * openingFallbacks.length)]
  }
  return continuationFallbacks[Math.floor(Math.random() * continuationFallbacks.length)]
}
