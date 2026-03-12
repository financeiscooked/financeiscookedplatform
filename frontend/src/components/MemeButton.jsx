import React, { useRef } from 'react'
import { Pencil } from 'lucide-react'

export default function MemeButton({ slot, onShow, onEdit }) {
  const btnRef = useRef(null)

  const handleClick = () => {
    onShow(slot)

    if (btnRef.current) {
      btnRef.current.classList.remove('btn-press', 'glow-playing')
      void btnRef.current.offsetWidth
      btnRef.current.classList.add('btn-press', 'glow-playing')
    }
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    onEdit(slot)
  }

  const color = slot.color || '#666'
  const hasImage = slot.customImageUrl || slot.placeholder

  return (
    <div
      ref={btnRef}
      className="sound-btn flex flex-col items-center justify-center gap-1.5 p-2"
      style={{
        background: `linear-gradient(145deg, ${color}22, ${color}11)`,
        '--glow-color': `${color}88`,
      }}
      onClick={handleClick}
    >
      {/* Edit button */}
      <div className="edit-overlay z-10">
        <button
          onClick={handleEdit}
          className="p-1.5 rounded-lg bg-[var(--btn-edit-bg)] hover:bg-[var(--btn-edit-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Pencil size={14} />
        </button>
      </div>

      {/* Thumbnail preview */}
      {hasImage && (
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-[var(--border-default)]">
          <img
            src={slot.customImageUrl || slot.placeholder}
            alt={slot.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      )}

      {/* Meme name */}
      <span
        className="text-xs font-bold text-center leading-tight tracking-wide"
        style={{ color: color }}
      >
        {slot.name}
      </span>
    </div>
  )
}
