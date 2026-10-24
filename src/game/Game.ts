/* eslint-disable no-await-in-loop */
/**
 * FILE PURPOSE: the heart of the game. One `Game` object owns the canvas and runs a loop 60 times a second:
 *   1. read the keyboard   2. move the player (physics)   3. advance the round timer (EXPLORE -> WARNING -> DISASTER -> RESULTS)
 *   4. apply radiation dose during the disaster   5. draw the map, player, shelters and HUD.
 * It talks to React (Play.tsx) through the `onUi` callback, only when something changes.
 * All drawing here is flat placeholder rectangles marked TODO-ART (human); real art replaces them (see docs/ART_GUIDE.md).
 */
import type { GameMap, Phase, RoundPlan, RoundReport, SpaceWeather } from '../shared/contracts'
import {
  DISASTER_S, LOGICAL_H, LOGICAL_W, MAP_H, MAP_W, PLAYER_H, PLAYER_W, SHIELD_OUTSIDE, SPE_LIMIT_MSV,
  TILE_PX, WARNING_S, COIN_RADIUS_PX, GEIGER_BASE_HZ, GEIGER_MAX_HZ, PEAK_RATE_MSV_PER_S, DEV_SEED,
} from './tunables'
import { generateMap } from './world/mapgen'
import { gameGravity } from './world/bodies'
import { T_EMPTY } from './world/tiles'
import { planRound } from './sim/planRound'
import { RoundMachine } from './sim/roundMachine'
import { doseRate, isEvac, ramp } from './sim/dose'
import { computeCoins } from './sim/coins'
import { step, type Body2D } from './sim/physics'
import { FACTS, type Fact } from '../data/facts'
import { allClearLine, evacLine, warningLine } from '../audio/lines'
import { loadSfx, playSfx, startLoop, stopLoop, setSfxMuted } from '../audio/sfx'

export interface Results {
  survived: boolean; doseMSv: number; coins: number; pickups: number; level: number; isDrill: boolean; fact: Fact
}
/** What React needs to draw the overlay. Emitted only when it changes (not per frame). */
export interface UiState { phase: Phase; banner: string | null; results: Results | null; muted: boolean }

// TODO-ART (human): these are flat placeholder colors, not final palettes. Real ones go in src/art/palettes.ts.
const PALETTE = {
  mars: { sky: '#2a1410', ground: '#a8532c', ledge: '#c27a4b' },
  moon: { sky: '#0b0b12', ground: '#8a8a8a', ledge: '#b0b0b0' },
}

export class Game {
  private ctx: CanvasRenderingContext2D
  private keys = new Set<string>()
  private machine: RoundMachine
  private roundNumber = 0
  private plan!: RoundPlan
  private map!: GameMap
  private player: Body2D = { x: 0, y: 0, vx: 0, vy: 0, onGround: false }
  private alive = true
  private dose = 0
  private secondsAlive = 0
  private got = new Set<string>()
  private shield = SHIELD_OUTSIDE
  private audio: AudioContext | null = null
  private clickDebt = 0
  private raf = 0
  private last = 0
  private acc = 0
  private ui: UiState = { phase: 'INTERMISSION', banner: null, results: null, muted: false }
  private skipFirstIntermission = true

  constructor(private canvas: HTMLCanvasElement, private weather: SpaceWeather, private onUi: (s: UiState) => void, speed = 1) {
    this.ctx = canvas.getContext('2d')!
    this.machine = new RoundMachine(speed)
    this.loadRound()
  }

  start() { // call from a click: unlocks audio
    this.audio = new AudioContext()
    void loadSfx(this.audio)
    window.addEventListener('keydown', this.down)
    window.addEventListener('keyup', this.up)
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
    this.push()
  }
  stop() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('keydown', this.down)
    window.removeEventListener('keyup', this.up)
    speechSynthesis.cancel()
    void this.audio?.close()
    stopLoop()
  }
  setMuted(m: boolean) 
  { this.ui.muted = m; if (m) speechSynthesis.cancel(); this.push(); setSfxMuted(m)}

  private down = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault()
    this.keys.add(e.code)
  }
  private up = (e: KeyboardEvent) => this.keys.delete(e.code)
  private push() { this.onUi({ ...this.ui }) }

  /** MAP_LOAD: plan the round, build the map, put the player at spawn. */
  private loadRound() {
    this.roundNumber++
    const fixedSeed = this.roundNumber === 1 ? DEV_SEED : undefined // slice 1: round 1 uses a fixed seed
    this.plan = planRound(this.roundNumber, this.weather, fixedSeed)
    this.map = generateMap(this.plan.seed, this.plan.body)
    const s = this.map.spawn
    this.player = { x: s.tx * TILE_PX + 1, y: s.ty * TILE_PX - PLAYER_H + TILE_PX, vx: 0, vy: 0, onGround: false }
    this.alive = true; this.dose = 0; this.secondsAlive = 0; this.got.clear(); this.shield = SHIELD_OUTSIDE
    this.ui.banner = null; this.ui.results = null
  }

  private frame = (now: number) => {
    this.acc += Math.min((now - this.last) / 1000, 0.25) // clamp: a background tab pauses, not skips
    this.last = now
    const dt = 1 / 60
    while (this.acc >= dt) { this.update(dt); this.acc -= dt }
    this.render()
    this.raf = requestAnimationFrame(this.frame)
  }

  private update(dt: number) {
    const m = this.machine
    // Skip the very first intermission so the player can start right away.
    if (this.skipFirstIntermission) { this.skipFirstIntermission = false; m.elapsed = 8 }
    const phase = m.phase
    const playing = phase === 'EXPLORE' || phase === 'WARNING' || phase === 'DISASTER'

    if (playing && this.alive) this.movePlayer(dt)
    if ((phase === 'WARNING' || phase === 'DISASTER') && this.alive) this.secondsAlive += dt * 1 // real-time seconds
    if (phase === 'DISASTER') this.applyRadiation(dt)

    const next = m.tick(dt)
    if (next) this.enterPhase(next)
  }

  private movePlayer(dt: number) {
    const move = (this.keys.has('ArrowRight') || this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('ArrowLeft') || this.keys.has('KeyA') ? 1 : 0)
    const jump = this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW')
    const wasOnGround = this.player.onGround
    if(jump && !wasOnGround)
    {
        playSfx('jump', 0.7)
    }
    step(this.player, this.map.tiles, dt, move, jump, gameGravity(this.plan.body))

    // Pick up coins by overlap with the player's center.
    const cx = this.player.x + PLAYER_W / 2, cy = this.player.y + PLAYER_H / 2
    for (const c of this.map.coins) {
      if (this.got.has(c.id)) continue
      if (Math.hypot(cx - (c.tx * TILE_PX + 4), cy - (c.ty * TILE_PX + 4)) < COIN_RADIUS_PX + 3) this.got.add(c.id)
    }
    // Which shelter (if any) is the player's center in? Use the best-shielding one.
    this.shield = SHIELD_OUTSIDE
    for (const s of this.map.shelters)
      if (cx >= s.tx * TILE_PX && cx < (s.tx + s.tw) * TILE_PX && cy >= s.ty * TILE_PX && cy < (s.ty + s.th) * TILE_PX)
        this.shield = Math.min(this.shield, s.shieldFactor)
  }

  private applyRadiation(dt: number) {
    const t = this.machine.elapsed
    const rate = this.alive ? doseRate(this.plan.level, t, this.shield) : 0
    this.dose += rate * dt
    // Geiger click rate follows the dose rate the player is actually receiving.
    const hz = GEIGER_BASE_HZ + GEIGER_MAX_HZ * (rate / (PEAK_RATE_MSV_PER_S[5] * 1.5))
    this.clickDebt += hz * dt
    while (this.clickDebt >= 1) { this.clickDebt -= 1; this.click() }
    if (this.alive && isEvac(this.dose)) {
      this.alive = false
      this.say(evacLine)
      this.ui.banner = "EVAC'D — " + evacLine
      this.push()
    }
  }

  private enterPhase(p: Phase) {
    this.ui.phase = p
    if (p === 'INTERMISSION') this.loadRound()
    if (p === 'WARNING') { // t = 20 s: banner + caption always appear; voice plays if it can
      const line = warningLine(this.plan)
      this.ui.banner = line
      this.say(line)
      playSfx('klaxon', 0.7)
    }
    if (p === 'DISASTER' && this.alive) this.ui.banner = this.ui.banner
    if (p === 'EXPLORE') startLoop(this.plan.body === 'mars' ? 'mars-wind-loop' : 'moon-suit-hum-loop')
    if (p === 'RESULTS') stopLoop()
    if (p === 'RESULTS') this.finishRound()
    this.push()
  }

  private finishRound() {
    const survived = this.alive
    const report: RoundReport = {
      roundId: this.plan.roundId, body: this.plan.body, disaster: this.plan.disaster, level: this.plan.level,
      isDrill: this.plan.isDrill, survived, secondsAlive: this.secondsAlive, doseMSv: this.dose, pickups: this.got.size,
    }
    if (survived) { this.ui.banner = allClearLine; this.say(allClearLine) }
    this.ui.results = {
      survived, doseMSv: this.dose, coins: computeCoins(report), pickups: this.got.size,
      level: this.plan.level, isDrill: this.plan.isDrill, fact: FACTS[(this.roundNumber - 1) % FACTS.length],
    }
  }

  // ---- audio ----
  private say(text: string) {
    if (this.ui.muted || !('speechSynthesis' in window)) return
    speechSynthesis.cancel()
    speechSynthesis.speak(new SpeechSynthesisUtterance(text)) // slice 1 fallback voice; ElevenLabs clips come later
  }
  private click() {
    if (!this.audio || this.ui.muted) return
    const o = this.audio.createOscillator(), g = this.audio.createGain()
    o.frequency.value = 1800; g.gain.value = 0.04
    o.connect(g); g.connect(this.audio.destination)
    o.start(); o.stop(this.audio.currentTime + 0.012)

    if (this.ui.muted) 
      return 
    if(playSfx('geiger-click', 0.6)) 
      return

  }

  // ---- rendering ----
  private render() {
    const c = this.ctx
    const pal = PALETTE[this.plan.body]
    c.imageSmoothingEnabled = false
    c.fillStyle = pal.sky; c.fillRect(0, 0, LOGICAL_W, LOGICAL_H)

    // TODO-ART (human): tiles are flat rectangles from the placeholder palette.
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++) {
        const t = this.map.tiles[y * MAP_W + x]
        if (t === T_EMPTY) continue
        c.fillStyle = t === 1 ? pal.ground : pal.ledge
        c.fillRect(x * TILE_PX, y * TILE_PX, TILE_PX, TILE_PX)
      }
    // TODO-ART (human): shelters/pads/coins are placeholder rectangles.
    for (const s of this.map.shelters) {
      c.fillStyle = s.kind === 'storm_shelter' ? '#2a8f8f' : s.kind === 'airlock' ? '#c9a227' : '#6b7a99'
      c.fillRect(s.tx * TILE_PX, s.ty * TILE_PX, s.tw * TILE_PX, s.th * TILE_PX)
      c.fillStyle = 'rgba(0,0,0,0.35)'
      c.fillRect(s.tx * TILE_PX + 2, s.ty * TILE_PX + 2, s.tw * TILE_PX - 4, s.th * TILE_PX - 4)
    }
    c.fillStyle = '#1b3a6b'
    for (const p of this.map.pads) c.fillRect(p.tx * TILE_PX, p.ty * TILE_PX + 5, 3 * TILE_PX, 3)
    c.fillStyle = '#ffd23f'
    for (const k of this.map.coins) if (!this.got.has(k.id)) c.fillRect(k.tx * TILE_PX + 2, k.ty * TILE_PX + 2, 4, 4)
    c.fillStyle = this.alive ? '#f2f2f2' : '#555' // TODO-ART (human): player sprite
    c.fillRect(Math.round(this.player.x), Math.round(this.player.y), PLAYER_W, PLAYER_H)

    // Sky tint follows the radiation ramp.
    if (this.machine.phase === 'DISASTER') {
      c.fillStyle = `rgba(255,40,40,${0.22 * ramp(this.machine.elapsed)})`
      c.fillRect(0, 0, LOGICAL_W, LOGICAL_H)
    }
    this.drawHud()
  }

  private drawHud() {
    const c = this.ctx
    c.font = '8px "Bitcount Variable", monospace'; c.textBaseline = 'top'
    c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, 0, LOGICAL_W, 20)
    c.fillStyle = '#fff'
    const left = this.machine.remaining
    c.fillText(`${this.plan.body.toUpperCase()}  R${this.roundNumber}  ${this.machine.phase}  ${Math.ceil(left)}s`, 4, 3)
    c.fillStyle = this.alive ? '#ffd23f' : '#ff6666'
    c.fillText(this.alive ? `COINS ${this.got.size * 5}` : "EVAC'D", LOGICAL_W - 60, 3)
    const w = this.weather
    const flux = w.protonFlux10MeV == null ? '?' : w.protonFlux10MeV.toFixed(2)
    c.fillStyle = this.plan.isDrill ? '#ffb347' : '#ff4d4d'
    c.fillText(
      this.plan.isDrill ? `DRILL - real sun is quiet (S${w.sLevel}, ${flux} pfu, ${w.source})` : `LIVE STORM S${w.sLevel} (${flux} pfu)`,
      4, 12,
    )
    // Dose meter: only once the warning has sounded.
    if (this.machine.phase === 'WARNING' || this.machine.phase === 'DISASTER' || this.machine.phase === 'RESULTS') {
      const frac = Math.min(1, this.dose / SPE_LIMIT_MSV)
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(4, LOGICAL_H - 14, 104, 10)
      c.fillStyle = frac > 0.75 ? '#ff4d4d' : '#7CFC00'; c.fillRect(6, LOGICAL_H - 12, 100 * frac, 6)
      c.fillStyle = '#fff'; c.fillText(`${Math.round(this.dose)} / ${SPE_LIMIT_MSV} mSv`, 112, LOGICAL_H - 13)
    }
  }
}

export const WARNING_LEAD_LABEL = `${WARNING_S}s lead is a game value; disaster lasts ${DISASTER_S}s`
