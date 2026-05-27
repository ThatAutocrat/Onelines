// Lightweight canvas confetti — no external lib needed
export function fireConfetti() {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const colors = ['#FF6B35','#FFD166','#FF4D6D','#FFAB76','#06D6A0','#118AB2']
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height,
    w: Math.random() * 10 + 5,
    h: Math.random() * 5 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI * 2,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 3 + 2,
    vr: (Math.random() - 0.5) * 0.2,
  }))

  let frame
  let start = null
  const duration = 3000

  function draw(ts) {
    if (!start) start = ts
    const elapsed = ts - start
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.globalAlpha = Math.max(0, 1 - elapsed / duration)
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    })
    if (elapsed < duration) frame = requestAnimationFrame(draw)
    else { cancelAnimationFrame(frame); canvas.remove() }
  }
  requestAnimationFrame(draw)
}
