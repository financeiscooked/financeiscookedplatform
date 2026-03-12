import React, { useState, useEffect, useCallback } from 'react'
import MemeButton from './MemeButton'
import MemeViewer from './MemeViewer'
import MemeEditModal from './MemeEditModal'
import { DEFAULT_MEMES } from '../memes/defaults'
import {
  saveCustomMeme,
  getAllCustomMemes,
  deleteCustomMeme,
  saveMemeConfig,
  getAllMemeConfigs,
} from '../utils/storage'

export default function MemeBoard() {
  const [slots, setSlots] = useState([])
  const [viewingSlot, setViewingSlot] = useState(null)
  const [editingSlot, setEditingSlot] = useState(null)

  useEffect(() => {
    async function loadSlots() {
      const customMemes = await getAllCustomMemes()
      const configs = await getAllMemeConfigs()

      const customMap = {}
      customMemes.forEach((m) => (customMap[m.id] = m))
      const configMap = {}
      configs.forEach((c) => (configMap[c.id] = c))

      const loadedSlots = DEFAULT_MEMES.map((defaultMeme, index) => {
        const slotId = defaultMeme.id
        const custom = customMap[slotId]
        const config = configMap[slotId]

        if (custom) {
          const blob = new Blob([custom.data], { type: custom.type })
          const url = URL.createObjectURL(blob)
          return {
            index,
            id: slotId,
            name: config?.name || custom.name,
            color: config?.color || defaultMeme.color,
            customImageUrl: url,
            placeholder: defaultMeme.placeholder,
            isCustom: true,
            originalFileName: custom.originalName,
          }
        }

        return {
          index,
          id: slotId,
          name: config?.name || defaultMeme.name,
          color: config?.color || defaultMeme.color,
          customImageUrl: null,
          placeholder: defaultMeme.placeholder,
          isCustom: false,
        }
      })

      setSlots(loadedSlots)
    }

    loadSlots()
  }, [])

  const handleShow = useCallback((slot) => {
    setViewingSlot(slot)
  }, [])

  const handleEdit = useCallback((slot) => {
    setEditingSlot(slot)
  }, [])

  const handleSave = useCallback(
    async ({ name, file }) => {
      const slot = editingSlot
      if (!slot) return

      if (file) {
        await saveCustomMeme(slot.id, file)
      }

      if (name !== slot.name) {
        await saveMemeConfig(slot.id, { name })
      }

      const customMemes = await getAllCustomMemes()
      const configs = await getAllMemeConfigs()
      const customMap = {}
      customMemes.forEach((m) => (customMap[m.id] = m))
      const configMap = {}
      configs.forEach((c) => (configMap[c.id] = c))

      setSlots((prev) =>
        prev.map((s) => {
          if (s.id !== slot.id) return s
          const custom = customMap[s.id]
          const config = configMap[s.id]
          const defaultMeme = DEFAULT_MEMES.find((d) => d.id === s.id)

          if (custom) {
            if (s.customImageUrl) URL.revokeObjectURL(s.customImageUrl)
            const blob = new Blob([custom.data], { type: custom.type })
            const url = URL.createObjectURL(blob)
            return {
              ...s,
              name: config?.name || custom.name,
              customImageUrl: url,
              isCustom: true,
              originalFileName: custom.originalName,
            }
          }

          return {
            ...s,
            name: config?.name || defaultMeme.name,
          }
        })
      )

      setEditingSlot(null)
    },
    [editingSlot]
  )

  const handleReset = useCallback(async () => {
    if (!editingSlot) return
    await deleteCustomMeme(editingSlot.id)

    setSlots((prev) =>
      prev.map((s) => {
        if (s.id !== editingSlot.id) return s
        const defaultMeme = DEFAULT_MEMES.find((d) => d.id === s.id)
        if (s.customImageUrl) URL.revokeObjectURL(s.customImageUrl)
        return {
          ...s,
          name: defaultMeme.name,
          color: defaultMeme.color,
          customImageUrl: null,
          isCustom: false,
          originalFileName: null,
        }
      })
    )

    setEditingSlot(null)
  }, [editingSlot])

  return (
    <>
      {/* Meme Grid */}
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="grid grid-cols-4 gap-3 w-full max-w-4xl" style={{ gridAutoRows: '1fr' }}>
          {slots.map((slot) => (
            <MemeButton
              key={slot.id}
              slot={slot}
              onShow={handleShow}
              onEdit={handleEdit}
            />
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <footer className="px-6 py-2 border-t border-[var(--border-subtle)] text-center">
        <p className="text-[var(--text-faint)] text-xs">
          Hover a button and click the pencil to upload your own memes
        </p>
      </footer>

      {/* Meme Viewer overlay */}
      {viewingSlot && (
        <MemeViewer slot={viewingSlot} onClose={() => setViewingSlot(null)} />
      )}

      {/* Edit Modal */}
      {editingSlot && (
        <MemeEditModal
          slot={editingSlot}
          onSave={handleSave}
          onReset={handleReset}
          onClose={() => setEditingSlot(null)}
        />
      )}
    </>
  )
}
