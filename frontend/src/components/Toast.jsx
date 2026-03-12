import { useState, useEffect } from 'react'

let showToastFn = null

export function toast(message) {
  showToastFn?.(message)
}

export default function Toast() {
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    showToastFn = (m) => {
      setMsg(m)
      setTimeout(() => setMsg(null), 2500)
    }
    return () => { showToastFn = null }
  }, [])

  if (!msg) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg-active)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-4 py-2 rounded-xl text-sm shadow-lg animate-fade-in">
      {msg}
    </div>
  )
}
