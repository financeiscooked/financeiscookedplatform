import React, { useState, useMemo } from 'react'
import { Home as HomeIcon, Tv, Volume2, Image, BookOpen, FileText, Sun, Moon } from 'lucide-react'
import { useTheme } from './context/ThemeContext'
import Home from './components/Home'
import SoundBoard from './components/SoundBoard'
import MemeBoard from './components/MemeBoard'
import EpisodeBoard from './components/EpisodeBoard'
import McpDocs from './components/McpDocs'
import Toast from './components/Toast'

const MAIN_TABS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'show', label: 'The Show', icon: Tv },
  { id: 'docs', label: 'Documentation', icon: BookOpen },
]

const SHOW_TABS = [
  { id: 'episodes', label: 'Episodes', icon: Tv },
  { id: 'sounds', label: 'Soundboard', icon: Volume2 },
  { id: 'memes', label: 'Meme Board', icon: Image },
]

const DOC_TABS = [
  { id: 'api', label: 'API Docs', icon: FileText },
  { id: 'mcp', label: 'MCP Docs', icon: BookOpen },
]

function useIsPopout() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('mode') === 'live'
  }, [])
}

export default function App() {
  const isPopout = useIsPopout()
  const [mainTab, setMainTab] = useState('home')
  const [showTab, setShowTab] = useState('episodes')
  const [docTab, setDocTab] = useState('api')
  const { theme, toggleTheme } = useTheme()

  if (isPopout) {
    return (
      <div className="h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
        <EpisodeBoard forceViewMode="live" />
        <Toast />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-subtle)] shrink-0">
        <div className="flex items-center gap-4">
          {/* ON AIR */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#D94E2A] animate-pulse shadow-lg shadow-[#D94E2A]/50" />
            <span className="text-[#D94E2A] text-xs font-bold tracking-widest uppercase">On Air</span>
          </div>

          <div className="w-px h-6 bg-[var(--divider-px)]" />

          <h1 className="font-russo text-xl tracking-wide cursor-pointer" onClick={() => setMainTab('home')}>
            <span className="text-[var(--text-primary)]">finance</span>
            <span className="text-[#D94E2A]">is</span>
            <span className="text-[#F0A030]">cooked</span>
          </h1>

          <div className="w-px h-6 bg-[var(--divider-px)]" />

          {/* Main tabs */}
          <div className="flex items-center gap-1 bg-[var(--bg-subtle)] rounded-xl p-1">
            {MAIN_TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setMainTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all
                    ${mainTab === tab.id
                      ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-lg'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Show sub-tabs */}
          {mainTab === 'show' && (
            <>
              <div className="w-px h-6 bg-[var(--divider-px)]" />
              <div className="flex items-center gap-1 bg-[var(--bg-subtle)] rounded-xl p-1">
                {SHOW_TABS.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setShowTab(tab.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all
                        ${showTab === tab.id
                          ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-lg'
                          : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                        }`}
                    >
                      <Icon size={12} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Docs sub-tabs */}
          {mainTab === 'docs' && (
            <>
              <div className="w-px h-6 bg-[var(--divider-px)]" />
              <div className="flex items-center gap-1 bg-[var(--bg-subtle)] rounded-xl p-1">
                {DOC_TABS.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setDocTab(tab.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all
                        ${docTab === tab.id
                          ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-lg'
                          : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                        }`}
                    >
                      <Icon size={12} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {mainTab === 'home' && <Home />}
        {mainTab === 'show' && showTab === 'episodes' && <EpisodeBoard />}
        {mainTab === 'show' && showTab === 'sounds' && <SoundBoard />}
        {mainTab === 'show' && showTab === 'memes' && <MemeBoard />}
        {mainTab === 'docs' && docTab === 'api' && (
          <iframe
            src="https://backend-production-0e40.up.railway.app/api/docs"
            className="flex-1 w-full border-0"
            title="API Documentation"
          />
        )}
        {mainTab === 'docs' && docTab === 'mcp' && <McpDocs />}
      </div>
      <Toast />
    </div>
  )
}
