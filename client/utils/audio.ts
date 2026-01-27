export function playChime(volume: number = 1) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    const now = ctx.currentTime
    o.type = 'sine'
    o.frequency.setValueAtTime(880, now)
    const vol = Math.max(0, Math.min(volume, 2))
    const baseGain = 0.02
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(baseGain * vol, now + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)
    o.connect(g)
    g.connect(ctx.destination)
    o.start(now)
    o.stop(now + 0.4)
    o.onended = () => {
      ctx.close()
    }
  } catch {}
}

let currentLoop: HTMLAudioElement | null = null

export function startAlertLoop(url: string = '/sounds/new-order.mp3', volume: number = 1) {
  try {
    if (currentLoop) return
    const audio = new Audio(url)
    audio.loop = true
    audio.volume = Math.max(0, Math.min(volume, 1))
    audio.play().catch(() => {})
    currentLoop = audio
  } catch {}
}

export function stopAlertLoop() {
  try {
    if (currentLoop) {
      currentLoop.pause()
      currentLoop.currentTime = 0
      currentLoop = null
    }
  } catch {}
}

