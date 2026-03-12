import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Pencil, Square } from 'lucide-react'

export default function SoundButton({ slot, onEdit, stopAllSignal }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const btnRef = useRef(null)
  const audioRef = useRef(null)

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setIsPlaying(false)
  }, [])

  // Stop all sounds when signal changes
  useEffect(() => {
    if (stopAllSignal > 0) {
      stopAudio()
    }
  }, [stopAllSignal, stopAudio])

  const handleClick = useCallback(() => {
    // If already playing, stop it
    if (isPlaying) {
      stopAudio()
      return
    }

    setIsPlaying(true)

    if (slot.customAudioUrl) {
      // Play uploaded audio file
      const audio = new Audio(slot.customAudioUrl)
      audioRef.current = audio
      audio.play()
      audio.onended = () => {
        audioRef.current = null
        setIsPlaying(false)
      }
    } else if (slot.defaultSound?.audioSrc) {
      // Play from audio file (new default sounds)
      const audio = new Audio(slot.defaultSound.audioSrc)
      audioRef.current = audio
      audio.play()
      audio.onended = () => {
        audioRef.current = null
        setIsPlaying(false)
      }
    } else if (slot.defaultSound?.play) {
      // Fallback: synthesized sound (no stop support)
      slot.defaultSound.play()
      setTimeout(() => setIsPlaying(false), 300)
    }

    // Button press animation
    if (btnRef.current) {
      btnRef.current.classList.remove('btn-press', 'glow-playing')
      void btnRef.current.offsetWidth
      btnRef.current.classList.add('btn-press', 'glow-playing')
    }
  }, [slot, isPlaying, stopAudio])

  const handleEdit = (e) => {
    e.stopPropagation()
    onEdit(slot)
  }

  const color = slot.color || '#666'

  return (
    <div
      ref={btnRef}
      className="sound-btn flex flex-col items-center justify-center gap-2 p-3"
      style={{
        background: isPlaying
          ? `linear-gradient(145deg, ${color}44, ${color}22)`
          : `linear-gradient(145deg, ${color}22, ${color}11)`,
        '--glow-color': `${color}88`,
        borderColor: isPlaying ? `${color}66` : undefined,
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

      {/* Color indicator bar or stop icon */}
      {isPlaying ? (
        <Square
          size={14}
          className="fill-current"
          style={{ color: color }}
        />
      ) : (
        <div
          className="w-10 h-1 rounded-full mb-1"
          style={{ background: color }}
        />
      )}

      {/* Sound name */}
      <span
        className="text-sm font-bold text-center leading-tight tracking-wide"
        style={{ color: color }}
      >
        {slot.name}
      </span>

      {/* Playing indicator */}
      {isPlaying && (
        <div className="flex gap-1 items-end h-3">
          {[0, 1, 2, 0, 1].map((d, i) => (
            <div
              key={i}
              className="w-0.5 rounded-full animate-pulse"
              style={{
                background: color,
                height: `${6 + Math.random() * 8}px`,
                animationDelay: `${d * 100}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
