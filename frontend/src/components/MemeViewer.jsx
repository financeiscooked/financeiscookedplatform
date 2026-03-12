import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export default function MemeViewer({ slot, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const imageSrc = slot.customImageUrl || slot.placeholder

  return (
    <div
      className="fixed inset-0 bg-[var(--overlay-heavy)] backdrop-blur-md flex items-center justify-center z-50 cursor-pointer"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <X size={24} />
      </button>

      {/* Meme label */}
      <div className="absolute top-4 left-4">
        <span
          className="text-sm font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg"
          style={{ background: `${slot.color}33`, color: slot.color }}
        >
          {slot.name}
        </span>
      </div>

      {/* Image */}
      <div
        className="max-w-[85vw] max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border-2"
        style={{ borderColor: `${slot.color}44` }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageSrc}
          alt={slot.name}
          className="max-w-[85vw] max-h-[85vh] object-contain"
          draggable={false}
        />
      </div>

      {/* Hint */}
      <p className="absolute bottom-4 text-[var(--text-hint)] text-xs">
        Click anywhere or press Escape to close
      </p>
    </div>
  )
}
