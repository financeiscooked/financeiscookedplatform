import { useState } from 'react'
import { X } from 'lucide-react'

export default function EpisodePicker({ episodes, onSelect, onClose }) {
  const [selected, setSelected] = useState(episodes[0]?.id || '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-5 w-72 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[var(--text-primary)] font-bold text-sm">Move to which episode?</h3>
          <button onClick={onClose} className="text-[var(--text-hint)] hover:text-[var(--text-secondary)]">
            <X size={16} />
          </button>
        </div>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm mb-4"
        >
          {episodes.filter(ep => ep.id !== 'backlog').map((ep) => (
            <option key={ep.id} value={ep.id}>{ep.title || ep.id}</option>
          ))}
        </select>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]">
            Cancel
          </button>
          <button
            onClick={() => { onSelect(selected); onClose() }}
            className="px-3 py-1.5 rounded-lg text-xs bg-green-600 text-white hover:bg-green-500"
          >
            Accept & Move
          </button>
        </div>
      </div>
    </div>
  )
}
