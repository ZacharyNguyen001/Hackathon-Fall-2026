/**
 * FILE PURPOSE: the game PAGE (React). It owns everything around the game: the canvas element, the 'click to start' screen, the red warning banner, the results card, and the mute button.
 * React does NOT run the game itself. It creates a `Game` (src/game/Game.ts) and gets told only when something changes (phase, banner, results), not 60 times a second.
 * It also picks the biggest whole-number zoom that fits the window so the pixels stay sharp.
 */
import { useEffect, useRef, useState } from 'react'
import '@fontsource-variable/bitcount'
import { Game, type UiState } from './game/Game'
import { sampleWeather } from './data/sampleWeather'
import { fetchLiveWeather } from './data/liveWeather'
import {
  CAREER_LIMIT_MSV, DOSE_SCALE, LOGICAL_H, LOGICAL_W, MARS_G_REAL, MOON_G_REAL, SHIELD_HABITAT, SHIELD_STORM_SHELTER,
  SPE_LIMIT_MSV, WARNING_S,
} from './game/tunables'

export default function Play() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const [started, setStarted] = useState(false)
  const [ui, setUi] = useState<UiState>({ phase: 'INTERMISSION', banner: null, caption: null, results: null, muted: false })
  const [scale, setScale] = useState(2)
  const [showTuned, setShowTuned] = useState(false) // the "real vs tuned" panel on the results card
  
  const [weather, setWeather] = useState(sampleWeather())

  // Largest whole-number scale that fits the window (keeps pixels crisp).
  useEffect(() => {
    const fit = () => setScale(Math.max(1, Math.floor(Math.min(window.innerWidth / LOGICAL_W, (window.innerHeight - 8) / LOGICAL_H))))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  useEffect(() => () => gameRef.current?.stop(), [])

  // weather simulation. called only every 5 min so we're nice to NOAA's API calls
  useEffect(() => {
    let stopped = false
    const refresh = async () => {
      const w = await fetchLiveWeather()
      if (w && !stopped) { setWeather(w); gameRef.current?.setWeather(w) }
    }
    refresh()
    const id = setInterval(refresh, 5 * 60 * 1000)
    return () => { stopped = true; clearInterval(id) }
  }, [])

  const begin = () => {
    const speed = new URLSearchParams(window.location.search).get('fast') ? 4 : 1 // ?fast=1 for testing
    // ?seed=<number> is DEBUG ONLY (rehearsal): it replaces the NOAA-derived seed for round 1. Never use it in the real demo.
    const seedText = new URLSearchParams(window.location.search).get('seed')
    const debugSeed = seedText !== null && Number.isInteger(Number(seedText)) ? Number(seedText) : undefined
    const game = new Game(canvasRef.current!, weather, setUi, speed, debugSeed)
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
        {ui.caption && (
          <div style={{ position: 'absolute', left: 8 * scale, right: 8 * scale, bottom: 18 * scale, padding: 2 * scale, background: 'rgba(0,0,0,0.75)', color: '#fff', textAlign: 'center', fontSize: 4 * scale }}>
            {ui.caption}
          </div>
        )}
        {ui.results && ui.phase === 'RESULTS' && (
          <div style={{ position: 'absolute', inset: 30 * scale, padding: 8 * scale, background: 'rgba(0,0,0,0.9)', color: '#fff', fontSize: 5 * scale, lineHeight: 1.5 }}>
            <div style={{ fontSize: 8 * scale }}>{ui.results.survived ? 'SURVIVED' : "EVAC'D"}</div>
            <div>{ui.results.isDrill ? 'DRILL' : 'LIVE'} S{ui.results.level} - dose {Math.round(ui.results.doseMSv)} mSv of {SPE_LIMIT_MSV} mSv limit</div>
            <div>Coins this round: {ui.results.coins}. Total: {ui.results.totalCoins} ({ui.results.canSave ? 'saved on this device' : 'this session only'})</div>
            <div>Career dose: {Math.round(ui.results.careerDoseMSv)} mSv (NASA's <i>proposed</i> career limit is {CAREER_LIMIT_MSV} mSv)</div>
            <div style={{ marginTop: 4 * scale, color: '#9ad' }}>Real fact: {ui.results.fact.text}</div>
            <div style={{ color: '#789' }}>Source: {ui.results.fact.source} ({ui.results.fact.status})</div>
            <button onClick={(e) => { e.currentTarget.blur(); setShowTuned((v) => !v) }} style={{ marginTop: 3 * scale, fontSize: 4 * scale }}>
              {showTuned ? 'Hide' : "What's real vs. tuned?"}
            </button>
            {showTuned && (
              <div style={{ fontSize: 3.6 * scale, lineHeight: 1.4, marginTop: 2 * scale }}>
                <div><b>REAL:</b> crew design limit for one solar particle event ({SPE_LIMIT_MSV} mSv); aluminum shielding cuts that dose about {Math.round((1 - SHIELD_HABITAT) * 100)}% (habitat); Moon {MOON_G_REAL} vs Mars {MARS_G_REAL} m/s² (we keep this ratio); the NOAA storm level and proton flux when the HUD says "live".</div>
                <div><b>PROPOSED:</b> the {CAREER_LIMIT_MSV} mSv NASA career limit is not yet adopted.</div>
                <div><b>TUNED for gameplay:</b> the {WARNING_S}s warning lead (we do not claim real warning times); storm dose rates (x{DOSE_SCALE}); storm shelter factor {SHIELD_STORM_SHELTER}; absolute gravity strength; coin values; round timers.</div>
              </div>
            )}
          </div>
        )}
        {started && (
          <button onClick={(e) => { e.currentTarget.blur(); gameRef.current?.setMuted(!ui.muted) }} style={{ position: 'absolute', right: 2 * scale, bottom: 2 * scale, fontSize: 4 * scale }}>
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
