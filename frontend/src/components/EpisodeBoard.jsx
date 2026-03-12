import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  FileText,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  Circle,
  CheckCircle2,
  Archive,
  ChevronsUpDown,
  ChevronsDownUp,
  Play,
  Pause,
  RotateCcw,
  Info,
  Timer,
  ExternalLink,
  Check,
  X,
  Loader2,
  Send,
  Lock,
  Unlock,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'

function DetailsExpander({ details }) {
  const [open, setOpen] = useState(false)
  if (!details) return null
  return (
    <div className="w-full max-w-2xl mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider transition-colors"
      >
        <Info size={12} />
        Details
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="mt-3 p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-line">
          {details}
        </div>
      )}
    </div>
  )
}

const VIEW_MODES = [
  { id: 'show', label: 'Show', description: 'Final segments only' },
  { id: 'prep', label: 'Prep', description: 'All segments' },
  { id: 'bank', label: 'Bank', description: 'All proposed across episodes' },
  { id: 'live', label: 'Live', description: 'PTI-style rundown for on-air' },
]

// PTI-style Live rundown — show timer + per-segment elapsed time tracking
function LiveRundown({ segments, activeSegmentIdx, onJumpToSegment, formatTimer: fmt }) {
  // Show timer — counts up from when you hit play
  const [showRunning, setShowRunning] = useState(false)
  const [showElapsed, setShowElapsed] = useState(0)
  const showStartRef = useRef(null)
  const showIntervalRef = useRef(null)

  // Per-segment accumulated time: { [segIdx]: ms }
  const [segElapsed, setSegElapsed] = useState({})
  const segStartRef = useRef(null)
  const segIntervalRef = useRef(null)
  const prevSegRef = useRef(activeSegmentIdx)

  const [expandedLiveSegs, setExpandedLiveSegs] = useState(new Set())

  // Show timer tick
  useEffect(() => {
    if (showRunning) {
      showStartRef.current = Date.now() - showElapsed
      showIntervalRef.current = setInterval(() => {
        setShowElapsed(Date.now() - showStartRef.current)
      }, 100)
    } else {
      if (showIntervalRef.current) clearInterval(showIntervalRef.current)
    }
    return () => { if (showIntervalRef.current) clearInterval(showIntervalRef.current) }
  }, [showRunning])

  // Segment timer — runs while show is running, accumulates per active segment
  useEffect(() => {
    if (showRunning) {
      segStartRef.current = Date.now()
      segIntervalRef.current = setInterval(() => {
        const now = Date.now()
        const delta = now - segStartRef.current
        segStartRef.current = now
        setSegElapsed((prev) => ({
          ...prev,
          [activeSegmentIdx]: (prev[activeSegmentIdx] || 0) + delta,
        }))
      }, 100)
    } else {
      if (segIntervalRef.current) clearInterval(segIntervalRef.current)
    }
    return () => { if (segIntervalRef.current) clearInterval(segIntervalRef.current) }
  }, [showRunning, activeSegmentIdx])

  // When switching segments, restart the segment interval cleanly
  useEffect(() => {
    if (prevSegRef.current !== activeSegmentIdx) {
      segStartRef.current = Date.now()
      prevSegRef.current = activeSegmentIdx
    }
  }, [activeSegmentIdx])

  const toggleShow = () => setShowRunning((v) => !v)
  const resetShow = () => {
    setShowRunning(false)
    setShowElapsed(0)
    setSegElapsed({})
  }

  const toggleExpanded = (segId) => {
    setExpandedLiveSegs((prev) => {
      const next = new Set(prev)
      if (next.has(segId)) next.delete(segId)
      else next.add(segId)
      return next
    })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Show timer bar */}
      <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Timer size={18} className="text-[#D94E2A]" />
          <span className="text-[var(--text-muted)] text-xs uppercase tracking-wider font-bold">
            Show Timer
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-3xl font-bold text-[var(--text-primary)]">
            {fmt(showElapsed)}
          </span>
          <button
            onClick={toggleShow}
            className={`p-2 rounded-lg transition-all ${showRunning ? 'bg-red-500/15 text-[#D94E2A]' : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'}`}
          >
            {showRunning ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={resetShow}
            className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* Segment list */}
      <div className="flex-1 overflow-y-auto">
        {segments.map((seg, idx) => {
          const isActive = idx === activeSegmentIdx
          const isPast = idx < activeSegmentIdx
          const isExpanded = expandedLiveSegs.has(seg.id)
          const elapsed = segElapsed[idx] || 0
          return (
            <div key={seg.id}>
              <div
                className={`w-full text-left px-6 py-3 transition-all border-l-4 flex items-center gap-3
                  ${isActive
                    ? 'bg-[#D94E2A]/10 border-[#D94E2A] text-[var(--text-primary)]'
                    : isPast
                      ? 'border-emerald-500/30 text-[var(--text-muted)] bg-emerald-500/3'
                      : 'border-transparent text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-secondary)]'
                  }`}
              >
                {/* Expand chevron */}
                {seg.slides.length > 0 ? (
                  <button
                    onClick={() => toggleExpanded(seg.id)}
                    className="p-0.5 rounded hover:bg-[var(--bg-hover)] transition-colors flex-shrink-0"
                  >
                    {isExpanded
                      ? <ChevronDown size={12} className="text-[var(--text-muted)]" />
                      : <ChevronRight size={12} className="text-[var(--text-muted)]" />
                    }
                  </button>
                ) : (
                  <span className="w-5" />
                )}

                {/* Segment number */}
                <button
                  onClick={() => onJumpToSegment(idx)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${isActive
                      ? 'bg-[#D94E2A] text-white'
                      : isPast
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                    }`}
                >
                  {isPast ? '✓' : idx + 1}
                </button>

                {/* Segment name */}
                <button
                  onClick={() => onJumpToSegment(idx)}
                  className={`text-sm font-bold flex-1 text-left ${isActive ? 'text-base' : ''} ${isPast ? 'line-through opacity-50' : ''}`}
                >
                  {seg.name}
                </button>

                {/* Per-segment elapsed time */}
                {elapsed > 0 && (
                  <span className={`text-xs font-mono flex-shrink-0 ${isActive ? 'text-[#D94E2A]' : 'text-[var(--text-hint)]'}`}>
                    {fmt(elapsed)}
                  </span>
                )}

                {/* Active indicator */}
                {isActive && showRunning && (
                  <span className="text-[#D94E2A] text-xs font-bold uppercase tracking-widest animate-pulse">
                    LIVE
                  </span>
                )}
                {isActive && !showRunning && (
                  <span className="text-[var(--text-hint)] text-xs font-bold uppercase tracking-widest">
                    NOW
                  </span>
                )}
              </div>

              {/* Expandable slide sub-items */}
              {isExpanded && seg.slides.length > 0 && (
                <div className={`border-l-4 ${isActive ? 'border-[#D94E2A]/30' : isPast ? 'border-emerald-500/10' : 'border-transparent'}`}>
                  {seg.slides.map((slide, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center gap-2 pl-16 pr-6 py-1 text-xs"
                    >
                      <SlideTypeIcon type={slide.type} />
                      <span className={`truncate ${isPast ? 'text-[var(--text-hint)] line-through opacity-40' : 'text-[var(--text-muted)]'}`}>
                        {slide.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SlideRenderer({ slide }) {
  if (slide.type === 'gallery') {
    const images = slide.images || []
    // Auto-pick grid: 2 cols for 4+, otherwise fit in a row
    const cols = images.length >= 4 ? 2 : images.length
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
        <div
          className="grid gap-3 w-full"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {images.map((img, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden border border-[var(--border-default)] shadow-lg bg-[var(--img-border-bg)]"
            >
              <img
                src={img.src}
                alt={img.alt || slide.title}
                className="w-full h-full object-contain max-h-[35vh]"
                draggable={false}
              />
            </div>
          ))}
        </div>
        {slide.notes && (
          <p className="text-[var(--text-tertiary)] text-sm max-w-xl text-center">{slide.notes}</p>
        )}
        <DetailsExpander details={slide.details} />
      </div>
    )
  }

  if (slide.type === 'image') {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="max-h-[60vh] rounded-xl overflow-hidden border border-[var(--border-default)] shadow-2xl">
          <img
            src={slide.src}
            alt={slide.title}
            className="max-h-[60vh] max-w-full object-contain"
            draggable={false}
          />
        </div>
        {slide.notes && (
          <p className="text-[var(--text-tertiary)] text-sm max-w-xl text-center">{slide.notes}</p>
        )}
        <DetailsExpander details={slide.details} />
      </div>
    )
  }

  if (slide.type === 'link') {
    return (
      <div className="max-w-2xl w-full">
        <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-2xl p-8">
          <div className="flex items-start gap-3 mb-4">
            <LinkIcon size={20} className="text-[#4A9FD9] mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-[var(--text-primary)] text-xl font-bold leading-tight">{slide.title}</h3>
              <a
                href={slide.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4A9FD9]/60 text-xs hover:text-[#4A9FD9] transition-colors break-all mt-1 block"
              >
                {slide.url}
              </a>
            </div>
          </div>
          {slide.notes && (
            <p className="text-[var(--text-secondary)] text-base leading-relaxed mt-4 pl-8">
              {slide.notes}
            </p>
          )}
          <DetailsExpander details={slide.details} />
        </div>
      </div>
    )
  }

  if (slide.type === 'text') {
    return (
      <div className="max-w-2xl w-full">
        <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-2xl p-8">
          {slide.bullets && (
            <ul className="space-y-3">
              {slide.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[#D94E2A] mt-1.5 text-xs">&#9679;</span>
                  <span className="text-[var(--text-secondary)] text-lg leading-relaxed">{bullet}</span>
                </li>
              ))}
            </ul>
          )}
          {slide.notes && (
            <p className="text-[var(--text-tertiary)] text-sm mt-6">{slide.notes}</p>
          )}
          <DetailsExpander details={slide.details} />
        </div>
      </div>
    )
  }

  return null
}

function SlideTypeIcon({ type }) {
  if (type === 'gallery') return <ImageIcon size={9} className="text-pink-400/60 flex-shrink-0" />
  if (type === 'image') return <ImageIcon size={9} className="text-purple-400/60 flex-shrink-0" />
  if (type === 'link') return <LinkIcon size={9} className="text-[#4A9FD9]/60 flex-shrink-0" />
  return <FileText size={9} className="text-[var(--text-muted)] flex-shrink-0" />
}

function StatusDot({ status }) {
  if (status === 'final') {
    return <CheckCircle2 size={10} className="text-emerald-400 flex-shrink-0" />
  }
  return <Circle size={10} className="text-yellow-400 flex-shrink-0" />
}

function StatusBadge({ status }) {
  if (status === 'final') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
        Final
      </span>
    )
  }
  return (
    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
      Proposed
    </span>
  )
}

// Proposed Bank — shows all proposed slides across all episodes, grouped by segment
async function sendToProducer(message) {
  try {
    const res = await fetch('/.netlify/functions/slack-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
    const data = await res.json()
    if (!data.ok) throw new Error(data.error || 'Slack send failed')
    return { ok: true }
  } catch (err) {
    console.error('Failed to send to producer:', err)
    return { ok: false, error: err.message }
  }
}

// Sidebar action buttons for Prep/Show segments
function SidebarSegmentActions({ viewMode, episodeId, segmentId, segmentName }) {
  const [sending, setSending] = useState(null)
  const [result, setResult] = useState(null)

  const handleAccept = async () => {
    setSending('accept')
    setResult(null)
    const res = await sendToProducer(`@producer finalize "${segmentName}" in ${episodeId} ${segmentId}`)
    setResult(res)
    setSending(null)
    if (res.ok) setTimeout(() => setResult(null), 3000)
  }

  const handleBacklog = async () => {
    setSending('backlog')
    setResult(null)
    const res = await sendToProducer(`@producer move "${segmentName}" from ${episodeId} ${segmentId} to backlog ${segmentId}`)
    setResult(res)
    setSending(null)
    if (res.ok) setTimeout(() => setResult(null), 3000)
  }

  const handleDelete = async () => {
    setSending('delete')
    setResult(null)
    const res = await sendToProducer(`@producer remove "${segmentName}" from ${episodeId} ${segmentId}`)
    setResult(res)
    setSending(null)
    if (res.ok) setTimeout(() => setResult(null), 3000)
  }

  return (
    <div className="ml-4 px-3 py-2 border-l border-[var(--border-subtle)]">
      <ActionRow
        viewMode={viewMode}
        sending={sending}
        onAccept={handleAccept}
        onBacklog={handleBacklog}
        onDelete={handleDelete}
        result={result}
        showEpPicker={false}
        targetEp={null}
        acceptDisabled={false}
      />
    </div>
  )
}

// Reusable action button row — renders the right buttons based on viewMode
// Bank: Accept + Delete | Prep: Accept + Backlog + Delete | Show: Backlog only
function ActionRow({ viewMode, sending, onAccept, onBacklog, onDelete, result, showEpPicker, targetEp, acceptDisabled }) {
  const showAccept = viewMode === 'bank' || viewMode === 'prep'
  const showBacklog = viewMode === 'prep' || viewMode === 'show'
  const showDelete = viewMode === 'bank' || viewMode === 'prep'

  return (
    <div className="flex items-center gap-2">
      {showAccept && (
        <button
          onClick={onAccept}
          disabled={sending !== null || acceptDisabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                     bg-emerald-500/15 text-emerald-400 border border-emerald-500/20
                     hover:bg-emerald-500/25 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending === 'accept' ? <Loader2 size={12} className="animate-spin" /> : showEpPicker ? <Send size={12} /> : <Check size={12} />}
          {sending === 'accept' ? 'Sending...' : showEpPicker && targetEp ? `Confirm → ${targetEp}` : 'Accept'}
        </button>
      )}
      {showBacklog && (
        <button
          onClick={onBacklog}
          disabled={sending !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                     bg-amber-500/15 text-amber-400 border border-amber-500/20
                     hover:bg-amber-500/25 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending === 'backlog' ? <Loader2 size={12} className="animate-spin" /> : <Archive size={12} />}
          {sending === 'backlog' ? 'Moving...' : 'Backlog'}
        </button>
      )}
      {showDelete && (
        <button
          onClick={onDelete}
          disabled={sending !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                     bg-red-500/15 text-red-400 border border-red-500/20
                     hover:bg-red-500/25 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending === 'delete' ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
          {sending === 'delete' ? 'Deleting...' : 'Delete'}
        </button>
      )}
      {result && (
        <span className={`flex items-center gap-1 text-xs ml-2 ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>
          {result.ok ? <><Send size={10} /> Sent to @producer!</> : `Error: ${result.error}`}
        </span>
      )}
    </div>
  )
}

function VoteButtons({ voteKey, votes, onVote }) {
  const counts = votes[voteKey] || { up: 0, down: 0 }
  const net = counts.up - counts.down

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); onVote(voteKey, 'up') }}
        className="p-1 rounded hover:bg-emerald-500/15 text-[var(--text-hint)] hover:text-emerald-400 transition-all"
        title="Upvote"
      >
        <ThumbsUp size={12} />
      </button>
      <span className={`text-[11px] font-bold min-w-[18px] text-center ${
        net > 0 ? 'text-emerald-400' : net < 0 ? 'text-red-400' : 'text-[var(--text-hint)]'
      }`}>
        {net > 0 ? `+${net}` : net}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onVote(voteKey, 'down') }}
        className="p-1 rounded hover:bg-red-500/15 text-[var(--text-hint)] hover:text-red-400 transition-all"
        title="Downvote"
      >
        <ThumbsDown size={12} />
      </button>
    </div>
  )
}

function ProposedSlideCard({ episode, segment, slide, slideIdx, onSelectSlide, allEpisodes, isAdmin, votes, onVote }) {
  const [sending, setSending] = useState(null)
  const [result, setResult] = useState(null)
  const [targetEp, setTargetEp] = useState(episode.id)
  const [showEpPicker, setShowEpPicker] = useState(false)

  const isBacklog = episode.id === 'backlog'

  const handleAccept = async () => {
    if (!showEpPicker) {
      setShowEpPicker(true)
      if (isBacklog) setTargetEp('')
      return
    }

    if (!targetEp) return

    setSending('accept')
    setResult(null)

    let message
    if (targetEp === episode.id) {
      message = `@producer finalize "${slide.title}" in ${episode.id} ${segment.id}`
    } else {
      message = `@producer move "${slide.title}" from ${episode.id} ${segment.id} to ${targetEp} ${segment.id} and finalize it`
    }

    const res = await sendToProducer(message)
    setResult(res)
    setSending(null)
    setShowEpPicker(false)

    if (res.ok) {
      setTimeout(() => setResult(null), 3000)
    }
  }

  const handleDelete = async () => {
    setSending('delete')
    setResult(null)

    const message = `@producer remove "${slide.title}" from ${episode.id} ${segment.id}`

    const res = await sendToProducer(message)
    setResult(res)
    setSending(null)
    setShowEpPicker(false)

    if (res.ok) {
      setTimeout(() => setResult(null), 3000)
    }
  }

  const handleBacklog = async () => {
    setSending('backlog')
    setResult(null)

    const message = `@producer move "${slide.title}" from ${episode.id} ${segment.id} to backlog ${segment.id}`

    const res = await sendToProducer(message)
    setResult(res)
    setSending(null)

    if (res.ok) {
      setTimeout(() => setResult(null), 3000)
    }
  }

  return (
    <div className="w-full bg-[var(--bg-subtle)] border border-yellow-500/10 rounded-xl p-4 transition-all">
      <button
        onClick={() => onSelectSlide(episode.id, segment.id, slideIdx)}
        className="w-full text-left hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2 mb-1">
          <SlideTypeIcon type={slide.type} />
          <span className="text-[var(--text-primary)] font-bold text-sm">{slide.title}</span>
        </div>
        {slide.notes && (
          <p className="text-[var(--text-muted)] text-xs mt-1 line-clamp-2">{slide.notes}</p>
        )}
        {slide.url && (
          <p className="text-[#4A9FD9]/50 text-[10px] mt-1 truncate">{slide.url}</p>
        )}
      </button>

      <div className="flex items-center gap-2 mt-2 pl-1">
        <VoteButtons
          voteKey={`${episode.id}:${segment.id}:${slideIdx}`}
          votes={votes}
          onVote={onVote}
        />
      </div>

      {isAdmin && <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-[var(--border-subtle)]">
        {showEpPicker && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[var(--text-muted)] text-xs">Assign to:</span>
            <select
              value={targetEp}
              onChange={(e) => setTargetEp(e.target.value)}
              className="px-2 py-1 rounded-lg text-xs bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] outline-none"
            >
              <option value="">Select episode...</option>
              <option value="backlog">Backlog</option>
              {(allEpisodes || []).filter((ep) => ep.id !== 'backlog').map((ep) => (
                <option key={ep.id} value={ep.id}>{ep.title || ep.id}</option>
              ))}
            </select>
            <button
              onClick={() => { setShowEpPicker(false); setTargetEp(episode.id) }}
              className="text-[var(--text-muted)] text-xs hover:text-[var(--text-secondary)] transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        <ActionRow
          viewMode="bank"
          sending={sending}
          onAccept={handleAccept}
          onBacklog={handleBacklog}
          onDelete={handleDelete}
          result={result}
          showEpPicker={showEpPicker}
          targetEp={targetEp}
          acceptDisabled={showEpPicker && !targetEp}
        />
      </div>}
    </div>
  )
}

function ProposedBank({ episodes, onSelectSlide, isAdmin }) {
  const [allEpisodes, setAllEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [votes, setVotes] = useState({})

  useEffect(() => {
    if (episodes.length === 0) return
    setLoading(true)
    Promise.all(
      episodes.map((ep) =>
        fetch(`/episodes/${ep.id}.json`)
          .then((r) => r.json())
          .catch(() => null)
      )
    ).then((results) => {
      setAllEpisodes(results.filter(Boolean))
      setLoading(false)
    })
  }, [episodes])

  // Fetch all votes once episodes are loaded
  useEffect(() => {
    if (allEpisodes.length === 0) return
    Promise.all(
      allEpisodes.map((ep) =>
        fetch(`/.netlify/functions/vote?prefix=${ep.id}`)
          .then((r) => r.json())
          .catch(() => ({}))
      )
    ).then((results) => {
      const merged = {}
      for (const r of results) Object.assign(merged, r)
      setVotes(merged)
    })
  }, [allEpisodes])

  const handleVote = useCallback(async (key, direction) => {
    // Optimistic update
    setVotes((prev) => {
      const current = prev[key] || { up: 0, down: 0 }
      return { ...prev, [key]: { ...current, [direction]: current[direction] + 1 } }
    })
    try {
      const res = await fetch('/.netlify/functions/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, direction }),
      })
      const data = await res.json()
      if (data.votes) {
        setVotes((prev) => ({ ...prev, [key]: data.votes }))
      }
    } catch (err) {
      console.error('Vote failed:', err)
    }
  }, [])

  // Collect all proposed segments that have slides, grouped by episode
  const proposedGroups = useMemo(() => {
    const groups = []
    for (const ep of allEpisodes) {
      for (const seg of ep.segments) {
        if (seg.status !== 'final' && seg.slides.length > 0) {
          groups.push({ episode: ep, segment: seg })
        }
      }
    }
    return groups
  }, [allEpisodes])

  const totalSlides = proposedGroups.reduce((sum, g) => sum + g.segment.slides.length, 0)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
        Loading proposed segments...
      </div>
    )
  }

  if (proposedGroups.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] gap-3">
        <Archive size={40} className="text-[var(--text-faint)]" />
        <p className="text-sm">No proposed topics across any episode</p>
        <p className="text-xs text-[var(--text-hint)]">Topics added by agents will appear here as "proposed"</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Circle size={12} className="text-yellow-400" />
          <h2 className="text-[var(--text-primary)] font-bold text-lg">Proposed Bank</h2>
          <span className="text-[var(--text-muted)] text-sm">
            {totalSlides} topic{totalSlides !== 1 ? 's' : ''} across all episodes
          </span>
        </div>
        <div className="space-y-5">
          {proposedGroups.map(({ episode, segment }) => (
            <div key={`${episode.id}-${segment.id}`}>
              {/* Segment header */}
              <div className="flex items-center gap-2 mb-2">
                <StatusDot status="proposed" />
                <span className="text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider">{segment.name}</span>
                <span className="text-[var(--text-hint)] text-[10px]">&#183;</span>
                <span className="text-[var(--text-hint)] text-[10px] font-mono">{episode.title}</span>
              </div>
              {/* Individual slides */}
              <div className="space-y-2 ml-4">
                {segment.slides.map((slide, slideIdx) => (
                  <ProposedSlideCard
                    key={slideIdx}
                    episode={episode}
                    segment={segment}
                    slide={slide}
                    slideIdx={slideIdx}
                    onSelectSlide={onSelectSlide}
                    allEpisodes={allEpisodes}
                    isAdmin={isAdmin}
                    votes={votes}
                    onVote={handleVote}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function EpisodeBoard({ forceViewMode }) {
  const [episodes, setEpisodes] = useState([])
  const [currentEpId, setCurrentEpId] = useState(null)
  const [episode, setEpisode] = useState(null)
  const [activeSegmentIdx, setActiveSegmentIdx] = useState(0)
  const [activeSlideIdx, setActiveSlideIdx] = useState(0)
  const [epDropdownOpen, setEpDropdownOpen] = useState(false)
  const [viewMode, setViewMode] = useState(forceViewMode || 'show')

  const popOutLive = useCallback(() => {
    const w = 380
    const h = window.screen.availHeight
    const left = window.screen.availWidth - w
    window.open(
      `${window.location.origin}?mode=live`,
      'fic-live-rundown',
      `width=${w},height=${h},left=${left},top=0,resizable=yes,scrollbars=yes`
    )
  }, [])
  const [expandedSegments, setExpandedSegments] = useState(new Set())
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('fic-admin') === '1')
  const [showAdminPrompt, setShowAdminPrompt] = useState(false)
  const [adminInput, setAdminInput] = useState('')
  const [adminError, setAdminError] = useState(false)

  const handleAdminSubmit = useCallback(() => {
    if (adminInput === 'admin123') {
      setIsAdmin(true)
      sessionStorage.setItem('fic-admin', '1')
      setShowAdminPrompt(false)
      setAdminInput('')
      setAdminError(false)
    } else {
      setAdminError(true)
    }
  }, [adminInput])

  const handleAdminLogout = useCallback(() => {
    setIsAdmin(false)
    sessionStorage.removeItem('fic-admin')
  }, [])


  // Show timer
  const [timerRunning, setTimerRunning] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const timerStart = useRef(null)
  const timerInterval = useRef(null)

  useEffect(() => {
    if (timerRunning) {
      timerStart.current = Date.now() - elapsedMs
      timerInterval.current = setInterval(() => {
        setElapsedMs(Date.now() - timerStart.current)
      }, 100)
    } else if (timerInterval.current) {
      clearInterval(timerInterval.current)
      timerInterval.current = null
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current)
    }
  }, [timerRunning])

  const toggleTimer = useCallback(() => {
    setTimerRunning((r) => !r)
  }, [])

  const resetTimer = useCallback(() => {
    setTimerRunning(false)
    setElapsedMs(0)
  }, [])

  const formatTimer = (ms) => {
    const totalSec = Math.floor(ms / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // Load episode list
  useEffect(() => {
    fetch('/episodes/index.json')
      .then((r) => r.json())
      .then((list) => {
        setEpisodes(list)
        if (list.length > 0) setCurrentEpId(list[0].id)
      })
  }, [])

  // Load episode data
  useEffect(() => {
    if (!currentEpId) return
    fetch(`/episodes/${currentEpId}.json`)
      .then((r) => r.json())
      .then((data) => {
        setEpisode(data)
        setActiveSegmentIdx(0)
        setActiveSlideIdx(0)
      })
  }, [currentEpId])

  const allSegments = episode?.segments || []

  // Filter segments based on view mode
  const segments = useMemo(() => {
    if (viewMode === 'show' || viewMode === 'live') return allSegments.filter((s) => s.status === 'final')
    return allSegments // prep mode shows all
  }, [allSegments, viewMode])

  // Clamp indices to valid range to prevent crashes on view mode switch
  const safeSegIdx = Math.min(activeSegmentIdx, Math.max(segments.length - 1, 0))
  const currentSegment = segments[safeSegIdx]
  const slides = currentSegment?.slides || []
  const safeSlideIdx = Math.min(activeSlideIdx, Math.max(slides.length - 1, 0))
  const currentSlide = slides[safeSlideIdx]

  // Total slide count and current global position
  const totalSlides = segments.reduce((sum, seg) => sum + seg.slides.length, 0)
  let globalSlideIdx = 0
  for (let i = 0; i < safeSegIdx; i++) {
    globalSlideIdx += segments[i].slides.length
  }
  globalSlideIdx += safeSlideIdx

  // Stats for the current episode
  const finalCount = allSegments.filter((s) => s.status === 'final').length
  const proposedCount = allSegments.filter((s) => s.status !== 'final').length

  const goNext = useCallback(() => {
    if (activeSlideIdx < slides.length - 1) {
      setActiveSlideIdx((i) => i + 1)
    } else if (activeSegmentIdx < segments.length - 1) {
      setActiveSegmentIdx((i) => i + 1)
      setActiveSlideIdx(0)
    }
  }, [activeSlideIdx, activeSegmentIdx, slides.length, segments.length])

  const goPrev = useCallback(() => {
    if (activeSlideIdx > 0) {
      setActiveSlideIdx((i) => i - 1)
    } else if (activeSegmentIdx > 0) {
      const prevSegment = segments[activeSegmentIdx - 1]
      setActiveSegmentIdx((i) => i - 1)
      setActiveSlideIdx(prevSegment.slides.length - 1)
    }
  }, [activeSlideIdx, activeSegmentIdx, segments])

  const toggleSegmentExpanded = useCallback((segId) => {
    setExpandedSegments((prev) => {
      const next = new Set(prev)
      if (next.has(segId)) next.delete(segId)
      else next.add(segId)
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setExpandedSegments(new Set(segments.map((s) => s.id)))
  }, [segments])

  const collapseAll = useCallback(() => {
    setExpandedSegments(new Set())
  }, [])

  const jumpToSegment = useCallback((idx) => {
    setActiveSegmentIdx(idx)
    setActiveSlideIdx(0)
    // Auto-expand the clicked segment
    if (segments[idx]) {
      setExpandedSegments((prev) => new Set(prev).add(segments[idx].id))
    }
  }, [segments])

  const jumpToSlide = useCallback((segIdx, slideIdx) => {
    setActiveSegmentIdx(segIdx)
    setActiveSlideIdx(slideIdx)
  }, [])

  // Jump to a specific episode + segment (used by Proposed Bank)
  const handleBankSelect = useCallback((epId, segId, slideIdx = 0) => {
    setCurrentEpId(epId)
    setViewMode('prep')
    // Load episode, find the segment, jump to the specific slide
    fetch(`/episodes/${epId}.json`)
      .then((r) => r.json())
      .then((data) => {
        setEpisode(data)
        const idx = data.segments.findIndex((s) => s.id === segId)
        setActiveSegmentIdx(idx >= 0 ? idx : 0)
        setActiveSlideIdx(slideIdx)
        // Auto-expand the segment
        if (data.segments[idx]) {
          setExpandedSegments((prev) => new Set(prev).add(data.segments[idx].id))
        }
      })
  }, [])

  // Reset segment index when view mode changes (filtered list may be shorter)
  useEffect(() => {
    setActiveSegmentIdx(0)
    setActiveSlideIdx(0)
  }, [viewMode])

  // Navigate to next/prev segment (for Live mode)
  const goNextSegment = useCallback(() => {
    if (activeSegmentIdx < segments.length - 1) {
      setActiveSegmentIdx((i) => i + 1)
      setActiveSlideIdx(0)
    }
  }, [activeSegmentIdx, segments.length])

  const goPrevSegment = useCallback(() => {
    if (activeSegmentIdx > 0) {
      setActiveSegmentIdx((i) => i - 1)
      setActiveSlideIdx(0)
    }
  }, [activeSegmentIdx])

  // Keyboard navigation
  useEffect(() => {
    if (viewMode === 'bank') return // no keyboard nav in bank view
    const handleKey = (e) => {
      if (viewMode === 'live') {
        // In live mode: arrows and space move between segments
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
          e.preventDefault()
          goNextSegment()
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault()
          goPrevSegment()
        }
      } else {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault()
          goNext()
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          goPrev()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, goNextSegment, goPrevSegment, viewMode])

  if (!episode) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
        Loading episode...
      </div>
    )
  }

  const currentEp = episodes.find((e) => e.id === currentEpId)

  // Live mode — full-width PTI rundown
  if (viewMode === 'live') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Live mode header */}
        <div className="px-6 py-2 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back button — only when NOT in pop-out */}
            {!forceViewMode && (
              <button
                onClick={() => setViewMode('show')}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                <ChevronLeft size={12} />
                Back
              </button>
            )}
            {/* Episode dropdown */}
            <div className="relative">
              <button
                onClick={() => setEpDropdownOpen(!epDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-bold tracking-wider transition-colors"
              >
                <span className="truncate max-w-[160px]">{currentEp?.title || 'Select Episode'}</span>
                <ChevronDown size={12} className="text-[var(--text-tertiary)] flex-shrink-0" />
              </button>
              {epDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 min-w-[180px] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-2xl z-20 overflow-hidden">
                  {episodes.map((ep) => (
                    <button
                      key={ep.id}
                      onClick={() => {
                        setCurrentEpId(ep.id)
                        setEpDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors
                        ${ep.id === currentEpId ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'}`}
                    >
                      {ep.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Pop-out button */}
          {!forceViewMode && (
            <button
              onClick={popOutLive}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-xs font-bold transition-all"
              title="Pop out Live rundown in a narrow window"
            >
              <ExternalLink size={12} />
              Pop Out
            </button>
          )}
        </div>

        <LiveRundown
          segments={segments}
          activeSegmentIdx={safeSegIdx}
          onJumpToSegment={jumpToSegment}
          formatTimer={formatTimer}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left sidebar — segments */}
      <div className="w-56 flex-shrink-0 border-r border-[var(--border-subtle)] flex flex-col">
        {/* Episode picker */}
        <div className="p-3 border-b border-[var(--border-subtle)] relative">
          <button
            onClick={() => setEpDropdownOpen(!epDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-bold tracking-wider transition-colors"
          >
            <span className="truncate">{currentEp?.title || 'Select Episode'}</span>
            <ChevronDown size={14} className="text-[var(--text-tertiary)] flex-shrink-0" />
          </button>
          {epDropdownOpen && (
            <div className="absolute top-full left-3 right-3 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-2xl z-20 overflow-hidden">
              {episodes.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => {
                    setCurrentEpId(ep.id)
                    setEpDropdownOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors
                    ${ep.id === currentEpId ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'}`}
                >
                  {ep.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View mode toggle */}
        <div className="p-2 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-0.5 bg-[var(--bg-subtle)] rounded-lg p-0.5">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                title={mode.description}
                className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all
                  ${viewMode === mode.id
                    ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          {/* Admin lock/unlock */}
          <div className="flex items-center justify-end mt-2 px-1">
            {isAdmin ? (
              <button
                onClick={handleAdminLogout}
                className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
                title="Admin mode active — click to lock"
              >
                <Unlock size={10} />
                <span className="font-bold uppercase tracking-wider">Admin</span>
              </button>
            ) : (
              <button
                onClick={() => { setShowAdminPrompt(true); setAdminError(false); setAdminInput('') }}
                className="flex items-center gap-1 text-[10px] text-[var(--text-hint)] hover:text-[var(--text-muted)] transition-colors"
                title="Unlock admin actions"
              >
                <Lock size={10} />
                <span className="uppercase tracking-wider">Admin</span>
              </button>
            )}
          </div>
          {/* Status counts */}
          {viewMode !== 'bank' && (
            <div className="flex items-center gap-3 mt-2 px-1">
              <div className="flex items-center gap-1">
                <CheckCircle2 size={9} className="text-emerald-400" />
                <span className="text-[10px] text-[var(--text-muted)]">{finalCount} final</span>
              </div>
              {proposedCount > 0 && (
                <div className="flex items-center gap-1">
                  <Circle size={9} className="text-yellow-400" />
                  <span className="text-[10px] text-[var(--text-muted)]">{proposedCount} proposed</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Segment list (hidden in bank view) */}
        {viewMode !== 'bank' && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Expand / Collapse all */}
            {segments.length > 0 && (
              <div className="flex items-center justify-end gap-1 px-3 pt-2 pb-1">
                <button
                  onClick={expandAll}
                  title="Expand all"
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] text-[var(--text-hint)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <ChevronsUpDown size={10} />
                  Expand
                </button>
                <button
                  onClick={collapseAll}
                  title="Collapse all"
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] text-[var(--text-hint)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <ChevronsDownUp size={10} />
                  Collapse
                </button>
              </div>
            )}
            {segments.length === 0 && (
              <div className="px-4 py-8 text-center text-[var(--text-hint)] text-xs">
                {viewMode === 'show' ? 'No final segments yet' : 'No segments'}
              </div>
            )}
            <div className="flex-1 overflow-y-auto pb-2">
              {segments.map((seg, idx) => {
                const isActive = idx === activeSegmentIdx
                const segStatus = seg.status || 'proposed'
                const isExpanded = expandedSegments.has(seg.id)
                return (
                  <div key={seg.id}>
                    {/* Segment header */}
                    <div
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-all border-l-2 flex items-center gap-1
                        ${isActive
                          ? 'bg-[var(--bg-active)] text-[var(--text-primary)] border-[#D94E2A]'
                          : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] border-transparent'
                        }`}
                    >
                      {/* Expand/collapse chevron */}
                      <button
                        onClick={() => toggleSegmentExpanded(seg.id)}
                        className="p-0.5 rounded hover:bg-[var(--bg-hover)] transition-colors flex-shrink-0"
                      >
                        {isExpanded
                          ? <ChevronDown size={10} className="text-[var(--text-muted)]" />
                          : <ChevronRight size={10} className="text-[var(--text-muted)]" />
                        }
                      </button>
                      <button
                        onClick={() => jumpToSegment(idx)}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="flex items-center gap-1.5">
                          <StatusDot status={segStatus} />
                          <span className="block truncate flex-1">{seg.name}</span>
                        </div>
                        <span className="text-[10px] text-[var(--text-hint)] mt-0.5 block pl-4">
                          {seg.slides.length} slide{seg.slides.length !== 1 ? 's' : ''}
                        </span>
                      </button>
                    </div>
                    {/* Slide sub-items */}
                    {isExpanded && seg.slides.length > 0 && (
                      <div className="ml-4 border-l border-[var(--border-subtle)]">
                        {seg.slides.map((slide, sIdx) => {
                          const isActiveSlide = isActive && sIdx === activeSlideIdx
                          return (
                            <div key={sIdx}>
                              <button
                                onClick={() => jumpToSlide(idx, sIdx)}
                                className={`w-full text-left pl-4 pr-3 py-1.5 text-[11px] transition-all flex items-center gap-1.5
                                  ${isActiveSlide
                                    ? 'text-[var(--text-primary)] bg-[var(--bg-subtle)]'
                                    : 'text-[var(--text-hint)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                                  }`}
                              >
                                <SlideTypeIcon type={slide.type} />
                                <span className="truncate">{slide.title}</span>
                              </button>
                              {/* Per-slide action buttons (Prep/Show only, admin only) */}
                              {isAdmin && (viewMode === 'prep' || viewMode === 'show') && slide.status !== 'final' && (
                                <SidebarSegmentActions
                                  viewMode={viewMode}
                                  episodeId={episode?.id}
                                  segmentId={seg.id}
                                  segmentName={slide.title}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Placeholder for bank view sidebar */}
        {viewMode === 'bank' && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
            <Archive size={24} className="text-yellow-400/40 mb-2" />
            <p className="text-[var(--text-muted)] text-xs">
              Browsing proposed segments across all episodes
            </p>
          </div>
        )}
      </div>

      {/* Right area */}
      {viewMode === 'bank' ? (
        <ProposedBank
          episodes={episodes}
          onSelectSlide={handleBankSelect}
          isAdmin={isAdmin}
        />
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Slide header */}
          <div className="px-6 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[#D94E2A] text-xs font-bold tracking-widest uppercase">
                    {currentSegment?.name}
                  </span>
                  {currentSegment && <StatusBadge status={currentSegment.status || 'proposed'} />}
                </div>
                <h2 className="text-[var(--text-primary)] font-bold text-lg mt-0.5">
                  {currentSlide?.title}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[var(--text-hint)] text-xs font-mono">
                {totalSlides > 0 ? `${globalSlideIdx + 1} / ${totalSlides}` : '0 / 0'}
              </span>

              {/* Show Timer */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleTimer}
                  className={`flex items-center gap-3 px-5 py-2.5 rounded-xl text-3xl font-mono font-bold transition-all
                    ${timerRunning
                      ? 'bg-red-500/15 text-[#D94E2A] hover:bg-red-500/25'
                      : elapsedMs > 0
                        ? 'bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                    }`}
                  title={timerRunning ? 'Pause timer' : 'Start timer'}
                >
                  {timerRunning ? <Pause size={28} /> : <Play size={28} />}
                  {formatTimer(elapsedMs)}
                </button>
                {elapsedMs > 0 && (
                  <button
                    onClick={resetTimer}
                    className="p-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                    title="Reset timer"
                  >
                    <RotateCcw size={24} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Slide content */}
          <div className="flex-1 flex items-center justify-center p-6">
            {currentSlide ? (
              <SlideRenderer slide={currentSlide} />
            ) : (
              <div className="text-[var(--text-hint)] text-sm">
                {segments.length === 0 ? 'No segments to display in this view' : 'No slides in this segment'}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="px-6 py-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={globalSlideIdx === 0 || totalSlides === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold
                         bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all
                         disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Prev
            </button>

            {/* Slide dots for current segment */}
            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlideIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all
                    ${i === activeSlideIdx ? 'bg-[#D94E2A] w-4' : 'bg-[var(--text-faint)] hover:bg-[var(--text-muted)]'}`}
                />
              ))}
            </div>

            <button
              onClick={goNext}
              disabled={globalSlideIdx === totalSlides - 1 || totalSlides === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold
                         bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all
                         disabled:opacity-20 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
      {/* Admin password modal */}
      {showAdminPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-2xl p-6 w-80 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={16} className="text-[var(--text-muted)]" />
              <h3 className="text-[var(--text-primary)] font-bold text-sm">Admin Access</h3>
            </div>
            <input
              type="password"
              value={adminInput}
              onChange={(e) => { setAdminInput(e.target.value); setAdminError(false) }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminSubmit()}
              placeholder="Enter password"
              autoFocus
              className={`w-full px-3 py-2 rounded-lg text-sm bg-[var(--bg-subtle)] border text-[var(--text-primary)] outline-none placeholder:text-[var(--text-hint)] ${
                adminError ? 'border-red-500/50' : 'border-[var(--border-default)]'
              }`}
            />
            {adminError && (
              <p className="text-red-400 text-xs mt-1.5">Incorrect password</p>
            )}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleAdminSubmit}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-all"
              >
                Unlock
              </button>
              <button
                onClick={() => { setShowAdminPrompt(false); setAdminInput(''); setAdminError(false) }}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:text-[var(--text-secondary)] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
