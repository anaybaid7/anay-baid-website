import { useRef, useState, useCallback, useEffect } from 'react'

// A tiny, fully self-contained chiptune arpeggio loop built with the Web
// Audio API's oscillator nodes — no external audio file, so it works
// offline and needs nothing fetched over the network.
const NOTES = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63] // C4 E4 G4 C5 G4 E4
const STEP = 0.14

export function useChiptune() {
  const ctxRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<number | null>(null)
  const [playing, setPlaying] = useState(false)

  const stop = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    setPlaying(false)
  }, [])

  const playStep = useCallback((ctx: AudioContext, freq: number) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.06, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + STEP * 0.9)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + STEP)
  }, [])

  const play = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    const ctx = ctxRef.current
    if (ctx.state === 'suspended') ctx.resume()

    let i = 0
    playStep(ctx, NOTES[0])
    i = 1
    timerRef.current = window.setInterval(() => {
      playStep(ctx, NOTES[i % NOTES.length])
      i++
    }, STEP * 1000)
    setPlaying(true)
  }, [playStep])

  const toggle = useCallback(() => {
    if (playing) {
      stop()
    } else {
      play()
    }
  }, [playing, play, stop])

  useEffect(() => () => stop(), [stop])

  return { playing, toggle }
}
