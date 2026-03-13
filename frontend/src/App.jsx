import React, { useState, useMemo } from 'react'
import { Home as HomeIcon, Tv, Volume2, Image, BookOpen, FileText, Sun, Moon, Shield, GraduationCap, Hammer, Share2 } from 'lucide-react'
import { useTheme } from './context/ThemeContext'
import Home from './components/Home'
import SoundBoard from './components/SoundBoard'
import MemeBoard from './components/MemeBoard'
import EpisodeBoard from './components/EpisodeBoard'
import McpDocs from './components/McpDocs'
import Toast from './components/Toast'
import AgentChatButton from './components/agent/AgentChatButton'
import AdminPanel from './components/admin/AdminPanel'

const MAIN_TABS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'show', label: 'The Show', icon: Tv },
  { id: 'learn', label: 'Learn', icon: GraduationCap },
  { id: 'build', label: 'Build', icon: Hammer },
  { id: 'share', label: 'Share', icon: Share2 },
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

/* Placeholder page for new tabs */
function PlaceholderPage({ title, description, icon: Icon }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-subtle)] flex items-center justify-center mx-auto mb-6">
          <Icon size={32} className="text-[#D94E2A]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">{title}</h2>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{description}</p>
        <div className="mt-6 inline-block px-4 py-2 rounded-full bg-[var(--bg-subtle)] text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
          Coming Soon
        </div>
      </div>
    </div>
  )
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
      <header className="flex flex-col border-b border-[var(--border-subtle)] shrink-0">
        {/* Top row */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* ON AIR dot — always visible; text hidden on mobile */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#D94E2A] animate-pulse shadow-lg shadow-[#D94E2A]/50" />
              <span className="hidden sm:inline text-[#D94E2A] text-xs font-bold tracking-widest uppercase">On Air</span>
            </div>

            {/* Divider — hidden on mobile */}
            <div className="hidden sm:block w-px h-6 bg-[var(--divider-px)] shrink-0" />

            <h1 className="font-russo text-base sm:text-xl tracking-wide cursor-pointer shrink-0" onClick={() => setMainTab('home')}>
              <span className="text-[var(--text-primary)]">finance</span>
              <span className="text-[#D94E2A]">is</span>
              <span className="text-[#F0A030]">cooked</span>
            </h1>

            {/* Divider — hidden on mobile */}
            <div className="hidden sm:block w-px h-6 bg-[var(--divider-px)] shrink-0" />

            {/* Main tabs — desktop (accordion: sub-tabs expand inline after parent) */}
            <div className="hidden sm:flex items-center gap-1 bg-[var(--bg-subtle)] rounded-xl p-1">
              {MAIN_TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = mainTab === tab.id
                // Determine if this tab has sub-tabs that should expand
                const subTabs = tab.id === 'show' ? SHOW_TABS : tab.id === 'docs' ? DOC_TABS : null
                const subTab = tab.id === 'show' ? showTab : tab.id === 'docs' ? docTab : null
                const setSubTab = tab.id === 'show' ? setShowTab : tab.id === 'docs' ? setDocTab : null
                return (
                  <React.Fragment key={tab.id}>
                    <button
                      onClick={() => setMainTab(tab.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all
                        ${isActive
                          ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-lg'
                          : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                        }`}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                    {/* Accordion sub-tabs expand right after the active parent */}
                    {isActive && subTabs && (
                      <>
                        <div className="w-px h-4 bg-[var(--divider-px)]" />
                        {subTabs.map((st) => {
                          const StIcon = st.icon
                          return (
                            <button
                              key={st.id}
                              onClick={() => setSubTab(st.id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all
                                ${subTab === st.id
                                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow'
                                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                                }`}
                            >
                              <StIcon size={11} />
                              {st.label}
                            </button>
                          )
                        })}
                        <div className="w-px h-4 bg-[var(--divider-px)]" />
                      </>
                    )}
                  </React.Fragment>
                )
              })}
          </div>
        </div>

        {/* Mobile main tabs row (accordion: sub-tabs expand inline) */}
        <div className="sm:hidden flex items-center gap-1 px-2 pb-2 overflow-x-auto">
          {MAIN_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = mainTab === tab.id
            const subTabs = tab.id === 'show' ? SHOW_TABS : tab.id === 'docs' ? DOC_TABS : null
            const subTab = tab.id === 'show' ? showTab : tab.id === 'docs' ? docTab : null
            const setSubTab = tab.id === 'show' ? setShowTab : tab.id === 'docs' ? setDocTab : null
            return (
              <React.Fragment key={tab.id}>
                <button
                  onClick={() => setMainTab(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all whitespace-nowrap shrink-0 min-h-[32px]
                    ${isActive
                      ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow'
                      : 'text-[var(--text-tertiary)]'
                    }`}
                >
                  <Icon size={12} />
                  {tab.label}
                </button>
                {isActive && subTabs && (
                  <>
                    <div className="w-px h-4 bg-[var(--divider-px)] shrink-0" />
                    {subTabs.map((st) => {
                      const StIcon = st.icon
                      return (
                        <button
                          key={st.id}
                          onClick={() => setSubTab(st.id)}
                          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all whitespace-nowrap shrink-0 min-h-[32px]
                            ${subTab === st.id
                              ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow'
                              : 'text-[var(--text-tertiary)]'
                            }`}
                        >
                          <StIcon size={10} />
                          {st.label}
                        </button>
                      )
                    })}
                    <div className="w-px h-4 bg-[var(--divider-px)] shrink-0" />
                  </>
                )}
              </React.Fragment>
            )
          })}
        </div>
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
        {mainTab === 'admin' && <AdminPanel />}
        {mainTab === 'learn' && (
          <PlaceholderPage
            title="Learn"
            icon={GraduationCap}
            description="Courses, tutorials, and resources to help finance professionals get started with AI. From zero to building — at your own pace."
          />
        )}
        {mainTab === 'build' && (
          <PlaceholderPage
            title="Build"
            icon={Hammer}
            description="Open-source tools, templates, and starter kits from the show. Download, remix, and make them yours."
          />
        )}
        {mainTab === 'share' && (
          <PlaceholderPage
            title="Share"
            icon={Share2}
            description="Community submissions, featured builds, and ways to contribute back. Show us what you've cooked up."
          />
        )}
      </div>

      {/* Bottom bar — Docs, Admin, Theme toggle (left side) */}
      <div className="fixed bottom-0 left-0 z-40 flex items-center gap-1 p-2">
        <button
          onClick={() => setMainTab('docs')}
          className={`p-2 rounded-lg transition-all ${mainTab === 'docs' ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-lg' : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
          title="Documentation"
        >
          <BookOpen size={16} />
        </button>
        <button
          onClick={() => setMainTab('admin')}
          className={`p-2 rounded-lg transition-all ${mainTab === 'admin' ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-lg' : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
          title="Admin"
        >
          <Shield size={16} />
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <Toast />
      <AgentChatButton />
    </div>
  )
}
