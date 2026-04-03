import { useState, useEffect, useCallback } from 'react'
import { Briefcase, MapPin, ExternalLink, Plus, Trash2, Star, Loader2, X, Check } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'https://backend-production-0e40.up.railway.app'

const TAG_COLORS = {
  Finance:    { bg: 'bg-amber-500/15',  text: 'text-amber-400',  border: 'border-amber-500/30' },
  AI:         { bg: 'bg-cyan-500/15',   text: 'text-cyan-400',   border: 'border-cyan-500/30' },
  Accounting: { bg: 'bg-emerald-500/15',text: 'text-emerald-400',border: 'border-emerald-500/30' },
  Fintech:    { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  Tax:        { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
}

const TYPE_COLORS = {
  'full-time': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  'part-time': 'text-blue-400 bg-blue-500/10 border-blue-500/25',
  'contract':  'text-amber-400 bg-amber-500/10 border-amber-500/25',
  'remote':    'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
}

const ALL_TAGS = ['Finance', 'AI', 'Accounting', 'Fintech', 'Tax']
const ALL_TYPES = ['full-time', 'part-time', 'contract', 'remote']

function tagStyle(tag) {
  return TAG_COLORS[tag] || { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' }
}

// ─── Add Job Modal ─────────────────────────────────────────────────────
function AddJobModal({ adminKey, onSaved, onClose }) {
  const [form, setForm] = useState({
    title: '', company: '', location: '', jobType: 'full-time',
    tags: [], salary: '', url: '', description: '', featured: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleTag = (tag) => setForm(f => ({
    ...f,
    tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
  }))

  const save = async () => {
    if (!form.title || !form.company || !form.url) { setError('Title, company, and URL are required'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(`${API}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      onSaved()
    } catch (e) { setError(e.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <span className="text-sm font-black text-[var(--text-primary)] tracking-tight">Add Job</span>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"><X size={16} /></button>
        </div>
        <div className="p-5 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
          {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
          {[['title','Job Title'],['company','Company'],['location','Location (optional)'],['url','Job Posting URL'],['salary','Salary Range (optional)']].map(([k, label]) => (
            <div key={k}>
              <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{label}</label>
              <input
                value={form[k]} onChange={e => set(k, e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#D94E2A]/50"
              />
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Job Type</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_TYPES.map(t => (
                <button key={t} onClick={() => set('jobType', t)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${form.jobType === t ? TYPE_COLORS[t] : 'border-[var(--border-subtle)] text-[var(--text-muted)]'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Tags</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_TAGS.map(tag => {
                const s = tagStyle(tag)
                const active = form.tags.includes(tag)
                return (
                  <button key={tag} onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${active ? `${s.bg} ${s.text} ${s.border}` : 'border-[var(--border-subtle)] text-[var(--text-muted)]'}`}>
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Description (optional)</label>
            <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#D94E2A]/50 resize-none" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} className="rounded" />
            <span className="text-xs font-bold text-[var(--text-secondary)]">Featured (pin to top)</span>
          </label>
        </div>
        <div className="px-5 py-4 border-t border-[var(--border-subtle)] flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Cancel</button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-[#D94E2A] text-white hover:bg-[#c04020] disabled:opacity-50 transition-all flex items-center gap-1.5">
            {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
            Post Job
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Job Card ──────────────────────────────────────────────────────────
function JobCard({ job, isAdmin, adminKey, onDeleted }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Remove "${job.title}" at ${job.company}?`)) return
    setDeleting(true)
    try {
      await fetch(`${API}/api/jobs/${job.id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } })
      onDeleted(job.id)
    } catch { setDeleting(false) }
  }

  const tags = Array.isArray(job.tags) ? job.tags : []
  const typeColor = TYPE_COLORS[job.jobType] || TYPE_COLORS['full-time']
  const daysSince = Math.floor((Date.now() - new Date(job.postedAt).getTime()) / 86400000)
  const timeLabel = daysSince === 0 ? 'Today' : daysSince === 1 ? '1 day ago' : `${daysSince}d ago`

  return (
    <div className={`group rounded-2xl border bg-[var(--bg-secondary)] p-5 transition-all hover:border-[#D94E2A]/30 hover:shadow-lg ${job.featured ? 'border-[#D94E2A]/40 shadow-[0_0_20px_rgba(217,78,42,0.08)]' : 'border-[var(--border-subtle)]'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {job.featured && <Star size={11} className="text-[#D94E2A] fill-[#D94E2A] shrink-0" />}
            <h3 className="text-sm font-black text-[var(--text-primary)] truncate group-hover:text-[#D94E2A] transition-colors">
              {job.title}
            </h3>
          </div>
          <p className="text-xs font-bold text-[var(--text-secondary)]">{job.company}</p>
        </div>
        {isAdmin && (
          <button onClick={handleDelete} disabled={deleting}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0">
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border ${typeColor}`}>
          {job.jobType}
        </span>
        {job.location && (
          <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
            <MapPin size={9} /> {job.location}
          </span>
        )}
        {job.salary && (
          <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">{job.salary}</span>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-3">
          {tags.map(tag => {
            const s = tagStyle(tag)
            return (
              <span key={tag} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                {tag}
              </span>
            )
          })}
        </div>
      )}

      {/* Description */}
      {job.description && (
        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed mb-3 line-clamp-2">{job.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
        <span className="text-[10px] text-[var(--text-muted)]">{timeLabel}</span>
        <a href={job.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-bold text-[#D94E2A] hover:text-[#c04020] transition-colors">
          Apply <ExternalLink size={11} />
        </a>
      </div>
    </div>
  )
}

// ─── Main JobBoard Component ───────────────────────────────────────────
export default function JobBoard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTag, setFilterTag] = useState(null)
  const [filterType, setFilterType] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const adminKey = typeof window !== 'undefined' ? localStorage.getItem('admin-key') : null

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/jobs`)
      const data = await res.json()
      setJobs(data.data || [])
    } catch { setJobs([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = jobs.filter(j => {
    const tags = Array.isArray(j.tags) ? j.tags : []
    if (filterTag && !tags.some(t => t.toLowerCase() === filterTag.toLowerCase())) return false
    if (filterType && j.jobType !== filterType) return false
    return true
  })

  return (
    <div className="flex-1 overflow-y-auto">
      {showModal && <AddJobModal adminKey={adminKey} onSaved={() => { setShowModal(false); load() }} onClose={() => setShowModal(false)} />}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[9px] font-black tracking-[.22em] uppercase text-[#D94E2A] mb-1">Finance Is Cooked</div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight mb-1">
              Finance &amp; AI Jobs
            </h1>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-md">
              Roles at the intersection of finance and AI — curated for the FIC community.
            </p>
          </div>
          {adminKey && (
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-[#D94E2A] text-white hover:bg-[#c04020] transition-all shadow-lg shadow-[#D94E2A]/20">
              <Plus size={13} /> Post a Job
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setFilterTag(null)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black border transition-all ${!filterTag ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] border-[var(--border-subtle)]' : 'text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-secondary)]'}`}>
              All
            </button>
            {ALL_TAGS.map(tag => {
              const s = tagStyle(tag)
              const active = filterTag === tag
              return (
                <button key={tag} onClick={() => setFilterTag(active ? null : tag)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black border transition-all ${active ? `${s.bg} ${s.text} ${s.border}` : 'text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-secondary)]'}`}>
                  {tag}
                </button>
              )
            })}
          </div>
          <div className="w-px bg-[var(--border-subtle)]" />
          <div className="flex gap-1.5 flex-wrap">
            {ALL_TYPES.map(type => {
              const active = filterType === type
              return (
                <button key={type} onClick={() => setFilterType(active ? null : type)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black border transition-all ${active ? TYPE_COLORS[type] : 'text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-secondary)]'}`}>
                  {type}
                </button>
              )
            })}
          </div>
        </div>

        {/* Jobs grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin text-[var(--text-tertiary)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase size={32} className="mx-auto mb-4 text-[var(--text-muted)]" />
            <p className="text-sm font-bold text-[var(--text-secondary)] mb-1">No jobs yet</p>
            <p className="text-xs text-[var(--text-tertiary)]">
              {adminKey ? 'Click "Post a Job" to add the first listing.' : 'Check back soon — listings coming shortly.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(job => (
              <JobCard
                key={job.id}
                job={job}
                isAdmin={!!adminKey}
                adminKey={adminKey}
                onDeleted={id => setJobs(prev => prev.filter(j => j.id !== id))}
              />
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-[10px] text-[var(--text-muted)]">
          {filtered.length} listing{filtered.length !== 1 ? 's' : ''} · Finance Is Cooked Job Board
        </p>
      </div>
    </div>
  )
}
