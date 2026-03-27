import React, { useState, useRef, useEffect, useCallback } from 'react'

// ─── Functions ─────────────────────────────────────────────────────────────────

const FUNCTIONS = [
  { id: 'strategic',  name: 'Strategic Finance',             icon: '🏦' },
  { id: 'treasury',   name: 'Treasury',                      icon: '💰' },
  { id: 'payroll',    name: 'Payroll',                       icon: '💸' },
  { id: 'audit',      name: 'Internal Audit',                icon: '🔍' },
  { id: 'accounting', name: 'Accounting & Financial Reporting', icon: '📊' },
  { id: 'ar',         name: 'AR',                            icon: '📥' },
  { id: 'fpa',        name: 'FP&A',                          icon: '📈' },
  { id: 'ap',         name: 'AP',                            icon: '📤' },
  { id: 'tax',        name: 'Tax',                           icon: '🧮' },
  { id: 'ir',         name: 'Investor Relations',            icon: '🤝' },
]

// ─── AI Defaults ───────────────────────────────────────────────────────────────

const AI_DEFAULTS = {
  strategic:  { pos: 0.07, label: 'Raw',        temp: '115°F', explanation: "Strategic finance is the least cooked function. AI is a useful research and drafting assistant here, but the actual work — making bets, building conviction, managing board relationships, structuring deals — is deeply human. This function gets augmented slowly over a long horizon, not disrupted." },
  treasury:   { pos: 0.30, label: 'Medium Rare', temp: '129°F', explanation: "Treasury is bifurcated. The operational layer (cash positioning, payment execution, reconciliation) is getting well automated. The strategic layer (hedging, capital structure, liquidity strategy) remains very human. Sits at medium rare today but will move to medium as cash forecasting AI matures." },
  payroll:    { pos: 0.64, label: 'Medium Well', temp: '155°F', explanation: "Payroll is a paradox — the core work is highly automatable but regulatory sensitivity is the highest of any finance function. Error consequences are severe (employee trust, tax penalties, legal liability). AI is accelerating payroll processing and exception flagging significantly, but full autonomy is unlikely in the near term." },
  audit:      { pos: 0.19, label: 'Rare',        temp: '122°F', explanation: "Internal audit is one of the slower-moving functions. AI is genuinely useful for continuous transaction monitoring and anomaly detection — that part is getting cooked. But the judgment-heavy risk assessment and the institutional irony of automating the control function mean human auditors persist. The role evolves more than it disappears." },
  accounting: { pos: 0.50, label: 'Medium',      temp: '140°F', explanation: "Accounting is in an interesting middle zone. The high-volume mechanical work (recs, intercompany, standard entries) is getting automated meaningfully. But the close process involves enough judgment and enough audit scrutiny that full AI autonomy is years away. Controllers aren't going anywhere — their teams are getting smaller and faster." },
  ar:         { pos: 0.73, label: 'Well Done',   temp: '163°F', explanation: "AR is nearly as cooked as AP. Cash application is largely solved by AI today. Collections sequencing and dunning automation are well-developed. The gap vs AP is that customer relationships in collections occasionally require human discretion, and dispute resolution has more variability." },
  fpa:        { pos: 0.33, label: 'Medium Rare', temp: '131°F', explanation: "FP&A is getting meaningful AI augmentation — faster data aggregation, better forecast modeling, automated variance commentary — but the core value of FP&A is business judgment and influence, not data processing. AI makes FP&A analysts faster and better, it doesn't replace them. The Excel pain will largely go away; the strategic layer won't." },
  ap:         { pos: 0.82, label: 'Well Done',   temp: '174°F', explanation: "AP is the most disrupted finance function today. The tooling is mature, the ROI is obvious, and the work is almost entirely automatable. Any company still doing AP manually at scale is behind. The only reason it's not universally burnt is that mid-market ERP fragmentation slows full deployment." },
  tax:        { pos: 0.33, label: 'Medium Rare', temp: '131°F', explanation: "Tax is bifurcated like treasury. Compliance and transactional tax is well-tooled (Thomson Reuters, Avalara, Taxjar) and that work is getting cooked fast. But tax positions, transfer pricing, and advisory require significant human judgment — and the regulatory stakes are too high for full AI autonomy. Compliance cooking, advisory not." },
  ir:         { pos: 0.10, label: 'Raw',          temp: '117°F', explanation: "Investor Relations is almost entirely relationship and narrative driven — earnings calls, investor meetings, buy-side relationships, board communication. AI helps with earnings prep and peer benchmarking. But the core function is irreducibly human. This one barely registers on the grill." },
}

// ─── Zones ────────────────────────────────────────────────────────────────────

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
  raw:   { bg: 'rgba(10,25,45,0.92)',  border: 'rgba(68,170,255,0.45)',  color: '#44aaff', shadow: '0 4px 20px rgba(68,170,255,0.12)' },
  rare:  { bg: 'rgba(30,10,20,0.92)',  border: 'rgba(255,150,170,0.45)', color: '#ff99bb', shadow: 'none' },
  medr:  { bg: 'rgba(38,16,5,0.92)',   border: 'rgba(255,160,100,0.5)',  color: '#ffaa77', shadow: 'none' },
  med:   { bg: 'rgba(38,20,0,0.92)',   border: 'rgba(240,160,48,0.6)',   color: '#F0A030', shadow: '0 4px 20px rgba(240,160,0,0.15)' },
  medw:  { bg: 'rgba(32,12,0,0.92)',   border: 'rgba(255,153,0,0.7)',    color: '#ff9900', shadow: '0 4px 24px rgba(255,120,0,0.2)' },
  well:  { bg: 'rgba(26,8,0,0.94)',    border: 'rgba(217,78,42,0.85)',   color: '#D94E2A', shadow: '0 4px 30px rgba(217,78,42,0.35)' },
  burnt: { bg: 'rgba(15,3,0,0.96)',    border: 'rgba(255,50,0,0.9)',     color: '#ff3322', shadow: '0 4px 40px rgba(255,40,0,0.45)' },
}

// ─── Full Analysis Data ────────────────────────────────────────────────────────

const ANALYSIS = {
  ap: {
    donenessNote: '🔥 Well Done — borderline Burnt',
    criteria: [
      { label: 'Implementation Ease',    score: 5, positive: true,  justification: 'Invoices are structured data, workflows are linear, 3-way matching is rules-based' },
      { label: 'Volume & Manual Pain',   score: 5, positive: true,  justification: 'High transaction volume, repetitive processing, massive manual toil in mid-market and enterprise' },
      { label: 'Existing AI Solutions',  score: 5, positive: true,  justification: 'Most mature AI market in finance — Tipalti, Stampli, Zip, Coupa, Bill.com all have strong AI layers' },
      { label: 'Human Judgment Needed',  score: 1, positive: false, justification: 'Exceptions aside, the vast majority of AP work is mechanical matching and routing' },
      { label: 'Regulatory Sensitivity', score: 2, positive: false, justification: 'Tax compliance on invoices matters but it\'s well-understood and tooling handles it' },
    ],
    summary: 'AP is the most disrupted finance function today. The tooling is mature, the ROI is obvious, and the work is almost entirely automatable. Any company still doing AP manually at scale is behind. The only reason it\'s not universally burnt is that mid-market ERP fragmentation slows full deployment.',
  },
  ar: {
    donenessNote: '🔥 Well Done',
    criteria: [
      { label: 'Implementation Ease',    score: 4, positive: true,  justification: 'Collections workflows and cash application are structured; dispute management less so' },
      { label: 'Volume & Manual Pain',   score: 5, positive: true,  justification: 'High volume, painful collections process, significant manual cash matching effort' },
      { label: 'Existing AI Solutions',  score: 4, positive: true,  justification: 'Strong market — HighRadius, Billtrust, Tesorio — cash application AI is very mature' },
      { label: 'Human Judgment Needed',  score: 2, positive: false, justification: 'Collections escalations and dispute resolution require some judgment, but core work doesn\'t' },
      { label: 'Regulatory Sensitivity', score: 2, positive: false, justification: 'Low — some revenue recognition nuance but nothing that blocks AI deployment' },
    ],
    summary: 'AR is nearly as cooked as AP. Cash application is largely solved by AI today. Collections sequencing and dunning automation are well-developed. The gap vs AP is that customer relationships in collections occasionally require human discretion, and dispute resolution has more variability.',
  },
  payroll: {
    donenessNote: '🟠 Medium Well',
    criteria: [
      { label: 'Implementation Ease',    score: 3, positive: true,  justification: 'Core payroll calc is structured but multi-jurisdiction, benefits complexity, and edge cases create real friction' },
      { label: 'Volume & Manual Pain',   score: 4, positive: true,  justification: 'High repeatability, but runs in cycles not continuously — pain is real especially for global payroll' },
      { label: 'Existing AI Solutions',  score: 3, positive: true,  justification: 'Rippling, Deel, Workday Payroll have AI features but true end-to-end AI payroll is still maturing' },
      { label: 'Human Judgment Needed',  score: 2, positive: false, justification: 'Mostly mechanical but exceptions (garnishments, equity comp, terminations) require human review' },
      { label: 'Regulatory Sensitivity', score: 5, positive: false, justification: 'This is the ceiling. Tax law, labor law, multi-jurisdiction complexity, and zero-error tolerance make orgs extremely cautious' },
    ],
    summary: 'Payroll is a paradox — the core work is highly automatable but regulatory sensitivity is the highest of any finance function. Error consequences are severe (employee trust, tax penalties, legal liability). AI is accelerating payroll processing and exception flagging significantly, but full autonomy is unlikely in the near term. Humans stay in the loop.',
  },
  fpa: {
    donenessNote: '🔴 Medium Rare',
    criteria: [
      { label: 'Implementation Ease',    score: 2, positive: true,  justification: 'Data is semi-structured at best — planning inputs come from dozens of sources, models are bespoke, assumptions are narrative-driven' },
      { label: 'Volume & Manual Pain',   score: 3, positive: true,  justification: 'Budget cycles and forecasts repeat but the actual work is highly variable; pain is real (Excel hell) but volume isn\'t the issue' },
      { label: 'Existing AI Solutions',  score: 3, positive: true,  justification: 'Anaplan, Pigment, Mosaic, Cube are making strides — AI-assisted forecasting is real but AI-driven FP&A is not' },
      { label: 'Human Judgment Needed',  score: 5, positive: false, justification: 'FP&A is fundamentally a judgment function — business partnering, scenario framing, narrative, and influence are core to the role' },
      { label: 'Regulatory Sensitivity', score: 2, positive: false, justification: 'Low direct regulatory sensitivity — internal function with no external reporting mandate' },
    ],
    summary: 'FP&A is getting meaningful AI augmentation — faster data aggregation, better forecast modeling, automated variance commentary — but the core value of FP&A is business judgment and influence, not data processing. AI makes FP&A analysts faster and better, it doesn\'t replace them. The Excel pain will largely go away; the strategic layer won\'t.',
  },
  strategic: {
    donenessNote: '⚫ Raw',
    criteria: [
      { label: 'Implementation Ease',    score: 1, positive: true,  justification: 'Highly unstructured — M&A diligence, capital allocation, investor narratives are bespoke by nature' },
      { label: 'Volume & Manual Pain',   score: 1, positive: true,  justification: 'Low volume, low repeatability — every deal, raise, or strategic decision is unique' },
      { label: 'Existing AI Solutions',  score: 2, positive: true,  justification: 'AI assists with comp analysis, data rooms, and memo drafting but no one is automating this function' },
      { label: 'Human Judgment Needed',  score: 5, positive: false, justification: 'Arguably the highest judgment function in all of finance — relationships, conviction, and strategic framing are the product' },
      { label: 'Regulatory Sensitivity', score: 3, positive: false, justification: 'SEC considerations, material non-public information handling, and disclosure rules add friction' },
    ],
    summary: 'Strategic finance is the least cooked function. AI is a useful research and drafting assistant here, but the actual work — making bets, building conviction, managing board relationships, structuring deals — is deeply human. This function gets augmented slowly over a long horizon, not disrupted.',
  },
  treasury: {
    donenessNote: '🟡 Medium Rare — approaching Medium',
    criteria: [
      { label: 'Implementation Ease',    score: 3, positive: true,  justification: 'Cash positioning and forecasting are structured; investment decisions and risk management are not' },
      { label: 'Volume & Manual Pain',   score: 3, positive: true,  justification: 'Daily cash management is repetitive but the higher-value work is episodic and judgment-driven' },
      { label: 'Existing AI Solutions',  score: 3, positive: true,  justification: 'Kyriba, HighRadius Treasury, FIS have AI features — cash forecasting AI is decent, risk management AI is early' },
      { label: 'Human Judgment Needed',  score: 4, positive: false, justification: 'Interest rate decisions, FX hedging strategy, counterparty risk — these are high-stakes judgment calls' },
      { label: 'Regulatory Sensitivity', score: 4, positive: false, justification: 'Bank relationships, investment policy compliance, and financial instrument regulations create real guardrails' },
    ],
    summary: 'Treasury is bifurcated. The operational layer (cash positioning, payment execution, reconciliation) is getting well automated. The strategic layer (hedging, capital structure, liquidity strategy) remains very human. Net net it sits at medium rare today but will move to medium as cash forecasting AI matures.',
  },
  accounting: {
    donenessNote: '🟡 Medium',
    criteria: [
      { label: 'Implementation Ease',    score: 3, positive: true,  justification: 'Journal entries and reconciliations are structured but close processes involve significant judgment around accruals and estimates' },
      { label: 'Volume & Manual Pain',   score: 4, positive: true,  justification: 'Month-end close is grueling, repetitive, and high-volume — one of the biggest pain points in all of finance' },
      { label: 'Existing AI Solutions',  score: 3, positive: true,  justification: 'BlackLine, Workiva, and ERP AI layers are maturing — reconciliation AI is solid, close management AI is improving' },
      { label: 'Human Judgment Needed',  score: 3, positive: false, justification: 'Routine entries are mechanical but estimates, accruals, and GAAP application judgment require real expertise' },
      { label: 'Regulatory Sensitivity', score: 4, positive: false, justification: 'GAAP/IFRS compliance, audit readiness, and financial statement accuracy mean humans stay close to the close' },
    ],
    summary: 'Accounting is in an interesting middle zone. The high-volume mechanical work (recs, intercompany, standard entries) is getting automated meaningfully. But the close process involves enough judgment and enough audit scrutiny that full AI autonomy is years away. Controllers aren\'t going anywhere — their teams are getting smaller and faster.',
  },
  audit: {
    donenessNote: '🔴 Rare — approaching Medium Rare',
    criteria: [
      { label: 'Implementation Ease',    score: 2, positive: true,  justification: 'Audit programs are somewhat structured but sampling, risk assessment, and testing require contextual judgment' },
      { label: 'Volume & Manual Pain',   score: 3, positive: true,  justification: 'Annual cycles with repetitive testing — but the actual work varies by area and risk profile' },
      { label: 'Existing AI Solutions',  score: 3, positive: true,  justification: 'AuditBoard, Workiva, and emerging AI audit tools are growing — continuous monitoring AI is real' },
      { label: 'Human Judgment Needed',  score: 4, positive: false, justification: 'Risk prioritization, control assessment, and findings communication require significant professional judgment' },
      { label: 'Regulatory Sensitivity', score: 5, positive: false, justification: 'Internal audit\'s entire purpose is compliance and controls — it is the regulatory function, which creates irony around AI adoption' },
    ],
    summary: 'Internal audit is one of the slower-moving functions. AI is genuinely useful for continuous transaction monitoring and anomaly detection — that part is getting cooked. But the judgment-heavy risk assessment and the institutional irony of automating the control function mean human auditors persist. The role evolves more than it disappears.',
  },
  tax: {
    donenessNote: '🔴 Medium Rare',
    criteria: [
      { label: 'Implementation Ease',    score: 2, positive: true,  justification: 'Structured for compliance and transactional tax; advisory and planning work is highly bespoke by nature' },
      { label: 'Volume & Manual Pain',   score: 4, positive: true,  justification: 'High volume especially for compliance filings, sales tax, and indirect tax — painful at scale' },
      { label: 'Existing AI Solutions',  score: 4, positive: true,  justification: 'Thomson Reuters, Avalara, Taxjar, and Vertex have mature compliance tooling — advisory AI is early' },
      { label: 'Human Judgment Needed',  score: 4, positive: false, justification: 'Tax positions, transfer pricing, and planning require significant professional judgment and accountability' },
      { label: 'Regulatory Sensitivity', score: 5, positive: false, justification: 'Every dollar is regulated. Multi-jurisdiction complexity, audit exposure, and legal liability create maximum caution' },
    ],
    summary: 'Tax is bifurcated like Treasury. Compliance and transactional tax is well-tooled and that work is getting cooked fast. But tax positions, transfer pricing, and advisory require significant human judgment — and the regulatory stakes are too high for full AI autonomy. Compliance cooking, advisory not.',
  },
  ir: {
    donenessNote: '⚫ Raw',
    criteria: [
      { label: 'Implementation Ease',    score: 1, positive: true,  justification: 'Entirely relationship and narrative driven — highly unstructured, no repeatable data workflow to automate' },
      { label: 'Volume & Manual Pain',   score: 2, positive: true,  justification: 'Quarterly earnings cycles, investor meetings, but not high volume — the work is episodic and high-touch' },
      { label: 'Existing AI Solutions',  score: 2, positive: true,  justification: 'Some earnings prep tools and peer benchmarking AI, but no one is automating the core IR function' },
      { label: 'Human Judgment Needed',  score: 5, positive: false, justification: 'Almost entirely relationship and conviction driven — managing the investor narrative is an art form, not a workflow' },
      { label: 'Regulatory Sensitivity', score: 4, positive: false, justification: 'SEC regulations, Reg FD, material non-public information handling, and disclosure rules create significant guardrails' },
    ],
    summary: 'Investor Relations is almost entirely relationship and narrative driven — earnings calls, investor meetings, buy-side relationships, board communication. AI helps with earnings prep and peer benchmarking. But the core function is irreducibly human. This one barely registers on the grill.',
  },
}

const SUMMARY_SCORECARD = [
  { id: 'ap',        rating: 'Most disrupted today' },
  { id: 'ar',        rating: 'Close behind AP' },
  { id: 'payroll',   rating: 'Regulatory ceiling holds it back' },
  { id: 'accounting',rating: 'Bifurcated — ops yes, judgment no' },
  { id: 'tax',       rating: 'Compliance cooking, advisory not' },
  { id: 'treasury',  rating: 'Operational layer cooking fast' },
  { id: 'fpa',       rating: 'Augmented not replaced' },
  { id: 'audit',     rating: 'Monitoring yes, judgment no' },
  { id: 'ir',        rating: 'Relationship-driven, AI-assisted' },
  { id: 'strategic', rating: 'Least cooked by far' },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getZone(pos) {
  return ZONES.find(z => pos >= z.start && pos < z.end) || ZONES[ZONES.length - 1]
}

function getCurrentQuarter() {
  const now = new Date()
  const q = Math.ceil((now.getMonth() + 1) / 3)
  return { key: `q${q}_${now.getFullYear()}`, label: `Q${q} ${now.getFullYear()}` }
}

function getQuarterLabel(key) {
  const m = key.match(/q(\d)_(\d{4})/)
  return m ? `Q${m[1]} ${m[2]}` : key
}

function loadSavedQuarters() {
  try { return JSON.parse(localStorage.getItem('fic_grill_quarters') || '{}') } catch { return {} }
}

// ─── Fire Canvas ───────────────────────────────────────────────────────────────

function useFireCanvas(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const particles = []
    let animId
    function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    function newP() {
      return { x: Math.random() * canvas.width, y: canvas.height, vx: (Math.random() - 0.5) * 1.5, vy: -(Math.random() * 3 + 1.5), size: Math.random() * 12 + 4, life: 1, decay: Math.random() * 0.015 + 0.008, isEmber: Math.random() < 0.3 }
    }
    function draw() {
      animId = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (particles.length < 70) particles.push(newP())
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx; p.y += p.vy; p.life -= p.decay; p.size *= 0.993
        if (p.life <= 0) { particles.splice(i, 1); continue }
        if (p.isEmber) {
          ctx.save(); ctx.globalAlpha = p.life * 0.9; ctx.fillStyle = p.life > 0.5 ? '#ffcc00' : '#ff6600'
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore()
        } else {
          const hue = p.life > 0.6 ? 40 : p.life > 0.3 ? 20 : 0
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
          g.addColorStop(0, `hsla(${hue},100%,70%,${p.life * 0.9})`); g.addColorStop(0.5, `hsla(${hue - 10},100%,50%,${p.life * 0.5})`); g.addColorStop(1, `hsla(${hue - 20},100%,30%,0)`)
          ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.restore()
        }
      }
    }
    resize(); draw()
    const ro = new ResizeObserver(resize); ro.observe(canvas)
    return () => { cancelAnimationFrame(animId); ro.disconnect() }
  }, [canvasRef])
}

// ─── Score Dots ────────────────────────────────────────────────────────────────

function ScoreDots({ score, positive }) {
  const activeColor = positive ? '#D94E2A' : '#44aaff'
  const inactiveColor = 'rgba(255,255,255,0.1)'
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="rounded-full" style={{ width: 10, height: 10, background: i <= score ? activeColor : inactiveColor, boxShadow: i <= score ? `0 0 6px ${activeColor}88` : 'none' }} />
      ))}
    </div>
  )
}

// ─── Component ─────────────────────────────────────────────────────────────────

const initPositions = () => Object.fromEntries(FUNCTIONS.map(fn => [fn.id, 0.5]))

export default function TheGrill() {
  const [positions, setPositions] = useState(initPositions)
  const [revealedIds, setRevealedIds] = useState([])       // ordered list of AI-revealed function IDs
  const [hostPositions, setHostPositions] = useState(null) // saved when first reveal happens
  const [showScore, setShowScore] = useState(false)
  const [spotlight, setSpotlight] = useState(null)
  const [isResetting, setIsResetting] = useState(false)
  const [savedQuarters, setSavedQuarters] = useState(loadSavedQuarters)
  const [saveFlash, setSaveFlash] = useState(false)
  const [expandedAnalysis, setExpandedAnalysis] = useState(null)

  const grillRef = useRef(null)
  const canvasRef = useRef(null)
  const dragRef = useRef(null)

  useFireCanvas(canvasRef)

  const anyRevealed = revealedIds.length > 0
  const allRevealed = revealedIds.length === FUNCTIONS.length

  // ── Drag ──
  const handlePointerDown = useCallback((e, id) => {
    if (revealedIds.includes(id)) {
      setSpotlight(prev => prev === id ? null : id)
      return
    }
    dragRef.current = { id, startX: e.clientX, startPos: positions[id] }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }, [revealedIds, positions])

  const handlePointerMove = useCallback((e, id) => {
    if (!dragRef.current || dragRef.current.id !== id) return
    const grill = grillRef.current
    if (!grill) return
    const dx = e.clientX - dragRef.current.startX
    const newPos = Math.max(0.03, Math.min(0.97, dragRef.current.startPos + dx / grill.offsetWidth))
    setPositions(prev => ({ ...prev, [id]: newPos }))
  }, [])

  const handlePointerUp = useCallback(() => { dragRef.current = null }, [])

  // ── Cheat: reveal one at a time ──
  const handleCheat = useCallback(() => {
    const nextFn = FUNCTIONS.find(fn => !revealedIds.includes(fn.id))
    if (!nextFn) return
    if (!anyRevealed) setHostPositions({ ...positions })
    setRevealedIds(prev => [...prev, nextFn.id])
    setPositions(prev => ({ ...prev, [nextFn.id]: AI_DEFAULTS[nextFn.id].pos }))
    setSpotlight(nextFn.id)
    if (revealedIds.length + 1 === FUNCTIONS.length) setTimeout(() => setShowScore(true), 1400)
  }, [revealedIds, positions, anyRevealed])

  // ── Show All ──
  const handleShowAll = useCallback(() => {
    if (allRevealed) return
    if (!anyRevealed) setHostPositions({ ...positions })
    const unrevealed = FUNCTIONS.filter(fn => !revealedIds.includes(fn.id))
    const newIds = [...revealedIds]
    unrevealed.forEach((fn, i) => {
      const delay = i * 160 + Math.random() * 60
      setTimeout(() => {
        setRevealedIds(prev => [...prev, fn.id])
        setPositions(prev => ({ ...prev, [fn.id]: AI_DEFAULTS[fn.id].pos }))
      }, delay)
      newIds.push(fn.id)
    })
    setTimeout(() => {
      setSpotlight(unrevealed[0]?.id || FUNCTIONS[0].id)
      setShowScore(true)
    }, unrevealed.length * 160 + 1400)
  }, [revealedIds, positions, anyRevealed, allRevealed])

  // ── Reset ──
  const handleReset = useCallback(() => {
    setIsResetting(true)
    setRevealedIds([])
    setShowScore(false)
    setSpotlight(null)
    setHostPositions(null)
    setPositions(initPositions())
    setTimeout(() => setIsResetting(false), 600)
  }, [])

  // ── Save Quarter ──
  const handleSaveQuarter = useCallback(() => {
    const q = getCurrentQuarter()
    const updated = { ...savedQuarters, [q.key]: { positions: { ...positions }, hostPositions: hostPositions ? { ...hostPositions } : null, anyRevealed, savedAt: new Date().toISOString() } }
    setSavedQuarters(updated)
    localStorage.setItem('fic_grill_quarters', JSON.stringify(updated))
    setSaveFlash(true)
    setTimeout(() => setSaveFlash(false), 1500)
  }, [positions, hostPositions, anyRevealed, savedQuarters])

  const handleDeleteQuarter = useCallback((key) => {
    const updated = { ...savedQuarters }; delete updated[key]
    setSavedQuarters(updated)
    localStorage.setItem('fic_grill_quarters', JSON.stringify(updated))
  }, [savedQuarters])

  const currentQ = getCurrentQuarter()
  const savedKeys = Object.keys(savedQuarters).sort()
  const spotlightFn = spotlight ? FUNCTIONS.find(f => f.id === spotlight) : null
  const spotlightAI = spotlight ? AI_DEFAULTS[spotlight] : null
  const cheatCount = revealedIds.length

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="w-full px-2 sm:px-4 py-5">

        {/* Header */}
        <div className="text-center mb-5">
          <h2 className="font-russo text-xl sm:text-3xl tracking-wide mb-1.5 leading-tight">
            <span className="text-[var(--text-primary)]">how much is </span>
            <span className="text-[#D94E2A]">AI cooking</span>
            <span className="text-[var(--text-primary)]"> the </span>
            <span className="text-[#F0A030]">finance function?</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm">
            {anyRevealed ? 'Click a revealed card to see the AI\'s reasoning · unrevealed cards still draggable' : 'Drag each card to rate how cooked it is — then reveal the AI\'s take'}
          </p>
        </div>

        {/* Zone labels */}
        <div className="grid grid-cols-7 gap-px mb-1.5">
          {ZONES.map(z => (
            <div key={z.id} className="text-center px-0.5 py-1">
              <div className="text-[8px] sm:text-[11px] font-bold tracking-wider uppercase leading-tight" style={{ color: z.color }}>
                {z.emoji && <span>{z.emoji} </span>}{z.label}
              </div>
            </div>
          ))}
        </div>

        {/* Grill */}
        <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 24px 80px rgba(0,0,0,0.65)' }}>
          <div ref={grillRef} className="relative w-full" style={{ background: 'linear-gradient(90deg,#0a1520 0%,#111215 12%,#1f0e06 25%,#3d1a04 38%,#6b2c00 52%,#9b4000 65%,#c05500 78%,#200400 91%,#0d0100 100%)', padding: '10px 0' }}>
            <canvas ref={canvasRef} className="absolute top-0 right-0 h-full pointer-events-none" style={{ width: '28%', zIndex: 5 }} />
            <div className="absolute top-0 right-0 h-full pointer-events-none grill-shimmer" style={{ width: '42%', background: 'linear-gradient(90deg,transparent,rgba(255,80,0,0.05))', zIndex: 4 }} />
            {ZONES.slice(1).map(z => (
              <div key={z.id} className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${z.start * 100}%`, width: '1px', background: 'rgba(255,255,255,0.04)', zIndex: 2 }} />
            ))}

            {FUNCTIONS.map((fn) => {
              const pos = positions[fn.id]
              const zone = getZone(pos)
              const cs = CARD_STYLES[zone.id]
              const isRevealed = revealedIds.includes(fn.id)
              const isSpotlit = spotlight === fn.id
              const isSizzling = zone.id === 'well' || zone.id === 'burnt'
              let cardTransition = ''
              if (isResetting) cardTransition = 'left 0.5s ease'
              else if (isRevealed) cardTransition = 'left 1.2s cubic-bezier(0.34,1.56,0.64,1)'

              return (
                <div key={fn.id} className="relative flex items-center" style={{ height: '56px', margin: '2px 0', zIndex: 6 }}>
                  <div className="absolute inset-x-0" style={{ height: '8px', top: '50%', transform: 'translateY(-50%)', background: 'linear-gradient(180deg,rgba(255,255,255,0.07) 0%,rgba(140,140,140,0.45) 20%,rgba(70,70,70,0.75) 55%,rgba(30,30,30,0.85) 85%)', borderRadius: '4px', boxShadow: '0 3px 8px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.1)', zIndex: 1 }} />
                  <div
                    className={`absolute flex items-center gap-2 rounded-xl select-none${isSizzling && isRevealed ? ' card-sizzle' : ''}${isRevealed ? ' cursor-pointer' : ' cursor-grab'}`}
                    style={{ left: `${pos * 100}%`, transform: 'translateX(-50%)', height: '44px', minWidth: '115px', maxWidth: '170px', padding: '0 10px', background: cs.bg, border: `1.5px solid ${isSpotlit ? cs.color : isRevealed ? cs.border : 'rgba(255,255,255,0.12)'}`, boxShadow: isSpotlit ? `${cs.shadow},0 0 0 2px ${cs.color}44` : isRevealed ? cs.shadow : 'none', backdropFilter: 'blur(12px)', zIndex: isSpotlit ? 20 : 10, transition: cardTransition || undefined, opacity: isRevealed ? 1 : 0.85 }}
                    onPointerDown={(e) => handlePointerDown(e, fn.id)}
                    onPointerMove={(e) => handlePointerMove(e, fn.id)}
                    onPointerUp={handlePointerUp}
                  >
                    <span style={{ fontSize: '15px', flexShrink: 0 }}>{fn.icon}</span>
                    <span className="font-bold text-[11px] whitespace-nowrap flex-1 min-w-0 truncate" style={{ color: isRevealed ? cs.color : 'var(--text-secondary)' }}>
                      {fn.name}
                    </span>
                    {isRevealed && <span style={{ width: 6, height: 6, borderRadius: '50%', background: cs.color, flexShrink: 0, boxShadow: `0 0 6px ${cs.color}` }} />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {!anyRevealed && (
          <p className="text-center text-[var(--text-hint)] text-xs mt-2 tracking-wide">← drag left for less cooked · drag right for more →</p>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <button onClick={handleReset}
            className="px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            style={{ border: '1px solid var(--border-default)' }}>
            ↺ Reset
          </button>

          {/* Cheat button */}
          <button onClick={handleCheat} disabled={allRevealed}
            className="px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'rgba(240,160,48,0.12)', color: '#F0A030', border: '1px solid rgba(240,160,48,0.35)' }}>
            🎯 Cheat {cheatCount > 0 && !allRevealed ? `(${cheatCount}/${FUNCTIONS.length})` : ''}
          </button>

          {/* Show All button */}
          <button onClick={handleShowAll} disabled={allRevealed}
            className="px-5 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all disabled:cursor-not-allowed"
            style={{ background: allRevealed ? 'var(--bg-subtle)' : 'linear-gradient(135deg,#D94E2A,#8b1a00)', color: allRevealed ? 'var(--text-tertiary)' : '#fff', boxShadow: allRevealed ? 'none' : '0 8px 30px rgba(217,78,42,0.35)', border: 'none', opacity: allRevealed ? 0.6 : 1 }}>
            {allRevealed ? '✅ All Shown' : anyRevealed ? `🤖 Show Remaining (${FUNCTIONS.length - cheatCount})` : '🤖 Show All'}
          </button>

          <button onClick={handleSaveQuarter}
            className="px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all"
            style={{ background: saveFlash ? 'rgba(240,160,48,0.2)' : 'var(--bg-subtle)', color: saveFlash ? '#F0A030' : 'var(--text-secondary)', border: saveFlash ? '1px solid rgba(240,160,48,0.5)' : '1px solid var(--border-default)', transition: 'all 0.3s' }}>
            {saveFlash ? `✅ ${currentQ.label} Saved!` : `💾 Save ${currentQ.label}`}
          </button>
        </div>

        {/* Spotlight */}
        {anyRevealed && spotlightFn && spotlightAI && (
          <div key={spotlight} className="mt-4 rounded-2xl p-4 sm:p-5" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', animation: 'grillFadeUp 0.3s ease' }}>
            <div className="flex items-start gap-3">
              <span style={{ fontSize: '24px', lineHeight: 1, paddingTop: '2px', flexShrink: 0 }}>{spotlightFn.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-bold text-[var(--text-primary)] text-sm">{spotlightFn.name}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: 'rgba(217,78,42,0.15)', color: '#D94E2A', border: '1px solid rgba(217,78,42,0.3)' }}>
                    🤖 AI: {spotlightAI.label}
                  </span>
                  <span className="text-[var(--text-tertiary)] text-xs font-mono">{spotlightAI.temp}</span>
                </div>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{spotlightAI.explanation}</p>
              </div>
            </div>
          </div>
        )}

        {anyRevealed && !spotlight && (
          <p className="text-center text-[var(--text-hint)] text-xs mt-3">tap a revealed card to see the AI's reasoning</p>
        )}

        {/* Score grid */}
        {showScore && hostPositions && (
          <div className="mt-5" style={{ animation: 'grillFadeUp 0.5s ease' }}>
            <div className="text-center mb-3">
              <span className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase tracking-widest">Hosts vs AI</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {FUNCTIONS.map(fn => {
                const hostZone = getZone(hostPositions[fn.id])
                const aiZone = getZone(AI_DEFAULTS[fn.id].pos)
                const diff = Math.abs(hostPositions[fn.id] - AI_DEFAULTS[fn.id].pos)
                const match = hostZone.id === aiZone.id
                const close = !match && diff < 0.143
                const emoji = match ? '✅' : close ? '🟡' : '❌'
                const isSelected = spotlight === fn.id
                return (
                  <div key={fn.id} onClick={() => { if (revealedIds.includes(fn.id)) setSpotlight(prev => prev === fn.id ? null : fn.id) }}
                    className="rounded-xl p-2.5 transition-all"
                    style={{ background: isSelected ? 'rgba(217,78,42,0.08)' : 'var(--bg-subtle)', border: isSelected ? '1px solid rgba(217,78,42,0.3)' : '1px solid var(--border-subtle)', cursor: revealedIds.includes(fn.id) ? 'pointer' : 'default' }}>
                    <div className="text-sm mb-0.5">{revealedIds.includes(fn.id) ? emoji : '⬜'}</div>
                    <div className="text-[10px] font-bold text-[var(--text-primary)] mb-0.5 leading-tight">{fn.icon} {fn.name}</div>
                    <div className="text-[9px] text-[var(--text-tertiary)]">You: {hostZone.label}</div>
                    <div className="text-[9px]" style={{ color: revealedIds.includes(fn.id) ? '#D94E2A' : 'var(--text-hint)' }}>
                      {revealedIds.includes(fn.id) ? `AI: ${aiZone.label}` : 'Not revealed'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Full Analysis ─────────────────────────────────────────────────── */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">📊 Full Analysis</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          {/* Function analysis cards */}
          <div className="space-y-2">
            {FUNCTIONS.map(fn => {
              const analysis = ANALYSIS[fn.id]
              const aiData = AI_DEFAULTS[fn.id]
              const zone = getZone(aiData.pos)
              const cs = CARD_STYLES[zone.id]
              const isOpen = expandedAnalysis === fn.id

              return (
                <div key={fn.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                  {/* Header — always visible, click to expand */}
                  <button className="w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all hover:bg-[var(--bg-hover)]"
                    style={{ background: isOpen ? 'var(--bg-hover)' : 'var(--bg-subtle)' }}
                    onClick={() => setExpandedAnalysis(isOpen ? null : fn.id)}>
                    <span style={{ fontSize: '20px' }}>{fn.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-[var(--text-primary)] truncate">{fn.name}</div>
                      <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{analysis.donenessNote}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ color: zone.color, background: `${zone.color}18`, border: `1px solid ${zone.color}33` }}>
                        {aiData.label}
                      </span>
                      <span className="text-[var(--text-tertiary)] text-xs">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isOpen && (
                    <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border-subtle)', animation: 'grillFadeUp 0.2s ease' }}>
                      {/* Criteria table */}
                      <div className="mt-4 space-y-3">
                        {analysis.criteria.map((c, i) => (
                          <div key={i} className="grid grid-cols-1 sm:grid-cols-[180px_auto_1fr] gap-1 sm:gap-3 items-start">
                            <div className="flex items-center gap-2">
                              <ScoreDots score={c.score} positive={c.positive} />
                              <span className="text-[11px] font-bold text-[var(--text-secondary)] whitespace-nowrap">{c.label}</span>
                            </div>
                            <div className="hidden sm:flex items-center">
                              <span className="text-[11px] font-mono font-bold" style={{ color: c.positive ? '#D94E2A' : '#44aaff' }}>{c.score}/5</span>
                            </div>
                            <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">{c.justification}</p>
                          </div>
                        ))}
                      </div>

                      {/* Summary paragraph */}
                      <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{analysis.summary}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Summary scorecard */}
          <div className="mt-6 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
            <div className="px-4 py-3" style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Summary Scorecard</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {SUMMARY_SCORECARD.map(item => {
                const fn = FUNCTIONS.find(f => f.id === item.id)
                const aiData = AI_DEFAULTS[item.id]
                const zone = getZone(aiData.pos)
                const analysis = ANALYSIS[item.id]
                return (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{fn.icon}</span>
                    <span className="text-sm font-bold text-[var(--text-primary)] flex-1 min-w-0 truncate">{fn.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ color: zone.color, background: `${zone.color}18`, border: `1px solid ${zone.color}33` }}>
                      {analysis.donenessNote.split(' ').slice(0, 3).join(' ')}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)] hidden sm:block shrink-0 max-w-[200px] text-right">{item.rating}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Saved Quarters ─────────────────────────────────────────────────── */}
        {savedKeys.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[var(--border-subtle)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Saved Quarters</span>
              <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            </div>

            {savedKeys.map(key => {
              const snap = savedQuarters[key]
              return (
                <div key={key} className="mb-4 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="font-bold text-sm text-[var(--text-primary)]">🗓 {getQuarterLabel(key)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--text-tertiary)]">{new Date(snap.savedAt).toLocaleDateString()}</span>
                      <button onClick={() => handleDeleteQuarter(key)} className="text-[10px] text-[var(--text-tertiary)] hover:text-red-400 transition-colors px-1.5 py-0.5 rounded" style={{ border: '1px solid var(--border-subtle)' }}>✕</button>
                    </div>
                  </div>
                  <div className="relative" style={{ background: 'linear-gradient(90deg,#0a1520 0%,#111215 12%,#1f0e06 25%,#3d1a04 38%,#6b2c00 52%,#9b4000 65%,#c05500 78%,#200400 91%,#0d0100 100%)', padding: '8px 0' }}>
                    {ZONES.slice(1).map(z => (
                      <div key={z.id} className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${z.start * 100}%`, width: '1px', background: 'rgba(255,255,255,0.04)', zIndex: 2 }} />
                    ))}
                    {FUNCTIONS.map(fn => {
                      const pos = snap.positions[fn.id] ?? 0.5
                      const zone = getZone(pos)
                      const cs = CARD_STYLES[zone.id]
                      return (
                        <div key={fn.id} className="relative flex items-center" style={{ height: '40px', margin: '2px 0', zIndex: 3 }}>
                          <div className="absolute inset-x-0" style={{ height: '7px', top: '50%', transform: 'translateY(-50%)', background: 'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,rgba(120,120,120,0.4) 30%,rgba(50,50,50,0.7) 70%)', borderRadius: '4px', zIndex: 1 }} />
                          <div className="absolute flex items-center gap-1.5 rounded-lg" style={{ left: `${pos * 100}%`, transform: 'translateX(-50%)', height: '32px', minWidth: '95px', maxWidth: '145px', padding: '0 7px', background: cs.bg, border: `1px solid ${cs.border}`, backdropFilter: 'blur(8px)', zIndex: 10 }}>
                            <span style={{ fontSize: '12px', flexShrink: 0 }}>{fn.icon}</span>
                            <span className="font-bold text-[9px] whitespace-nowrap truncate" style={{ color: cs.color }}>{fn.name}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Progress table */}
            {savedKeys.length >= 2 && (
              <div className="mt-4 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                <div className="px-4 py-3" style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">📈 Progress Over Time</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <th className="text-left px-4 py-2 text-[var(--text-tertiary)] font-bold uppercase tracking-wider text-[10px]">Function</th>
                        {savedKeys.map(key => (
                          <th key={key} className="text-center px-3 py-2 text-[var(--text-tertiary)] font-bold uppercase tracking-wider text-[10px]">{getQuarterLabel(key)}</th>
                        ))}
                        <th className="text-center px-3 py-2 text-[var(--text-tertiary)] font-bold uppercase tracking-wider text-[10px]">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FUNCTIONS.map(fn => {
                        const qPos = savedKeys.map(k => savedQuarters[k].positions[fn.id] ?? 0.5)
                        const delta = qPos[qPos.length - 1] - qPos[0]
                        const trend = Math.abs(delta) < 0.05 ? '→ Stable' : delta > 0 ? '🔥 Getting cooked' : '❄️ Cooling off'
                        return (
                          <tr key={fn.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td className="px-4 py-2.5 font-bold text-[var(--text-primary)]">{fn.icon} {fn.name}</td>
                            {savedKeys.map(key => {
                              const pos = savedQuarters[key].positions[fn.id] ?? 0.5
                              const zone = getZone(pos)
                              return (
                                <td key={key} className="px-3 py-2.5 text-center">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: zone.color, background: `${zone.color}18`, border: `1px solid ${zone.color}33` }}>{zone.label}</span>
                                </td>
                              )
                            })}
                            <td className="px-3 py-2.5 text-center text-[10px] text-[var(--text-secondary)] whitespace-nowrap">{trend}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="h-16" />
      </div>

      <style>{`
        @keyframes grillFadeUp { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes grillShimmer { 0%,100%{opacity:0.5}50%{opacity:1} }
        @keyframes grillSizzle { 0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-1.5px)} }
        .grill-shimmer{animation:grillShimmer 3s ease-in-out infinite}
        .card-sizzle{animation:grillSizzle 0.35s ease-in-out infinite}
      `}</style>
    </div>
  )
}
