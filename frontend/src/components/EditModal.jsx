import React, { useState, useRef } from 'react'
import { X, Upload, RotateCcw, Check } from 'lucide-react'

export default function EditModal({ slot, onSave, onReset, onClose }) {
  const [name, setName] = useState(slot.name)
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type.startsWith('audio/')) {
      setFile(dropped)
    }
  }

  const handleFileSelect = (e) => {
    const selected = e.target.files[0]
    if (selected) setFile(selected)
  }

  const handleSave = () => {
    onSave({ name: name.toUpperCase(), file })
  }

  return (
    <div className="fixed inset-0 bg-[var(--overlay-bg)] backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[var(--bg-surface)] rounded-2xl p-6 w-full max-w-md mx-4 border border-[var(--border-default)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[var(--text-primary)] font-bold text-lg">Edit Sound</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Name input */}
        <div className="mb-5">
          <label className="block text-[var(--text-secondary)] text-xs font-semibold mb-2 uppercase tracking-wider">
            Button Label
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm font-semibold
                       focus:outline-none focus:border-[var(--border-heavy)] focus:ring-1 focus:ring-[var(--border-hover)] transition-all uppercase"
            placeholder="Sound name..."
          />
        </div>

        {/* File upload */}
        <div className="mb-6">
          <label className="block text-[var(--text-secondary)] text-xs font-semibold mb-2 uppercase tracking-wider">
            Audio File
          </label>
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
              ${dragOver ? 'border-blue-400 bg-blue-400/10' : 'border-[var(--border-strong)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-subtle)]'}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mx-auto mb-2 text-[var(--text-muted)]" size={24} />
            {file ? (
              <p className="text-green-400 text-sm font-semibold">{file.name}</p>
            ) : slot.isCustom ? (
              <p className="text-[var(--text-tertiary)] text-sm">
                Current: <span className="text-[var(--text-secondary)] font-semibold">{slot.originalFileName || 'custom sound'}</span>
                <br />
                <span className="text-xs mt-1 inline-block">Drop a new file or click to replace</span>
              </p>
            ) : (
              <p className="text-[var(--text-tertiary)] text-sm">
                Drop audio file here or click to browse
                <br />
                <span className="text-xs text-[var(--text-hint)]">.mp3, .wav, .ogg, .m4a</span>
              </p>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {slot.isCustom && (
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                         bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold
                       bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold
                       bg-[#2B3A5C] hover:bg-[#3a4d75] text-white transition-all"
          >
            <Check size={14} />
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
