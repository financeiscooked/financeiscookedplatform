import React, { useState, useRef, useEffect, useCallback } from 'react'

// ─── Data ──────────────────────────────────────────────────────────────────────

const FUNCTIONS = [
  { id: 'strategic',  name: 'Strategic Finance',    icon: '🏦' },
  { id: 'treasury',   name: 'Treasury',              icon: '💰' },
  { id: 'payroll',    name: 'Payroll',               icon: '💸' },
  { id: 'audit',      name: 'Internal Audit',        icon: '🔍' },
  { id: 'accounting', name: 'Accounting',            icon: '📊' },
  { id: 'ar',         name: 'Accounts Receivable',   icon: '📥' },
  { id: 'fpa',        name: 'FP&A',                  icon: '📈' },
  { id: 'ap',         name: 'Accounts Payable',      icon: '📤' },
]

const AI_DEFAULTS = {
  strategic:  {
    pos: 0.14, label: 'Rare', temp: '120°F',
    explanation: "M&A decisions, capital structure, investor relations — AI is a research assistant here, not the decision-maker. Human judgment is the whole point.",
  },
  treasury:   {
    pos: 0.28, label: 'Medium Rare', temp: '128°F',
    explanation: "Cash flow forecasting has solid AI tools but capital allocation, FX strategy, and banking relationships stay human-led.",
  },
  payroll:    {
    pos: 0.33, label: 'Medium Rare', temp: '131°F',
    explanation: "Calculations are automated but multi-state compliance, benefits complexity, and employee disputes keep humans essential.",
  },
  audit:      {
    pos: 0.46, label: 'Medium', temp: '138°F',
    explanation: "AI handles risk sampling and anomaly detection well. But professional skepticism and sign-off are irreplaceable — regulators want humans accountable.",
  },
  accounting: {
    pos: 0.50, label: 'Medium', temp: '140°F',
    explanation: "Month-end close automation is accelerating fast. But GAAP judgment, complex reconciliations, and audit prep still need experienced CPAs.",
  },
  ar:         {
    pos: 0.63, label: 'Medium Well', temp: '153°F',
    explanation: "AI cash application, collections scoring, and dunning automation are mature. The human touch is fading except for major disputes.",
  },
  fpa:        {
    pos: 0.68, label: 'Medium Well', temp: '158°F',
    explanation: "Variance analysis, rolling forecasts, scenario modeling — AI is eating FP&A from the bottom up. Senior FP&A survives; junior roles are toast.",
  },
  ap:         {
    pos: 0.80, label: 'Well Done', temp: '172°F',
    explanation: "Three-way PO matching, invoice capture, payment runs — nearly fully automated. Humans handle edge cases and vendor disputes. This one's almost done.",
  },
}

const ZONES = [
  { id: 'raw',   label: 'Raw',       emoji: '🧊', start: 0,     end: 0.143, color: '#44aaff' },
  { id: 'rare',  label: 'Rare',      emoji: '🥩', start: 0.143, end: 0.286, color: '#ff99bb' },
  { id: 'medr',  label: 'Med Rare',  emoji: '',   start: 0.286, end: 0.429, color: '#ffaa77' },
  { id: 'med',   label: 'Medium',    emoji: '',   start: 0.429, end: 0.571, color: '#F0A030' },
  { id: 'medw',  label: 'Med Well',  emoji: '',   start: 0.571, end: 0.714, color: '#ff9900' },
  { id: 'well',  label: 'Well Done', emoji: '',   start: 0.714, end: 0.857, color: '#D94E2A' },
  { id: 'burnt', label: 'Burnt',     emoji: '🔥', start: 0.857, end: 1.0,   color: '#ff3322' },
]

const CARD_STYLES = {
  raw:   { bg: 'rgba(10,25,45,0.92)',  border: 'rgba(68,170,255,0.45)',   color: '#44aaff', shadow: '0 4px 20px rgba(68,170,255,0.12)' },
  rare:  { bg: 'rgba(30,10,20,0.92)',  border: 'rgba(255,150,170,0.45)',  color: '#ff99bb', shadow: 'none' },
  medr:  { bg: 'rgba(38,16,5,0.92)',   border: 'rgba(255,160,100,0.5)',   color: '#ffaa77', shadow: 'none' },
  med:   { bg: 'rgba(38,20,0,0.92)',   border: 'rgba(240,160,48,0.6)',    color: '#F0A030', shadow: '0 4px 20px rgba(240,160,0,0.15)' },
  medw:  { bg: 'rgba(32,12,0,0.92)',   border: 'rgba(255,153,0,0.7)',     color: '#ff9900', shadow: '0 4px 24px rgba(255,120,0,0.2)' },
  well:  { bg: 'rgba(26,8,0,0.94)',    border: 'rgba(217,78,42,0.85)',    color: '#D94E2A', shadow: '0 4px 30px rgba(217,78,42,0.35)' },
  burnt: { bg: 'rgba(15,3,0,0.96)',    border: 'rgba(255,50,0,0.9)',      color: '#ff3322', shadow: '0 4px 40px rgba(255,40,0,0.45)' },
}

function getZone(pos) {
  return ZONES.find(z => pos >= z.start && pos < z.end) || ZONES[ZONES.length - 1]
}

// ─── Fire Canvas ───────────────────────────────────────────────────────────────

function useFireCanvas(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const particles = []
    let animId

    function resize() {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    function newParticle() {
      return {
        x: Math.random() * canvas.width,
        y: canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 3 + 1.5),
        size: Math.random() * 12 + 4,
        life: 1,
        decay: Math.random() * 0.015 + 0.008,
        isEmber: Math.random() < 0.3,
      }
    }

    function draw() {
      animId = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (particles.length < 70) particles.push(newParticle())
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life -= p.decay
        p.size *= 0.993
        if (p.life <= 0) { particles.splice(i, 1); continue }
        if (p.isEmber) {
          ctx.save()
          ctx.globalAlpha = p.life * 0.9
          ctx.fillStyle = p.life > 0.5 ? '#ffcc00' : '#ff6600'
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        } else {
          const hue = p.life > 0.6 ? 40 : p.life > 0.3 ? 20 : 0
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
          g.addColorStop(0, `hsla(${hue}, 100%, 70%, ${p.life * 0.9})`)
          g.addColorStop(0.5, `hsla(${hue - 10}, 100%, 50%, ${p.life * 0.5})`)
          g.addColorStop(1, `hsla(${hue - 20}, 100%, 30%, 0)`)
          ctx.save()
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      }
    }

    resize()
    draw()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => { cancelAnimationFrame(animId); ro.disconnect() }
  }, [canvasRef])
}

// ─── Component ─────────────────────────────────────────────────────────────────

const initPositions = () => Object.fromEntries(FUNCTIONS.map(fn => [fn.id, 0.5]))

export default function TheGrill() {
  const [positions, setPositions] = useState(initPositions)
  const [aiRevealed, setAiRevealed] = useState(false)
  const [hostPositions, setHostPositions] = useState(null)
  const [showScore, setShowScore] = useState(false)
  const [spotlight, setSpotlight] = useState(null)
  const [revealedSet, setRevealedSet] = useState(new Set())
  const [isResetting, setIsResetting] = useState(false)

  const grillRef = useRef(null)
  const canvasRef = useRef(null)
  const dragRef = useRef(null)

  useFireCanvas(canvasRef)

  const handlePointerDown = useCallback((e, id) => {
    if (aiRevealed) {
      setSpotlight(prev => prev === id ? null : id)
      return
    }
    dragRef.current = { id, startX: e.clientX, startPos: positions[id] }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }, [aiRevealed, positions])

  const handlePointerMove = useCallback((e, id) => {
    if (!dragRef.current || dragRef.current.id !== id) return
    const grill = grillRef.current
    if (!grill) return
    const dx = e.clientX - dragRef.current.startX
    const newPos = Math.max(0.03, Math.min(0.97, dragRef.current.startPos + dx / grill.offsetWidth))
    setPositions(prev => ({ ...prev, [id]: newPos }))
  }, [])

  const handlePointerUp = useCallback(() => { dragRef.current = null }, [])

  const handleAiReveal = useCallback(() => {
    if (aiRevealed) return
    setHostPositions({ ...positions })
    setAiRevealed(true)
    FUNCTIONS.forEach((fn, i) => {
      const delay = i * 200 + Math.random() * 80
      setTimeout(() => {
        setPositions(prev => ({ ...prev, [fn.id]: AI_DEFAULTS[fn.id].pos }))
        setRevealedSet(prev => new Set([...prev, fn.id]))
      }, delay)
    })
    setTimeout(() => setShowScore(true), 2200)
  }, [aiRevealed, positions])

  const handleReset = useCallback(() => {
    setIsResetting(true)
    setAiRevealed(false)
    setShowScore(false)
    setSpotlight(null)
    setRevealedSet(new Set())
    setHostPositions(null)
    setPositions(initPositions())
    setTimeout(() => setIsResetting(false), 600)
  }, [])

  const spotlightFn = spotlight ? FUNCTIONS.find(f => f.id === spotlight) : null
  const spotlightAI = spotlight ? AI_DEFAULTS[spotlight] : null

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-5">

        {/* Header */}
        <div className="text-center mb-5">
          <h2 className="font-russo text-2xl sm:text-4xl tracking-wide mb-1.5 leading-tight">
            <span className="text-[var(--text-primary)]">how </span>
            <span className="text-[#D94E2A]">cooked</span>
            <span className="text-[var(--text-primary)]"> is your </span>
            <span className="text-[#F0A030]">finance function?</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-sm">
            {aiRevealed
              ? 'Click any card to see the AI\'s full reasoning'
              : 'Drag each card left or right to rate how cooked it is'}
          </p>
        </div>

        {/* Zone label bar */}
        <div className="grid grid-cols-7 gap-px mb-1.5">
          {ZONES.map(z => (
            <div key={z.id} className="text-center px-0.5 py-1">
              <div className="text-[9px] sm:text-[11px] font-bold tracking-wider uppercase leading-tight"
                style={{ color: z.color }}>
                {z.emoji && <span className="block sm:inline">{z.emoji} </span>}
                {z.label}
              </div>
            </div>
          ))}
        </div>

        {/* Grill */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div
            ref={grillRef}
            className="relative w-full"
            style={{
              background: 'linear-gradient(90deg, #0a1520 0%, #111215 12%, #1f0e06 25%, #3d1a04 38%, #6b2c00 52%, #9b4000 65%, #c05500 78%, #200400 91%, #0d0100 100%)',
              padding: '14px 0',
            }}
          >
            {/* Fire canvas */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 right-0 h-full pointer-events-none"
              style={{ width: '28%', zIndex: 5 }}
            />

            {/* Heat shimmer */}
            <div
              className="absolute top-0 right-0 h-full pointer-events-none grill-shimmer"
              style={{
                width: '42%',
                background: 'linear-gradient(90deg, transparent, rgba(255,80,0,0.05))',
                zIndex: 4,
              }}
            />

            {/* Zone dividers */}
            {ZONES.slice(1).map(z => (
              <div
                key={z.id}
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{ left: `${z.start * 100}%`, width: '1px', background: 'rgba(255,255,255,0.04)', zIndex: 2 }}
              />
            ))}

            {/* Grate rows */}
            {FUNCTIONS.map((fn) => {
              const pos = positions[fn.id]
              const zone = getZone(pos)
              const cs = CARD_STYLES[zone.id]
              const isSizzling = zone.id === 'well' || zone.id === 'burnt'

              let cardTransition = ''
              if (isResetting) cardTransition = 'left 0.5s ease'
              else if (aiRevealed) cardTransition = 'left 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)'

              return (
                <div
                  key={fn.id}
                  className="relative flex items-center"
                  style={{ height: '66px', margin: '3px 0', zIndex: 6 }}
                >
                  {/* Grate bar */}
                  <div
                    className="absolute inset-x-0"
                    style={{
                      height: '9px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(140,140,140,0.45) 20%, rgba(70,70,70,0.75) 55%, rgba(30,30,30,0.85) 85%)',
                      borderRadius: '5px',
                      boxShadow: '0 3px 8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)',
                      zIndex: 1,
                    }}
                  />

                  {/* Function card */}
                  <div
                    className={`absolute flex items-center gap-2 rounded-xl select-none${isSizzling ? ' card-sizzle' : ''}${aiRevealed ? ' cursor-pointer' : ' cursor-grab'}`}
                    style={{
                      left: `${pos * 100}%`,
                      transform: 'translateX(-50%)',
                      height: '50px',
                      minWidth: '155px',
                      maxWidth: '210px',
                      padding: '0 11px',
                      background: cs.bg,
                      border: `1.5px solid ${cs.border}`,
                      boxShadow: cs.shadow,
                      backdropFilter: 'blur(12px)',
                      zIndex: 10,
                      transition: cardTransition || undefined,
                    }}
                    onPointerDown={(e) => handlePointerDown(e, fn.id)}
                    onPointerMove={(e) => handlePointerMove(e, fn.id)}
                    onPointerUp={handlePointerUp}
                  >
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>{fn.icon}</span>
                    <span
                      className="font-bold text-xs sm:text-sm whitespace-nowrap flex-1 min-w-0 truncate"
                      style={{ color: cs.color }}
                    >
                      {fn.name}
                    </span>
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0"
                      style={{
                        color: cs.color,
                        background: `${cs.border.replace(')', ', 0.15)').replace('rgba', 'rgba')}`,
                        border: `1px solid ${cs.border}`,
                      }}
                    >
                      {zone.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Hint */}
        {!aiRevealed && (
          <p className="text-center text-[var(--text-hint)] text-xs mt-2 tracking-wide">
            ← drag left for less cooked · drag right for more cooked →
          </p>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={handleReset}
            className="px-5 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            style={{ border: '1px solid var(--border-default)' }}
          >
            ↺ Reset
          </button>
          <button
            onClick={handleAiReveal}
            disabled={aiRevealed}
            className="px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all disabled:cursor-not-allowed"
            style={{
              background: aiRevealed
                ? 'var(--bg-subtle)'
                : 'linear-gradient(135deg, #D94E2A, #8b1a00)',
              color: aiRevealed ? 'var(--text-tertiary)' : '#fff',
              boxShadow: aiRevealed ? 'none' : '0 8px 30px rgba(217,78,42,0.35)',
              border: 'none',
              opacity: aiRevealed ? 0.7 : 1,
            }}
          >
            {aiRevealed ? '✅ AI Defaults Shown' : '🤖 Show AI Defaults'}
          </button>
        </div>

        {/* Spotlight panel */}
        {aiRevealed && spotlightFn && spotlightAI && (
          <div
            key={spotlight}
            className="mt-5 rounded-2xl p-4 sm:p-5"
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              animation: 'grillFadeUp 0.3s ease',
            }}
          >
            <div className="flex items-start gap-4">
              <span style={{ fontSize: '28px', lineHeight: 1, paddingTop: '2px', flexShrink: 0 }}>{spotlightFn.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-bold text-[var(--text-primary)] text-sm">{spotlightFn.name}</span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(217,78,42,0.15)', color: '#D94E2A', border: '1px solid rgba(217,78,42,0.3)' }}
                  >
                    🤖 AI: {spotlightAI.label}
                  </span>
                  <span className="text-[var(--text-tertiary)] text-xs font-mono">{spotlightAI.temp}</span>
                </div>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{spotlightAI.explanation}</p>
              </div>
            </div>
          </div>
        )}

        {aiRevealed && !spotlight && (
          <p className="text-center text-[var(--text-hint)] text-xs mt-3">
            tap any card to see the AI's reasoning
          </p>
        )}

        {/* Score grid */}
        {showScore && hostPositions && (
          <div className="mt-6" style={{ animation: 'grillFadeUp 0.5s ease' }}>
            <div className="text-center mb-3">
              <span className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase tracking-widest">
                Hosts vs AI
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FUNCTIONS.map(fn => {
                const hostZone = getZone(hostPositions[fn.id])
                const aiZone = getZone(AI_DEFAULTS[fn.id].pos)
                const diff = Math.abs(hostPositions[fn.id] - AI_DEFAULTS[fn.id].pos)
                const match = hostZone.id === aiZone.id
                const close = !match && diff < 0.143
                const emoji = match ? '✅' : close ? '🟡' : '❌'
                const isSelected = spotlight === fn.id

                return (
                  <div
                    key={fn.id}
                    onClick={() => setSpotlight(prev => prev === fn.id ? null : fn.id)}
                    className="rounded-xl p-3 cursor-pointer transition-all"
                    style={{
                      background: isSelected ? 'rgba(217,78,42,0.08)' : 'var(--bg-subtle)',
                      border: isSelected ? '1px solid rgba(217,78,42,0.3)' : '1px solid var(--border-subtle)',
                    }}
                  >
                    <div className="text-base mb-1">{emoji}</div>
                    <div className="text-[11px] font-bold text-[var(--text-primary)] mb-1 leading-tight">
                      {fn.icon} {fn.name}
                    </div>
                    <div className="text-[10px] text-[var(--text-tertiary)]">You: {hostZone.label}</div>
                    <div className="text-[10px]" style={{ color: '#D94E2A' }}>AI: {aiZone.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="h-16" />
      </div>

      <style>{`
        @keyframes grillFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes grillShimmer {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
        @keyframes grillSizzle {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50%       { transform: translateX(-50%) translateY(-1.5px); }
        }
        .grill-shimmer { animation: grillShimmer 3s ease-in-out infinite; }
        .card-sizzle   { animation: grillSizzle 0.35s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
