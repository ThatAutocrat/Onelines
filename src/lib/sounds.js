// Typewriter & UI sounds using Web Audio API — no external files needed
let ctx = null
let enabled = true

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}

export function setSoundEnabled(val) { enabled = val }
export function isSoundEnabled() { return enabled }

export function playTypeClick() {
  if (!enabled) return
  try {
    const ac = getCtx()
    const buf = ac.createBuffer(1, ac.sampleRate * 0.04, ac.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.008))
    }
    const src = ac.createBufferSource()
    const gain = ac.createGain()
    gain.gain.value = 0.08
    src.buffer = buf
    src.connect(gain)
    gain.connect(ac.destination)
    src.start()
  } catch {}
}

export function playSubmit() {
  if (!enabled) return
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain); gain.connect(ac.destination)
    osc.frequency.setValueAtTime(520, ac.currentTime)
    osc.frequency.exponentialRampToValueAtTime(780, ac.currentTime + 0.12)
    gain.gain.setValueAtTime(0.12, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2)
    osc.start(); osc.stop(ac.currentTime + 0.2)
  } catch {}
}

export function playComplete() {
  if (!enabled) return
  try {
    const ac = getCtx()
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(ac.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      const t = ac.currentTime + i * 0.12
      gain.gain.setValueAtTime(0.15, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
      osc.start(t); osc.stop(t + 0.4)
    })
  } catch {}
}
