const adjectives = [
  'Silent', 'Golden', 'Cosmic', 'Velvet', 'Amber', 'Crystal', 'Misty', 'Neon',
  'Rustic', 'Solar', 'Lunar', 'Vivid', 'Calm', 'Wild', 'Brave', 'Swift',
  'Gentle', 'Fierce', 'Radiant', 'Sleepy', 'Ancient', 'Tiny', 'Grand', 'Secret'
]

const nouns = [
  'Fox', 'Moth', 'River', 'Storm', 'Ember', 'Sparrow', 'Dusk', 'Tide',
  'Flame', 'Cloud', 'Oak', 'Comet', 'Petal', 'Echo', 'Frost', 'Gale',
  'Raven', 'Sage', 'Bloom', 'Drift', 'Fern', 'Lark', 'Mist', 'Pine'
]

export function generateUsername() {
  const adj  = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num  = Math.floor(Math.random() * 99) + 1
  return `${adj}${noun}${num}`
}
