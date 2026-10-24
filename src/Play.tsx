/**
 * FILE PURPOSE: the game PAGE (React). It owns everything around the game: the canvas element, the 'click to start' screen, the red warning banner, the results card, and the mute button.
 * React does NOT run the game itself. It creates a `Game` (src/game/Game.ts) and gets told only when something changes (phase, banner, results), not 60 times a second.
 * It also picks the biggest whole-number zoom that fits the window so the pixels stay sharp.
 */
/**
 * The game page. No backend and no network calls yet.
 * React owns the menus/overlay; the Game class owns the canvas and runs outside React.
 */
import { useEffect, useRef, useState } from 'react'
import '@fontsource-variable/bitcount'
import { Game, type UiState } from './game/Game'
import { sampleWeather } from './data/sampleWeather'
import { LOGICAL_H, LOGICAL_W } from './game/tunables'

export default function Play() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const [started, setStarted] = useState(false)
  const [ui, setUi] = useState<UiState>({ phase: 'INTERMISSION', banner: null, results: null, muted: false })
  const [scale, setScale] = useState(2)

  // Largest whole-number scale that fits the window (keeps pixels crisp).
  useEffect(() => {
    const fit = () => setScale(Math.max(1, Math.floor(Math.min(window.innerWidth / LOGICAL_W, (window.innerHeight - 8) / LOGICAL_H))))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  useEffect(() => () => gameRef.current?.stop(), [])

  const begin = () => {
    const speed = new URLSearchParams(window.location.search).get('fast') ? 4 : 1 // ?fast=1 for testing
    const game = new Game(canvasRef.current!, sampleWeather(), setUi, speed)
    gameRef.current = game
    game.start() // inside a click handler so the browser lets us play audio
    setStarted(true)
  }

  const w = LOGICAL_W * scale, h = LOGICAL_H * scale
  return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: '"Bitcount Variable", monospace' }}>
      <div style={{ position: 'relative', width: w, height: h }}>
        <canvas ref={canvasRef} width={LOGICAL_W} height={LOGICAL_H} style={{ width: w, height: h, imageRendering: 'pixelated' }} />
        {ui.banner && (
          <div role="alert" style={{ position: 'absolute', left: 0, right: 0, top: 24 * scale, padding: 6 * scale, background: 'rgba(160,0,0,0.85)', color: '#fff', textAlign: 'center', fontSize: 5 * scale }}>
            {ui.banner}
          </div>
        )}
        {ui.results && ui.phase === 'RESULTS' && (
          <div style={{ position: 'absolute', inset: 30 * scale, padding: 8 * scale, background: 'rgba(0,0,0,0.9)', color: '#fff', fontSize: 5 * scale, lineHeight: 1.5 }}>
            <div style={{ fontSize: 8 * scale }}>{ui.results.survived ? 'SURVIVED' : "EVAC'D"}</div>
            <div>{ui.results.isDrill ? 'DRILL' : 'LIVE'} S{ui.results.level} - dose {Math.round(ui.results.doseMSv)} mSv of 250 mSv limit</div>
            <div>Coins this round: {ui.results.coins} (not saved - local only)</div>
            <div style={{ marginTop: 4 * scale, color: '#9ad' }}>Real fact: {ui.results.fact.text}</div>
            <div style={{ color: '#789' }}>Source: {ui.results.fact.source} ({ui.results.fact.status})</div>
          </div>
        )}
        {started && (
          <button onClick={() => gameRef.current?.setMuted(!ui.muted)} style={{ position: 'absolute', right: 2 * scale, bottom: 2 * scale, fontSize: 4 * scale }}>
            {ui.muted ? 'Unmute' : 'Mute'}
          </button>
        )}
        {!started && (
          <button onClick={begin} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', color: '#fff', fontSize: 8 * scale, border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
            STORM SHELTER<br />
            <span style={{ fontSize: 5 * scale }}>Click to start - arrows/A-D move, W/Up/Space jump</span>
          </button>
        )}
      </div>
    </div>
  )
}
