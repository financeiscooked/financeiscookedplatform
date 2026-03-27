import React, { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import q1Html from './q1-2026-lookback.html?raw'

const HTML_CONTENT = {
  'q1-2026': q1Html,
}

const QUARTERS = [
  {
    id: 'q1-2026',
    label: 'Q1 2026',
    title: 'When AI Got Serious',
    subtitle: 'January → March 2026',
    description: '40+ major AI events — model releases, company moves, open-source milestones, and the finance sector getting disrupted in real time.',
    live: true,
    stats: ['40+ events', '3 months', 'Finance focus'],
  },
  {
    id: 'q2-2026',
    label: 'Q2 2026',
    title: 'Coming Soon',
    subtitle: 'April → June 2026',
    description: 'The lookback for Q2 will drop at the end of June.',
    url: null,
    live: false,
    stats: [],
  },
  {
    id: 'q3-2026',
    label: 'Q3 2026',
    title: 'Coming Soon',
    subtitle: 'July → September 2026',
    description: 'Q3 lookback drops at the end of September.',
    url: null,
    live: false,
    stats: [],
  },
  {
    id: 'q4-2026',
    label: 'Q4 2026',
    title: 'Coming Soon',
    subtitle: 'October → December 2026',
    description: 'Q4 lookback drops at year-end.',
    url: null,
    live: false,
    stats: [],
  },
]

export default function NewsPage() {
  const [viewing, setViewing] = useState(null) // quarter id being viewed in iframe

  const activeQuarter = QUARTERS.find(q => q.id === viewing)

  if (viewing && HTML_CONTENT[viewing]) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* toolbar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--bg-secondary)]">
          <button
            onClick={() => setViewing(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft size={13} />
            Back to News
          </button>
          <div className="w-px h-4 bg-[var(--border-subtle)]" />
          <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
            {activeQuarter.label} Lookback
          </span>
        </div>
        <iframe
          srcDoc={HTML_CONTENT[viewing]}
          className="flex-1 w-full border-0"
          title={`${activeQuarter.label} AI Timeline`}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Page header */}
        <div className="mb-8">
          <div className="text-[9px] font-black tracking-[.22em] uppercase text-[#D94E2A] mb-1">Finance Is Cooked</div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight mb-2">
            AI News &amp; Lookbacks
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-lg">
            Quarterly deep-dives into the biggest AI events, model releases, and finance-sector disruptions — curated for the FIC community.
          </p>
        </div>

        {/* Quarter grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUARTERS.map((q) => (
            <div
              key={q.id}
              onClick={() => q.live && setViewing(q.id)}
              className={`
                group relative rounded-2xl border p-5 transition-all
                ${q.live
                  ? 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[#D94E2A]/40 hover:bg-[var(--bg-hover)] cursor-pointer'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] opacity-50 cursor-default'
                }
              `}
            >
              {/* Quarter badge */}
              <div className="flex items-center justify-between mb-3">
                <span className={`
                  text-[9px] font-black tracking-[.2em] uppercase px-2.5 py-1 rounded-full border
                  ${q.live
                    ? 'bg-[#D94E2A]/10 border-[#D94E2A]/30 text-[#D94E2A]'
                    : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-tertiary)]'
                  }
                `}>
                  {q.label}
                </span>
                {q.live && (
                  <span className="text-[9px] font-bold tracking-wider uppercase text-[var(--text-tertiary)] group-hover:text-[#D94E2A] transition-colors">
                    View →
                  </span>
                )}
                {!q.live && (
                  <span className="text-[9px] font-bold tracking-wider uppercase text-[var(--text-tertiary)]">
                    Coming Soon
                  </span>
                )}
              </div>

              {/* Content */}
              <h2 className={`text-base font-black tracking-tight mb-1 ${q.live ? 'text-[var(--text-primary)] group-hover:text-[#D94E2A] transition-colors' : 'text-[var(--text-secondary)]'}`}>
                {q.title}
              </h2>
              <p className="text-[10px] font-mono text-[var(--text-tertiary)] mb-3">{q.subtitle}</p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {q.description}
              </p>

              {/* Stats row */}
              {q.stats.length > 0 && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border-subtle)]">
                  {q.stats.map((s) => (
                    <span key={s} className="text-[10px] font-bold text-[var(--text-tertiary)] bg-[var(--bg-primary)] px-2 py-0.5 rounded-md border border-[var(--border-subtle)]">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-[11px] text-[var(--text-tertiary)]">
          New lookbacks drop at the end of each quarter · Finance Is Cooked
        </p>
      </div>
    </div>
  )
}
