import { useEffect, useRef, useCallback } from 'react'
import { Recycle, Users, Leaf } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface SplineSceneProps {
  scene?: string
  className?: string
}



// City markers [lat, lon] — community locations
const CITIES: [number, number][] = [
  [38.72, -9.14],  // Lisboa ★ (larger)
  [41.15, -8.61],  // Porto
  [37.01, -7.93],  // Faro
  [40.42, -3.70],  // Madrid
  [41.39,  2.15],  // Barcelona
  [48.86,  2.35],  // Paris
  [51.51, -0.13],  // London
  [52.52, 13.40],  // Berlin
  [52.37,  4.90],  // Amsterdam
  [41.90, 12.49],  // Rome
  [50.85,  4.35],  // Brussels
  [40.71,-74.01],  // New York
  [-23.55,-46.63], // São Paulo
  [35.68,139.65],  // Tokyo
  [-33.87,151.21], // Sydney
]

// Land dots [lat, lon] — ~260 points covering major landmasses
// Compact representation; 5-10° resolution grid
const LAND: readonly [number, number][] = [
  // ─ Europe / Iberia ─
  [36,-6],[38,-8],[40,-8],[42,-9],[44,-8],[44,-4],[43,-3],[42,-2],[40,-4],[38,-6],
  [48,-2],[49,2],[50,2],[50,4],[51,5],[52,6],[53,8],[53,10],[54,12],[55,12],
  [56,12],[57,12],[58,14],[59,14],[60,12],[62,10],[64,14],[66,14],[68,16],[70,20],
  [68,22],[66,26],[64,24],[62,22],[60,20],[58,18],[56,14],
  [51,-2],[53,-3],[55,-4],[57,-4],[58,-3],[55,-2],[51,-1],
  [50,12],[51,14],[52,16],[53,18],[52,20],[50,20],[48,16],[48,14],
  [44,12],[42,14],[40,18],[38,16],[38,14],
  [45,14],[44,16],[43,18],[42,20],[41,22],[40,22],[44,20],
  [37,28],[38,30],[40,30],[41,32],[40,36],[38,38],[36,34],
  [50,24],[52,26],[52,28],[52,30],[54,28],[56,26],[58,28],[60,28],[62,28],[64,28],
  // ─ Africa ─
  [30,-5],[30,0],[30,5],[30,10],[30,15],[30,20],[30,25],[30,30],[30,35],
  [25,0],[25,10],[25,20],[25,30],[20,-15],[20,0],[20,10],[20,20],[20,30],[20,40],
  [15,-15],[15,0],[15,10],[15,20],[15,30],[15,40],[10,-15],[10,0],[10,10],[10,20],[10,30],[10,40],
  [5,-5],[5,5],[5,15],[5,25],[5,35],[0,15],[0,25],[0,35],
  [-5,15],[-5,25],[-5,35],[-10,20],[-10,30],[-10,40],[-15,25],[-15,35],[-15,45],
  [-20,25],[-20,35],[-20,44],[-25,30],[-25,40],[-30,28],[-30,30],[-33,26],
  // ─ N America ─
  [70,-140],[70,-120],[70,-100],[70,-80],[70,-60],
  [65,-140],[65,-120],[65,-100],[65,-80],[65,-60],
  [60,-140],[60,-120],[60,-100],[60,-80],[60,-65],
  [55,-130],[55,-110],[55,-90],[55,-75],[50,-125],[50,-110],[50,-90],[50,-75],[50,-65],
  [45,-125],[45,-110],[45,-90],[45,-75],[40,-125],[40,-110],[40,-90],[40,-80],[40,-75],
  [35,-120],[35,-100],[35,-85],[30,-105],[30,-90],[30,-85],[25,-100],[25,-90],
  [20,-100],[20,-90],[15,-90],[15,-86],[10,-84],[10,-80],
  // ─ S America ─
  [10,-75],[10,-65],[5,-78],[5,-65],[5,-60],[0,-75],[0,-65],[0,-60],
  [-5,-78],[-5,-65],[-5,-60],[-10,-75],[-10,-65],[-10,-58],
  [-15,-72],[-15,-62],[-15,-58],[-20,-68],[-20,-62],[-20,-58],
  [-25,-68],[-25,-62],[-30,-68],[-30,-62],[-35,-68],[-40,-68],[-55,-68],
  // ─ Asia / Russia ─
  [60,60],[60,80],[60,100],[60,120],[60,140],[65,60],[65,80],[65,100],[65,120],[65,140],[65,160],
  [70,60],[70,80],[70,100],[70,120],[70,140],[75,80],[75,100],[75,120],[75,140],
  [55,60],[55,80],[55,100],[55,120],[55,140],[50,60],[50,80],[50,100],[50,120],[50,140],
  [45,60],[45,80],[45,100],[45,120],[45,140],[40,60],[40,80],[40,100],[40,120],
  [35,50],[35,60],[35,70],[35,80],[35,90],[35,100],[35,110],[35,120],
  [30,50],[30,60],[30,70],[30,80],[30,90],[30,100],[30,110],[30,120],
  [25,56],[25,65],[25,75],[25,85],[25,95],[25,105],[25,115],
  [20,60],[20,75],[20,85],[20,95],[20,105],[20,115],
  [15,80],[15,90],[15,100],[15,110],[15,120],[10,80],[10,100],[10,110],[10,120],
  [5,100],[5,110],[5,120],[5,130],[0,105],[0,115],[0,125],
  [-5,110],[-5,120],[-5,130],[-10,120],[-10,130],[-10,140],[-15,130],[-15,140],[-15,145],
  [35,130],[36,130],[37,132],[38,132],[36,128],[34,132],
  // ─ Australia ─
  [-20,115],[-20,125],[-20,135],[-20,145],[-20,150],
  [-25,115],[-25,125],[-25,135],[-25,145],[-30,115],[-30,125],[-30,135],[-30,145],
  [-35,115],[-35,125],[-35,135],[-35,145],[-38,142],[-40,148],
  // ─ Greenland ─
  [70,-22],[72,-26],[74,-26],[76,-24],[78,-22],[80,-18],[76,-22],[72,-26],
  // ─ Middle East ─
  [28,36],[26,38],[24,40],[22,40],[20,44],[22,46],[24,50],[26,52],[28,50],[30,48],[32,46],[34,42],
  // ─ Iceland ─
  [64,-20],[65,-22],[65,-18],
]

const D2R = Math.PI / 180

/** Project a lat/lon point to screen coords given rotation phi (Y) and theta (X). */
function project(
  lat: number, lon: number, phi: number, theta: number,
  cx: number, cy: number, R: number,
): { sx: number; sy: number; z: number } {
  const latR = lat * D2R
  const lonR = lon * D2R + phi

  // Y-axis rotation (phi)
  const x1 = Math.cos(latR) * Math.sin(lonR)
  const y1 = Math.sin(latR)
  const z1 = Math.cos(latR) * Math.cos(lonR)

  // X-axis tilt (theta)
  const cosT = Math.cos(theta)
  const sinT = Math.sin(theta)
  const x2 = x1
  const y2 = y1 * cosT - z1 * sinT
  const z2 = y1 * sinT + z1 * cosT

  return { sx: cx + R * x2, sy: cy - R * y2, z: z2 }
}

function drawGlobe(canvas: HTMLCanvasElement, phi: number, theta: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const cssW = canvas.offsetWidth
  const cssH = canvas.offsetHeight
  // Resize canvas buffer if needed
  if (canvas.width !== cssW * dpr) {
    canvas.width  = cssW * dpr
    canvas.height = cssH * dpr
    ctx.scale(dpr, dpr)
  }

  const W = cssW, H = cssH
  const cx = W / 2, cy = H / 2
  const R = Math.min(W, H) * 0.46

  ctx.clearRect(0, 0, W, H)

  // ── Ocean base — dark indigo matching app palette ──
  const ocean = ctx.createRadialGradient(cx - R * 0.22, cy - R * 0.22, R * 0.05, cx, cy, R)
  ocean.addColorStop(0, '#2e3260')
  ocean.addColorStop(0.55, '#1c1f48')
  ocean.addColorStop(1, '#0e1028')
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.fillStyle = ocean; ctx.fill()

  // ── Land dots ──
  for (const [lat, lon] of LAND) {
    const { sx, sy, z } = project(lat, lon, phi, theta, cx, cy, R)
    if (z < 0) continue
    const alpha = z * 0.7 + 0.15
    ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(45,107,79,${alpha})`
    ctx.fill()
  }

  // ── City markers ──
  for (let i = 0; i < CITIES.length; i++) {
    const [lat, lon] = CITIES[i]
    const { sx, sy, z } = project(lat, lon, phi, theta, cx, cy, R)
    if (z < -0.05) continue
    const fade = Math.max(0, z)
    const isLisboa = i === 0

    // Pulse ring
    const pulse = ctx.createRadialGradient(sx, sy, 0, sx, sy, isLisboa ? 10 : 7)
    pulse.addColorStop(0, `rgba(74,222,128,${fade * 0.35})`)
    pulse.addColorStop(1, 'rgba(74,222,128,0)')
    ctx.beginPath(); ctx.arc(sx, sy, isLisboa ? 10 : 7, 0, Math.PI * 2)
    ctx.fillStyle = pulse; ctx.fill()

    // Dot
    ctx.beginPath(); ctx.arc(sx, sy, isLisboa ? 4 : 2.5, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(74,222,128,${fade * 0.95})`
    ctx.fill()
  }

  // ── Atmosphere rim glow ──
  const atm = ctx.createRadialGradient(cx, cy, R * 0.93, cx, cy, R * 1.06)
  atm.addColorStop(0, 'rgba(50,160,80,0)')
  atm.addColorStop(0.5, 'rgba(50,160,80,0.13)')
  atm.addColorStop(1, 'rgba(50,160,80,0)')
  ctx.beginPath(); ctx.arc(cx, cy, R * 1.06, 0, Math.PI * 2)
  ctx.fillStyle = atm; ctx.fill()

  // ── Night shadow (right-bottom) ──
  const shadow = ctx.createRadialGradient(cx + R * 0.4, cy + R * 0.4, 0, cx, cy, R)
  shadow.addColorStop(0, 'rgba(0,0,0,0)')
  shadow.addColorStop(0.65, 'rgba(0,0,0,0)')
  shadow.addColorStop(1, 'rgba(0,0,0,0.52)')
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.fillStyle = shadow; ctx.fill()

  // ── Rim highlight (left-top) ──
  const light = ctx.createRadialGradient(cx - R * 0.28, cy - R * 0.28, 0, cx - R * 0.28, cy - R * 0.28, R * 0.7)
  light.addColorStop(0, 'rgba(74,222,128,0.14)')
  light.addColorStop(1, 'rgba(74,222,128,0)')
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.fillStyle = light; ctx.fill()
}

const SPEED = 0.003



// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SplineScene({ scene: _scene, className }: SplineSceneProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const phiRef      = useRef(0.18)   // start showing Portugal / W Europe
  const thetaRef    = useRef(0.22)
  const dragStart   = useRef<{ x: number; y: number } | null>(null)
  const paused      = useRef(false)

  // Global pointer move/up for smooth drag beyond canvas bounds
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragStart.current) return
      phiRef.current   += (e.clientX - dragStart.current.x) / 180
      thetaRef.current += (e.clientY - dragStart.current.y) / 550
      thetaRef.current  = Math.max(-0.6, Math.min(0.6, thetaRef.current))
      dragStart.current = { x: e.clientX, y: e.clientY }
    }
    const onUp = () => {
      dragStart.current = null
      paused.current    = false
      if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup',   onUp,   { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',   onUp)
    }
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    dragStart.current = { x: e.clientX, y: e.clientY }
    paused.current    = true
    e.currentTarget.style.cursor = 'grabbing'
  }, [])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let rafId = 0
    function tick() {
      if (!paused.current) phiRef.current += SPEED
      drawGlobe(canvas!, phiRef.current, thetaRef.current)
      rafId = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div
      className={className}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
    >
      {/* Green bloom glow */}
      <div aria-hidden="true" style={{
        position: 'absolute', width: '40%', height: '40%', borderRadius: '50%',
        background: 'radial-gradient(circle, color-mix(in srgb, var(--primary) 20%, transparent), transparent 70%)',
        filter: 'blur(38px)', pointerEvents: 'none',
      }} />

      {/* Canvas globe — smaller */}
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        aria-label="Globo interativo — arraste para rodar"
        style={{
          width: '46%',
          aspectRatio: '1 / 1',
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
      />



      <style>{`
        @keyframes eco-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-7px); }
        }
      `}</style>
    </div>
  )
}
