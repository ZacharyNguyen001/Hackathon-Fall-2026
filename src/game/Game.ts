/**
 * FILE PURPOSE: the heart of the game. One `Game` object owns the canvas and runs a loop 60 times a second:
 *   1. read the keyboard   2. move the player (physics)   3. advance the round timer (EXPLORE -> WARNING -> DISASTER -> RESULTS)
 *   4. apply radiation dose during the disaster   5. draw the map, player, shelters and HUD.
 * It talks to React (Play.tsx) through the `onUi` callback, only when something changes.
 * Drawing uses the human-made art when available, with placeholder shapes as fallbacks (see docs/ART_GUIDE.md).
 */
import type { GameMap, Phase, RoundPlan, RoundReport, SpaceWeather } from '../shared/contracts'
import {
  DISASTER_S, LOGICAL_H, LOGICAL_W, MAP_H, MAP_W, PLAYER_H, PLAYER_W, SHIELD_OUTSIDE, SPE_LIMIT_MSV,
  TILE_PX, WARNING_S, FACT_VOICE_DELAY_S, COIN_RADIUS_PX, GEIGER_BASE_HZ, GEIGER_MAX_HZ, PEAK_RATE_MSV_PER_S,
} from './tunables'
import { generateMap } from './world/mapgen'
import { gameGravity } from './world/bodies'
import { T_EMPTY, T_LEDGE } from './world/tiles'
import { planRound } from './sim/planRound'
import { RoundMachine } from './sim/roundMachine'
import { doseRate, isEvac, ramp } from './sim/dose'
import { computeCoins } from './sim/coins'
import { step, type Body2D } from './sim/physics'
import { FACTS, type Fact } from '../data/facts'
import { loadSfx, playSfx, startLoop, stopLoop, setSfxMuted } from '../audio/sfx'
import { allClearLine, drillNoticeLine, evacLine, FACT_SPOKEN, factClipId, VOICE_LINES, warningClipId, warningLine } from '../audio/lines'
import { playLine, preloadVoice, stopVoice } from '../audio/voice'
import { PALETTES } from '../art/palettes'
import { SPRITES } from '../art/sprites'
import { loadSprites, sprite } from './spriteLoader'
import { addRound, emptyTotals, loadTotals, type Store, type Totals } from '../data/saveCoins'

export interface Results {
  survived: boolean; doseMSv: number; coins: number; totalCoins: number; careerDoseMSv: number; canSave: boolean; pickups: number; level: number; isDrill: boolean; fact: Fact
}
/** What React needs to draw the overlay. Emitted only when it changes (not per frame). */
export interface UiState { phase: Phase; banner: string | null; caption: string | null; results: Results | null; muted: boolean }

export class Game {
  private ctx: CanvasRenderingContext2D
  private keys = new Set<string>()
  private machine: RoundMachine
  private roundNumber = 0
  private plan!: RoundPlan
  private map!: GameMap
  private player: Body2D = { x: 0, y: 0, vx: 0, vy: 0, onGround: false }
  private facingLeft = false
  private storage: Store | null = null
  private totals: Totals = emptyTotals()
  private roundRecorded = false
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
  private ui: UiState = { phase: 'INTERMISSION', banner: null, caption: null, results: null, muted: false }
  private factSaid = false
  private skipFirstIntermission = true

  constructor(private canvas: HTMLCanvasElement, private weather: SpaceWeather, private onUi: (s: UiState) => void, private speed = 1, private debugSeed?: number) {
    this.ctx = canvas.getContext('2d')!
    loadSprites(SPRITES)
    try {
      this.storage = window.localStorage
    } catch (error) {
      console.warn('Browser storage is unavailable; game totals will not persist after this session.', error)
    }
    this.totals = loadTotals(this.storage)
    this.machine = new RoundMachine(speed)
    this.loadRound()
  }

  start() { // call from a click: unlocks audio
    this.audio = new AudioContext()
    void loadSfx(this.audio)
    preloadVoice(VOICE_LINES.map((l) => l.id)) // download the voice clips now so the warning plays on time
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
    stopVoice()
    void this.audio?.close()
    stopLoop()
  }
  setMuted(m: boolean) { this.ui.muted = m; if (m) stopVoice(); this.push(); setSfxMuted(m) }
  setWeather(w: SpaceWeather) { this.weather = w } // the NEXT round uses this reading (and gets a new map seed)

  private down = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault()
    this.keys.add(e.code)
  }
  private up = (e: KeyboardEvent) => this.keys.delete(e.code)
  private push() { this.onUi({ ...this.ui }) }

  /** MAP_LOAD: plan the round, build the map, put the player at spawn. */
  private loadRound() {
    this.roundNumber++
    // Round 1 is seeded from the NOAA reading like every other round. `?seed=<n>` (debug only, for rehearsal) overrides round 1.
    const fixedSeed = this.roundNumber === 1 ? this.debugSeed : undefined
    this.plan = planRound(this.roundNumber, this.weather, fixedSeed)
    this.map = generateMap(this.plan.seed, this.plan.body)
    const s = this.map.spawn
    this.player = { x: s.tx * TILE_PX + 1, y: s.ty * TILE_PX - PLAYER_H + TILE_PX, vx: 0, vy: 0, onGround: false }
    this.alive = true; this.dose = 0; this.secondsAlive = 0; this.got.clear(); this.shield = SHIELD_OUTSIDE
    this.roundRecorded = false; this.factSaid = false
    this.ui.banner = null; this.ui.caption = null; this.ui.results = null
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
    // The round clock runs `speed` times faster in ?fast=1 test mode, so dose and seconds-alive use the same scaled time.
    const gameDt = dt * this.speed
    if ((phase === 'WARNING' || phase === 'DISASTER') && this.alive) this.secondsAlive += gameDt
    if (phase === 'DISASTER') this.applyRadiation(gameDt)

    // Read the fact card aloud a few seconds into RESULTS (round time, so ?fast and mute behave).
    if (phase === 'RESULTS' && !this.factSaid && m.elapsed >= FACT_VOICE_DELAY_S && this.ui.results) {
      this.factSaid = true
      const fact = this.ui.results.fact
      this.ui.caption = fact.text
      this.say(factClipId(fact.id), FACT_SPOKEN[fact.id] ?? fact.text)
      this.push()
    }

    const next = m.tick(dt)
    if (next) this.enterPhase(next)
  }

  private movePlayer(dt: number) {
    const move = (this.keys.has('ArrowRight') || this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('ArrowLeft') || this.keys.has('KeyA') ? 1 : 0)
    if (move !== 0) this.facingLeft = move < 0
    const jump = this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW')
    const wasOnGround = this.player.onGround
    if (jump && wasOnGround) {
      playSfx('jump', 0.7)
    }
    step(this.player, this.map.tiles, dt, move, jump, gameGravity(this.plan.body))

    // Pick up coins by overlap with the player's center.
    const cx = this.player.x + PLAYER_W / 2, cy = this.player.y + PLAYER_H / 2
    for (const c of this.map.coins) {
      if (this.got.has(c.id)) continue
      if (Math.hypot(cx - (c.tx * TILE_PX + 4), cy - (c.ty * TILE_PX + 4)) < COIN_RADIUS_PX + 3) {
        this.got.add(c.id)
        playSfx('coin')
      }
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
      this.say('evac', evacLine)
      this.ui.banner = "EVAC'D — " + evacLine
      this.push()
    }
  }

  private enterPhase(p: Phase) {
    this.ui.phase = p
    if (p === 'INTERMISSION') this.loadRound()
    if (p === 'EXPLORE' && this.plan.isDrill) { // tell the player (in voice and caption) that this round is a drill
      this.ui.caption = drillNoticeLine
      this.say('drill-notice', drillNoticeLine)
    }
    if (p === 'WARNING') { // t = 20 s: banner + caption always appear; voice plays if it can
      this.ui.caption = null // the red banner takes over
      const line = warningLine(this.plan)
      this.ui.banner = line
      this.say(warningClipId(this.plan), line)
      playSfx('klaxon', 0.7)
    }
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
    if (survived) { this.ui.banner = allClearLine; this.say('all-clear', allClearLine) }
    const coins = computeCoins(report)
    if (!this.roundRecorded) {
      this.totals = addRound(this.storage, { coins, survived, doseMSv: this.dose }, this.totals)
      this.roundRecorded = true
    }
    this.ui.results = {
      survived, doseMSv: this.dose, coins, totalCoins: this.totals.coins, careerDoseMSv: this.totals.careerDoseMSv, canSave: this.storage !== null, pickups: this.got.size,
      level: this.plan.level, isDrill: this.plan.isDrill, fact: FACTS[(this.roundNumber - 1) % FACTS.length],
    }
  }

  // ---- audio ----
  private say(id: string, text: string) {
    if (this.ui.muted) return
    playLine(id, text)
  }
  private click() {
    if (!this.audio || this.ui.muted) return
    if (playSfx('geiger-click', 0.6)) return // the real sound file, if it loaded
    // Fallback: a tiny synthesized beep.
    const o = this.audio.createOscillator(), g = this.audio.createGain()
    o.frequency.value = 1800; g.gain.value = 0.04
    o.connect(g); g.connect(this.audio.destination)
    o.start(); o.stop(this.audio.currentTime + 0.012)
  }

  // ---- rendering ----
  private render() {
    const c = this.ctx
    const pal = PALETTES[this.plan.body]
    c.imageSmoothingEnabled = false
    c.fillStyle = pal.sky;
    c.fillRect(0, 0, LOGICAL_W, LOGICAL_H)

    const groundImage = sprite(this.plan.body === 'mars' ? 'mars_ground' : 'moon_ground')
    const ledgeImage = sprite(this.plan.body === 'mars' ? 'mars_ledge' : 'moon_ledge')
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++) {
        const t = this.map.tiles[y * MAP_W + x]
        if (t === T_EMPTY) continue
        const tileX = x * TILE_PX
        const tileY = y * TILE_PX
        if (t === 1 && groundImage) {
          c.drawImage(groundImage, tileX, tileY, TILE_PX, TILE_PX)
        } else if (t === T_LEDGE && ledgeImage) {
          const previousTile = x > 0 ? this.map.tiles[y * MAP_W + x - 1] : T_EMPTY
          if (previousTile !== T_LEDGE) {
            let widthTiles = 1
            while (x + widthTiles < MAP_W && this.map.tiles[y * MAP_W + x + widthTiles] === T_LEDGE)
              widthTiles++
            c.drawImage(ledgeImage, tileX, tileY, widthTiles * TILE_PX, TILE_PX)
          }
        } else {
          c.fillStyle = t === 1 ? pal.ground : pal.ledge
          c.fillRect(tileX, tileY, TILE_PX, TILE_PX)
        }
      }

    for (const s of this.map.shelters) {
      const spriteName = s.kind === 'storm_shelter' ? 'stormShelter' : s.kind
      const image = sprite(spriteName)
      const x = s.tx * TILE_PX
      const y = s.ty * TILE_PX

      if (image) {
        c.drawImage(image, x, y)
      } else {
        c.fillStyle =
          s.kind === 'storm_shelter' ? '#2a8f8f' :
            s.kind === 'airlock' ? '#c9a227' : '#6b7a99'
        c.fillRect(x, y, s.tw * TILE_PX, s.th * TILE_PX)
        c.fillStyle = 'rgba(0,0,0,0.35)'
        c.fillRect(x + 2, y + 2, s.tw * TILE_PX - 4, s.th * TILE_PX - 4)
      }
    }

    const coinImage = sprite('coin')
    for (const k of this.map.coins) {
      if (this.got.has(k.id)) continue

      const x = k.tx * TILE_PX
      const y = k.ty * TILE_PX

      if (coinImage) {
        c.drawImage(coinImage, x, y)
      } else {
        c.fillStyle = '#ffd23f'
        c.fillRect(x + 2, y + 2, 4, 4)
      }
    }

    const playerImage = sprite('player')
    if (playerImage) {
      const x = Math.round(this.player.x) - 1
      const y = Math.round(this.player.y) - 2
      if (this.facingLeft) {
        c.save()
        c.translate(x * 2 + playerImage.width, 0)
        c.scale(-1, 1)
        c.drawImage(playerImage, x, y)
        c.restore()
      } else {
        c.drawImage(playerImage, x, y)
      }
    } else {
      c.fillStyle = this.alive ? '#f2f2f2' : '#555'
      c.fillRect(Math.round(this.player.x), Math.round(this.player.y), PLAYER_W, PLAYER_H)

    }

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
    const dbg = this.roundNumber === 1 && this.debugSeed !== undefined ? ' DEBUG SEED' : ''
    c.fillText(`${this.plan.body.toUpperCase()}  R${this.roundNumber}${dbg}  ${this.machine.phase}  ${Math.ceil(left)}s`, 4, 3)
    c.fillStyle = '#ffd23f'
    c.fillText(`BANK ${this.totals.coins}`, LOGICAL_W - 60, 3)
    const w = this.weather
    const flux = w.protonFlux10MeV == null ? '?' : w.protonFlux10MeV.toFixed(2)
    // "2026-10-24T16:06:00Z" -> "10-24 16:06Z" (when NOAA made the reading)
    const obs = `${w.observedAt.slice(5, 10)} ${w.observedAt.slice(11, 16)}Z`
    c.fillStyle = this.plan.isDrill ? '#ffb347' : '#ff4d4d'
    c.fillText(
      this.plan.isDrill ? `DRILL - real sun is quiet (S${w.sLevel}, ${flux} pfu, ${w.source}, obs ${obs})` : `LIVE STORM S${w.sLevel} (${flux} pfu, ${w.source}, obs ${obs})`,
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
