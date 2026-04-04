import { useState, useEffect, useCallback } from 'react'
import { Briefcase, MapPin, ExternalLink, Plus, Trash2, Star, Loader2, X, Check, Search, LayoutGrid, List, Calendar, Pencil } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://backend-production-0e40.up.railway.app/api'

const TAG_COLORS = {
  Finance:            { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  AI:                 { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    border: 'border-cyan-500/30' },
  Accounting:         { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'FP&A':             { bg: 'bg-violet-500/15',  text: 'text-violet-400',  border: 'border-violet-500/30' },
  Treasury:           { bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/30' },
  AP:                 { bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/30' },
  AR:                 { bg: 'bg-pink-500/15',    text: 'text-pink-400',    border: 'border-pink-500/30' },
  Collections:        { bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/30' },
  'Strategic Finance': { bg: 'bg-indigo-500/15', text: 'text-indigo-400',  border: 'border-indigo-500/30' },
  Payroll:            { bg: 'bg-teal-500/15',    text: 'text-teal-400',    border: 'border-teal-500/30' },
  IT:                 { bg: 'bg-slate-500/15',   text: 'text-slate-400',   border: 'border-slate-500/30' },
  Other:              { bg: 'bg-gray-500/15',    text: 'text-gray-400',    border: 'border-gray-500/30' },
}

const TYPE_COLORS = {
  'full-time': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  'part-time': 'text-blue-400 bg-blue-500/10 border-blue-500/25',
  'contract':  'text-amber-400 bg-amber-500/10 border-amber-500/25',
  'remote':    'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
}

const ALL_TAGS = ['Finance', 'Accounting', 'FP&A', 'Treasury', 'AP', 'AR', 'Collections', 'Strategic Finance', 'Payroll', 'IT', 'AI', 'Other']
const ALL_TYPES = ['full-time', 'part-time', 'contract', 'remote']

function tagStyle(tag) {
  return TAG_COLORS[tag] || { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' }
}

function formatOpenSince(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 30) return `${diffDays}d ago`
  const diffWeeks = Math.floor(diffDays / 7)
  if (diffDays < 60) return `${diffWeeks}w ago`
  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths}mo ago`
}

// ─── Add Job Modal ─────────────────────────────────────────────────────
function AddJobModal({ adminKey, onSaved, onClose }) {
  const [form, setForm] = useState({
    title: '', company: '', location: '', jobType: 'full-time',
    tags: [], salary: '', url: '', description: '', featured: false, openSince: '', flag: null,
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
      const payload = { ...form }
      if (!payload.openSince) delete payload.openSince
      const res = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(payload),
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
            <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Open Since (optional)</label>
            <input
              type="date" value={form.openSince} onChange={e => set('openSince', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#D94E2A]/50"
            />
          </div>
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
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Category</label>
            <div className="flex gap-2">
              <button onClick={() => set('flag', null)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${!form.flag || form.flag === 'finance-ai' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' : 'border-[var(--border-subtle)] text-[var(--text-muted)]'}`}>
                Finance AI
              </button>
              <button onClick={() => set('flag', 'adjacent')}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${form.flag === 'adjacent' ? 'bg-violet-500/15 text-violet-400 border-violet-500/30' : 'border-[var(--border-subtle)] text-[var(--text-muted)]'}`}>
                Finance AI Adjacent
              </button>
            </div>
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

// ─── Edit Job Modal ────────────────────────────────────────────────────
function EditJobModal({ job, adminKey, onSaved, onClose }) {
  const [form, setForm] = useState({
    title: job.title || '', company: job.company || '', location: job.location || '',
    jobType: job.jobType || 'full-time', tags: Array.isArray(job.tags) ? job.tags : [],
    salary: job.salary || '', url: job.url || '', description: job.description || '',
    featured: job.featured || false, isActive: job.isActive !== false,
    openSince: job.openSince ? new Date(job.openSince).toISOString().split('T')[0] : '',
    flag: job.flag || null,
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
      const payload = { ...form }
      if (!payload.openSince) delete payload.openSince
      const res = await fetch(`${API_BASE}/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(payload),
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
          <span className="text-sm font-black text-[var(--text-primary)] tracking-tight">Edit Job</span>
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
            <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Open Since (optional)</label>
            <input
              type="date" value={form.openSince} onChange={e => set('openSince', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#D94E2A]/50"
            />
          </div>
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
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Category</label>
            <div className="flex gap-2">
              <button onClick={() => set('flag', null)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${!form.flag || form.flag === 'finance-ai' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' : 'border-[var(--border-subtle)] text-[var(--text-muted)]'}`}>
                Finance AI
              </button>
              <button onClick={() => set('flag', 'adjacent')}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${form.flag === 'adjacent' ? 'bg-violet-500/15 text-violet-400 border-violet-500/30' : 'border-[var(--border-subtle)] text-[var(--text-muted)]'}`}>
                Finance AI Adjacent
              </button>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} className="rounded" />
            <span className="text-xs font-bold text-[var(--text-secondary)]">Featured (pin to top)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="rounded" />
            <span className="text-xs font-bold text-[var(--text-secondary)]">Active (visible on board)</span>
          </label>
        </div>
        <div className="px-5 py-4 border-t border-[var(--border-subtle)] flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Cancel</button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-[#D94E2A] text-white hover:bg-[#c04020] disabled:opacity-50 transition-all flex items-center gap-1.5">
            {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Job Card (Tile View) ─────────────────────────────────────────────
function JobCard({ job, isAdmin, adminKey, onDeleted, onEdit }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Remove "${job.title}" at ${job.company}?`)) return
    setDeleting(true)
    try {
      await fetch(`${API_BASE}/jobs/${job.id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } })
      onDeleted(job.id)
    } catch { setDeleting(false) }
  }

  const tags = Array.isArray(job.tags) ? job.tags : []
  const typeColor = TYPE_COLORS[job.jobType] || TYPE_COLORS['full-time']
  const openLabel = formatOpenSince(job.openSince)

  return (
    <div className={`group rounded-2xl border bg-[var(--bg-secondary)] p-5 transition-all hover:border-[#D94E2A]/30 hover:shadow-lg ${job.featured ? 'border-[#D94E2A]/40 shadow-[0_0_20px_rgba(217,78,42,0.08)]' : 'border-[var(--border-subtle)]'}`}>
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
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(job)}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#D94E2A] hover:bg-[#D94E2A]/10 transition-all">
              <Pencil size={12} />
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all">
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            </button>
          </div>
        )}
      </div>

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

      {job.description && (
        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed mb-3 line-clamp-2">{job.description}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          {openLabel && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <Calendar size={9} /> Open {openLabel}
            </span>
          )}
        </div>
        <a href={job.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-bold text-[#D94E2A] hover:text-[#c04020] transition-colors">
          Apply <ExternalLink size={11} />
        </a>
      </div>
    </div>
  )
}

// ─── Job Row (List View) ──────────────────────────────────────────────
function JobRow({ job, isAdmin, adminKey, onDeleted, onEdit }) {
  const [deleting, setDeleting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Remove "${job.title}" at ${job.company}?`)) return
    setDeleting(true)
    try {
      await fetch(`${API_BASE}/jobs/${job.id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } })
      onDeleted(job.id)
    } catch { setDeleting(false) }
  }

  const tags = Array.isArray(job.tags) ? job.tags : []
  const typeColor = TYPE_COLORS[job.jobType] || TYPE_COLORS['full-time']
  const openLabel = formatOpenSince(job.openSince)

  return (
    <div className={`rounded-xl border transition-all ${job.featured ? 'border-[#D94E2A]/40 bg-[var(--bg-subtle)]' : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)]'} ${expanded ? 'border-[#D94E2A]/30' : ''}`}>
      <div
        className="group flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-[var(--bg-subtle)] rounded-xl transition-all"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Left: title + company */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {job.featured && <Star size={10} className="text-[#D94E2A] fill-[#D94E2A] shrink-0" />}
            <h3 className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[#D94E2A] transition-colors">
              {job.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[var(--text-secondary)] font-medium">{job.company}</span>
            {job.location && (
              <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                <MapPin size={8} /> {job.location}
              </span>
            )}
          </div>
        </div>

        {/* Middle: tags + type */}
        <div className="hidden md:flex items-center gap-1.5 flex-wrap shrink-0 max-w-[280px]">
          <span className={`text-[8px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border ${typeColor}`}>
            {job.jobType}
          </span>
          {tags.slice(0, 3).map(tag => {
            const s = tagStyle(tag)
            return (
              <span key={tag} className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                {tag}
              </span>
            )
          })}
          {tags.length > 3 && (
            <span className="text-[8px] text-[var(--text-muted)]">+{tags.length - 3}</span>
          )}
        </div>

        {/* Salary */}
        {job.salary && (
          <span className="hidden lg:block text-[10px] font-mono font-bold text-[var(--text-secondary)] shrink-0 w-28 text-right">
            {job.salary}
          </span>
        )}

        {/* Open since */}
        <div className="hidden sm:flex items-center gap-1 text-[10px] text-[var(--text-muted)] shrink-0 w-20 justify-end">
          {openLabel && <><Calendar size={8} /> {openLabel}</>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
          <a href={job.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-[#D94E2A] hover:bg-[#D94E2A]/10 transition-all">
            Apply <ExternalLink size={10} />
          </a>
          {isAdmin && (
            <>
              <button onClick={() => onEdit(job)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#D94E2A] hover:bg-[#D94E2A]/10 transition-all">
                <Pencil size={11} />
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all">
                {deleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expandable description */}
      {expanded && (
        <div className="px-5 pb-4 pt-1 border-t border-[var(--border-subtle)]">
          {job.description ? (
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{job.description}</p>
          ) : (
            <p className="text-xs text-[var(--text-muted)] italic">No description provided.</p>
          )}
          {/* Show tags on mobile when expanded */}
          <div className="flex md:hidden items-center gap-1.5 flex-wrap mt-3">
            <span className={`text-[8px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border ${typeColor}`}>
              {job.jobType}
            </span>
            {tags.map(tag => {
              const s = tagStyle(tag)
              return (
                <span key={tag} className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                  {tag}
                </span>
              )
            })}
          </div>
          {job.salary && (
            <p className="lg:hidden text-[10px] font-mono font-bold text-[var(--text-secondary)] mt-2">{job.salary}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main JobBoard Component ───────────────────────────────────────────
export default function JobBoard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTag, setFilterTag] = useState(null)
  const [filterType, setFilterType] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('list')
  const [activeTab, setActiveTab] = useState('finance-ai')
  const [showModal, setShowModal] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const adminKey = typeof window !== 'undefined' ? localStorage.getItem('admin-key') : null

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/jobs`)
      const data = await res.json()
      setJobs(data.data || [])
    } catch { setJobs([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = jobs.filter(j => {
    // Tab filter
    if (activeTab === 'adjacent') {
      if (j.flag !== 'adjacent') return false
    } else {
      if (j.flag === 'adjacent') return false
    }
    const tags = Array.isArray(j.tags) ? j.tags : []
    if (filterTag && !tags.some(t => t.toLowerCase() === filterTag.toLowerCase())) return false
    if (filterType && j.jobType !== filterType) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const inTitle = j.title?.toLowerCase().includes(q)
      const inCompany = j.company?.toLowerCase().includes(q)
      const inDesc = j.description?.toLowerCase().includes(q)
      if (!inTitle && !inCompany && !inDesc) return false
    }
    return true
  })

  return (
    <div className="flex-1 overflow-y-auto">
      {showModal && <AddJobModal adminKey={adminKey} onSaved={() => { setShowModal(false); load() }} onClose={() => setShowModal(false)} />}
      {editingJob && <EditJobModal job={editingJob} adminKey={adminKey} onSaved={() => { setEditingJob(null); load() }} onClose={() => setEditingJob(null)} />}

      <div className="max-w-5xl mx-auto px-4 py-8">
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

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[var(--border-subtle)]">
          <button
            onClick={() => setActiveTab('finance-ai')}
            className={`px-4 py-2.5 text-xs font-black tracking-wide transition-all border-b-2 -mb-px ${activeTab === 'finance-ai' ? 'border-[#D94E2A] text-[#D94E2A]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
            Finance AI
          </button>
          <button
            onClick={() => setActiveTab('adjacent')}
            className={`px-4 py-2.5 text-xs font-black tracking-wide transition-all border-b-2 -mb-px ${activeTab === 'adjacent' ? 'border-violet-400 text-violet-400' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
            Finance AI Adjacent
          </button>
        </div>

        {/* Search + View Toggle */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search jobs by title, company, or description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#D94E2A]/50 placeholder:text-[var(--text-muted)]"
            />
          </div>
          <div className="flex items-center gap-1 bg-[var(--bg-subtle)] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              title="List view"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('tile')}
              className={`p-2 rounded-md transition-all ${viewMode === 'tile' ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              title="Tile view"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
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

        {/* Jobs */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin text-[var(--text-tertiary)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase size={32} className="mx-auto mb-4 text-[var(--text-muted)]" />
            <p className="text-sm font-bold text-[var(--text-secondary)] mb-1">No jobs found</p>
            <p className="text-xs text-[var(--text-tertiary)]">
              {searchQuery ? 'Try a different search or clear filters.' : adminKey ? 'Click "Post a Job" to add the first listing.' : 'Check back soon — listings coming shortly.'}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="flex flex-col gap-2">
            {filtered.map(job => (
              <JobRow
                key={job.id}
                job={job}
                isAdmin={!!adminKey}
                adminKey={adminKey}
                onDeleted={id => setJobs(prev => prev.filter(j => j.id !== id))}
                onEdit={setEditingJob}
              />
            ))}
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
                onEdit={setEditingJob}
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
