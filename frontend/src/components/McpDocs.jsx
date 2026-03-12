import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, ChevronDown, ChevronRight, Copy, Check, BookOpen } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Tool catalog                                                       */
/* ------------------------------------------------------------------ */

const TOOL_DOCS = [
  {
    label: 'Episodes',
    id: 'episodes',
    tools: [
      { name: 'episodes_list', description: 'List all episodes with segment and slide counts.', params: [], example: '// No parameters needed\nawait callTool("episodes_list", {})' },
      { name: 'episode_get', description: 'Get full episode with nested segments and slides.', params: [
        { name: 'slug', type: 'string', required: true, description: 'Episode slug (e.g. "ep1")' },
      ], example: 'await callTool("episode_get", {\n  slug: "ep1"\n})' },
      { name: 'episode_create', description: '[Admin] Create a new episode. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'slug', type: 'string', required: true, description: 'URL-friendly slug' },
        { name: 'title', type: 'string', required: true, description: 'Episode title' },
        { name: 'date', type: 'string', required: false, description: 'Air date (ISO format)' },
        { name: 'sortOrder', type: 'number', required: false, description: 'Display order' },
      ], example: 'await callTool("episode_create", {\n  slug: "ep-pilot",\n  title: "The Pilot Episode",\n  date: "2026-03-15"\n})' },
      { name: 'episode_update', description: '[Admin] Update an existing episode. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'slug', type: 'string', required: true, description: 'Episode slug to update' },
        { name: 'title', type: 'string', required: false, description: 'New title' },
        { name: 'date', type: 'string', required: false, description: 'New air date (ISO)' },
        { name: 'sortOrder', type: 'number', required: false, description: 'New display order' },
      ] },
      { name: 'episode_delete', description: '[Admin] Delete an episode and all its content (segments, slides, votes). Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'slug', type: 'string', required: true, description: 'Episode slug to delete' },
      ] },
    ],
  },
  {
    label: 'Segments',
    id: 'segments',
    tools: [
      { name: 'segment_create', description: '[Admin] Create a segment within an episode. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'episodeSlug', type: 'string', required: true, description: 'Parent episode slug' },
        { name: 'slug', type: 'string', required: true, description: 'Segment slug' },
        { name: 'name', type: 'string', required: true, description: 'Segment name' },
        { name: 'status', type: 'enum', required: false, description: '"proposed" | "final"' },
        { name: 'sortOrder', type: 'number', required: false, description: 'Display order' },
      ], example: 'await callTool("segment_create", {\n  episodeSlug: "ep1",\n  slug: "cold-open",\n  name: "Cold Open"\n})' },
      { name: 'segment_update', description: '[Admin] Update a segment. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'id', type: 'string', required: true, description: 'Segment ID (UUID)' },
        { name: 'name', type: 'string', required: false, description: 'New name' },
        { name: 'status', type: 'enum', required: false, description: '"proposed" | "final"' },
        { name: 'sortOrder', type: 'number', required: false, description: 'New display order' },
      ] },
      { name: 'segment_delete', description: '[Admin] Delete a segment and its slides. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'id', type: 'string', required: true, description: 'Segment ID (UUID)' },
      ] },
    ],
  },
  {
    label: 'Slides',
    id: 'slides',
    tools: [
      { name: 'slide_create', description: '[Admin] Create a slide within a segment. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'segmentId', type: 'string', required: true, description: 'Parent segment ID (UUID)' },
        { name: 'type', type: 'enum', required: true, description: '"text" | "link" | "image" | "gallery"' },
        { name: 'title', type: 'string', required: true, description: 'Slide title' },
        { name: 'url', type: 'string', required: false, description: 'Link or image URL' },
        { name: 'notes', type: 'string', required: false, description: 'Presenter notes' },
        { name: 'details', type: 'string', required: false, description: 'Additional details' },
        { name: 'status', type: 'enum', required: false, description: '"proposed" | "final"' },
        { name: 'bullets', type: 'string[]', required: false, description: 'Bullet point list' },
        { name: 'sortOrder', type: 'number', required: false, description: 'Display order' },
      ], example: 'await callTool("slide_create", {\n  segmentId: "uuid-here",\n  type: "text",\n  title: "Key Takeaway",\n  bullets: ["Point 1", "Point 2"]\n})' },
      { name: 'slide_update', description: '[Admin] Update an existing slide. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'id', type: 'string', required: true, description: 'Slide ID (UUID)' },
        { name: 'type', type: 'enum', required: false, description: '"text" | "link" | "image" | "gallery"' },
        { name: 'title', type: 'string', required: false, description: 'New title' },
        { name: 'url', type: 'string', required: false, description: 'Link or image URL' },
        { name: 'notes', type: 'string', required: false, description: 'Presenter notes' },
        { name: 'details', type: 'string', required: false, description: 'Additional details' },
        { name: 'status', type: 'enum', required: false, description: '"proposed" | "final"' },
        { name: 'bullets', type: 'string[]', required: false, description: 'Bullet points' },
        { name: 'sortOrder', type: 'number', required: false, description: 'Display order' },
      ] },
      { name: 'slide_delete', description: '[Admin] Delete a slide. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'id', type: 'string', required: true, description: 'Slide ID (UUID)' },
      ] },
      { name: 'slide_move', description: '[Admin] Move a slide to another segment. Provide either targetSegmentId OR targetEpisodeSlug+targetSegmentSlug (auto-creates segment if needed). Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'id', type: 'string', required: true, description: 'Slide ID (UUID)' },
        { name: 'targetSegmentId', type: 'string', required: false, description: 'Target segment ID' },
        { name: 'targetEpisodeSlug', type: 'string', required: false, description: 'Target episode slug' },
        { name: 'targetSegmentSlug', type: 'string', required: false, description: 'Target segment slug' },
      ], example: 'await callTool("slide_move", {\n  id: "slide-uuid",\n  targetEpisodeSlug: "ep2",\n  targetSegmentSlug: "main-topic"\n})' },
      { name: 'slide_finalize', description: '[Admin] Finalize a slide and its parent segment (sets status to "final"). Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'id', type: 'string', required: true, description: 'Slide ID (UUID)' },
      ] },
    ],
  },
  {
    label: 'Votes',
    id: 'votes',
    tools: [
      { name: 'vote_cast', description: 'Cast an up or down vote on a slide.', params: [
        { name: 'slideId', type: 'string', required: true, description: 'Slide ID (UUID)' },
        { name: 'direction', type: 'enum', required: true, description: '"up" | "down"' },
      ], example: 'await callTool("vote_cast", {\n  slideId: "slide-uuid",\n  direction: "up"\n})' },
      { name: 'votes_get', description: 'Get vote counts for all slides in an episode.', params: [
        { name: 'episodeSlug', type: 'string', required: true, description: 'Episode slug' },
      ], example: 'await callTool("votes_get", {\n  episodeSlug: "ep1"\n})\n// Returns: { "slide-id": { up: 3, down: 0, net: 3 } }' },
    ],
  },
  {
    label: 'Agents',
    id: 'agents',
    tools: [
      { name: 'agents_list', description: 'List all active agents.', params: [], example: 'await callTool("agents_list", {})' },
      { name: 'agent_get', description: 'Get agent details by ID.', params: [
        { name: 'id', type: 'string', required: true, description: 'Agent ID (UUID)' },
      ], example: 'await callTool("agent_get", {\n  id: "agent-uuid"\n})' },
      { name: 'agent_create', description: '[Admin] Create a new agent. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'name', type: 'string', required: true, description: 'Agent display name' },
        { name: 'description', type: 'string', required: true, description: 'Short description' },
        { name: 'instructions', type: 'string', required: true, description: 'System prompt / instructions' },
        { name: 'defaultModel', type: 'string', required: false, description: 'Override default LLM model' },
        { name: 'features', type: 'object', required: false, description: 'Feature flags' },
      ], example: 'await callTool("agent_create", {\n  name: "Research Agent",\n  description: "Helps with research",\n  instructions: "You are a helpful research agent."\n})' },
      { name: 'agent_update', description: '[Admin] Update an agent. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'id', type: 'string', required: true, description: 'Agent ID (UUID)' },
        { name: 'name', type: 'string', required: false, description: 'New name' },
        { name: 'description', type: 'string', required: false, description: 'New description' },
        { name: 'instructions', type: 'string', required: false, description: 'New instructions' },
        { name: 'defaultModel', type: 'string', required: false, description: 'New default model' },
      ] },
      { name: 'agent_delete', description: '[Admin] Soft-delete an agent. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'id', type: 'string', required: true, description: 'Agent ID (UUID)' },
      ] },
    ],
  },
  {
    label: 'Capabilities',
    id: 'capabilities',
    tools: [
      { name: 'capabilities_list', description: '[Admin] List all capabilities with agent counts. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [], example: 'await callTool("capabilities_list", {})' },
      { name: 'capability_create', description: '[Admin] Register a new MCP server capability. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'name', type: 'string', required: true, description: 'Capability name' },
        { name: 'description', type: 'string', required: false, description: 'Description' },
        { name: 'type', type: 'string', required: false, description: '"external" or "internal"' },
        { name: 'serverUrl', type: 'string', required: false, description: 'MCP server URL' },
      ] },
      { name: 'capability_update', description: '[Admin] Update a capability. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'id', type: 'string', required: true, description: 'Capability ID (UUID)' },
        { name: 'name', type: 'string', required: false, description: 'New name' },
        { name: 'description', type: 'string', required: false, description: 'New description' },
        { name: 'serverUrl', type: 'string', required: false, description: 'New server URL' },
      ] },
      { name: 'capability_delete', description: '[Admin] Soft-delete a capability. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'id', type: 'string', required: true, description: 'Capability ID (UUID)' },
      ] },
      { name: 'capability_test', description: '[Admin] Test connection to external MCP server. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'id', type: 'string', required: true, description: 'Capability ID (UUID)' },
      ] },
    ],
  },
  {
    label: 'LLM Config',
    id: 'llm-config',
    tools: [
      { name: 'llm_config_get', description: '[Admin] Get current LLM configuration. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [], example: 'await callTool("llm_config_get", {})' },
      { name: 'llm_config_providers', description: '[Admin] List available LLM providers and models. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [] },
      { name: 'llm_config_set', description: '[Admin] Set LLM provider and model. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'provider', type: 'enum', required: true, description: '"openai" | "anthropic" | "google"' },
        { name: 'model', type: 'string', required: true, description: 'Model ID (e.g. "gpt-4o-mini")' },
      ] },
      { name: 'llm_config_set_key', description: '[Admin] Save encrypted API key for a provider. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'provider', type: 'enum', required: true, description: '"openai" | "anthropic" | "google"' },
        { name: 'apiKey', type: 'string', required: true, description: 'API key (stored encrypted)' },
      ] },
      { name: 'llm_config_delete_key', description: '[Admin] Delete stored API key for a provider. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [
        { name: 'provider', type: 'string', required: true, description: 'Provider name' },
      ] },
    ],
  },
  {
    label: 'Admin',
    id: 'admin',
    tools: [
      { name: 'admin_seed', description: '[Admin] Seed database from JSON files. Clears existing data and reloads from seed files. Requires FINANCEISCOOKED_ADMIN_KEY env var.', params: [] },
      { name: 'admin_stats', description: 'Get database statistics (episode, segment, slide, vote counts).', params: [], example: 'await callTool("admin_stats", {})\n// Returns: { episodes: 22, segments: 189, slides: 62, votes: 0 }' },
      { name: 'health_check', description: 'Check API health status.', params: [], example: 'await callTool("health_check", {})\n// Returns: { status: "healthy", timestamp: "..." }' },
    ],
  },
]

const totalTools = TOOL_DOCS.reduce((sum, cat) => sum + cat.tools.length, 0)

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border-none cursor-pointer"
      style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function ParamsTable({ params }) {
  if (params.length === 0) {
    return <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No parameters</p>
  }
  return (
    <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border-default)' }}>
      <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg-primary)' }}>
            <th className="text-left py-1.5 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>Name</th>
            <th className="text-left py-1.5 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>Type</th>
            <th className="text-left py-1.5 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>Req</th>
            <th className="text-left py-1.5 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr key={p.name} style={{ background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-primary)' }}>
              <td className="py-1.5 px-3 font-mono text-xs" style={{ color: 'var(--accent-secondary)' }}>{p.name}</td>
              <td className="py-1.5 px-3 text-xs" style={{ color: 'var(--text-muted)' }}>{p.type}</td>
              <td className="py-1.5 px-3 text-xs">
                {p.required
                  ? <span className="font-semibold" style={{ color: '#D94E2A' }}>yes</span>
                  : <span style={{ color: 'var(--text-muted)' }}>no</span>}
              </td>
              <td className="py-1.5 px-3 text-xs" style={{ color: 'var(--text-primary)' }}>{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ToolCard({ tool }) {
  const [showExample, setShowExample] = useState(false)
  return (
    <div
      className="rounded-[10px] p-[18px] mb-3"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <code
            className="text-[13px] font-semibold px-2 py-0.5 rounded font-mono"
            style={{ background: 'var(--bg-subtle)', color: 'var(--accent-link)' }}
          >
            {tool.name}
          </code>
          <CopyButton text={tool.name} />
        </div>
      </div>
      <p className="text-[13px] mb-3" style={{ color: 'var(--text-secondary)' }}>
        {tool.description}
      </p>
      <ParamsTable params={tool.params} />
      {tool.example && (
        <div className="mt-3">
          <button
            onClick={() => setShowExample(!showExample)}
            className="flex items-center gap-1 text-xs font-medium border-none cursor-pointer p-0 bg-transparent"
            style={{ color: 'var(--accent-link)' }}
          >
            {showExample ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Example
          </button>
          {showExample && (
            <div className="mt-2 relative">
              <pre
                className="text-xs p-3 rounded-md overflow-auto"
                style={{ background: 'var(--input-bg)', color: '#7ee787', border: '1px solid var(--border-default)' }}
              >
                <button
                  onClick={() => navigator.clipboard.writeText(tool.example)}
                  className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] border-none cursor-pointer"
                  style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                >
                  Copy
                </button>
                {tool.example}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function McpDocs() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const sectionRefs = useRef({})

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return TOOL_DOCS.map(cat => ({
      ...cat,
      tools: cat.tools.filter(t =>
        (!q || t.name.includes(q) || t.description.toLowerCase().includes(q) || t.params.some(p => p.name.includes(q))) &&
        (!activeCategory || activeCategory === cat.id)
      ),
    })).filter(cat => cat.tools.length > 0)
  }, [search, activeCategory])

  const matchCount = filtered.reduce((sum, cat) => sum + cat.tools.length, 0)

  // Intersection observer for sidebar highlights
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(null) // don't override manual selection
          }
        })
      },
      { threshold: 0.3 }
    )
    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [filtered])

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div
        className="w-60 shrink-0 flex flex-col overflow-y-auto"
        style={{ borderRight: '1px solid var(--border-default)', background: 'var(--bg-primary)' }}
      >
        <div className="p-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={16} style={{ color: '#D94E2A' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>MCP Documentation</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{totalTools} tools across {TOOL_DOCS.length} categories</p>
        </div>

        <div className="p-3 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Categories
          </p>
          {TOOL_DOCS.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(activeCategory === cat.id ? null : cat.id)
                const el = sectionRefs.current[cat.id]
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer border-none transition-all"
              style={{
                background: activeCategory === cat.id ? 'var(--bg-hover)' : 'transparent',
                color: activeCategory === cat.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {cat.label}
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
              >
                {cat.tools.length}
              </span>
            </button>
          ))}
          {activeCategory && (
            <button
              onClick={() => setActiveCategory(null)}
              className="w-full text-center py-1.5 text-[11px] border-none cursor-pointer rounded-lg"
              style={{ background: 'var(--bg-subtle)', color: 'var(--accent-link)' }}
            >
              Show all categories
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-8" style={{ maxWidth: 800 }}>
        {/* Header */}
        <div className="mb-8">
          <div className="w-8 h-[3px] rounded mb-4" style={{ background: '#D94E2A' }} />
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={24} style={{ color: '#D94E2A' }} />
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>MCP Documentation</h2>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {totalTools} tools for managing financeiscooked episodes, segments, slides, votes, and admin operations via the Model Context Protocol.
          </p>

          {/* Search */}
          <div className="relative" style={{ maxWidth: 460 }}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search tools, parameters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-2.5 pl-10 pr-16 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
            {search && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>
                {matchCount} result{matchCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Tool sections */}
        {filtered.map(cat => (
          <div key={cat.id} ref={el => sectionRefs.current[cat.id] = el} className="mb-8">
            <h3
              className="text-xs font-semibold uppercase tracking-wider pb-2 mb-3 sticky top-0 z-10 pt-2"
              style={{
                color: 'var(--text-muted)',
                borderBottom: '1px solid var(--border-default)',
                background: 'var(--bg-primary)',
              }}
            >
              {cat.label}
            </h3>
            {cat.tools.map(tool => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>
            No tools match your search.
          </p>
        )}
      </div>
    </div>
  )
}
