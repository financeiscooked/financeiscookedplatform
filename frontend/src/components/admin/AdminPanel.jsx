import { useState, useEffect, useCallback, useMemo } from 'react'
import { Shield, Bot, Settings, Database, Brain, LogOut, Plus, Pencil, Trash2, Search, Upload, Eye, RefreshCw, Key, Check, X, ChevronDown } from 'lucide-react'
import { createAdminApi } from '../../lib/api'
import { toast } from '../Toast'

// ─── Auth Gate ───────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const api = createAdminApi(key)
      await api.get('/llm-config')
      localStorage.setItem('admin-key', key)
      onLogin(key)
    } catch (err) {
      setError(err.message?.includes('401') || err.message?.includes('Unauthorized') ? 'Invalid admin key' : err.message || 'Failed to authenticate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
        <div className="flex items-center gap-3 mb-6">
          <Shield size={24} className="text-[#D94E2A]" />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Admin Access</h2>
        </div>
        <p className="text-sm text-[var(--text-tertiary)] mb-6">Enter your admin key to access the management panel.</p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin key"
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm focus:outline-none focus:border-[#D94E2A] mb-4"
          autoFocus
        />
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading || !key}
          className="w-full px-4 py-3 rounded-xl bg-[#D94E2A] text-white font-bold text-sm hover:bg-[#B8401F] disabled:opacity-50 transition-all"
        >
          {loading ? 'Verifying...' : 'Authenticate'}
        </button>
      </form>
    </div>
  )
}

// ─── Sub-tab Definitions ─────────────────────────────────────────────
const ADMIN_TABS = [
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'llm', label: 'LLM Config', icon: Settings },
  { id: 'knowledge', label: 'Knowledge Base', icon: Database },
  { id: 'memory', label: 'Agent Memory', icon: Brain },
]

// ─── Agent Manager ───────────────────────────────────────────────────
function AgentManager({ api }) {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | 'new' | agent object
  const [form, setForm] = useState({ name: '', slug: '', description: '', instructions: '', defaultModel: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/agents')
      setAgents(res.data || [])
    } catch (e) { toast('Failed to load agents: ' + e.message) }
    finally { setLoading(false) }
  }, [api])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setForm({ name: '', slug: '', description: '', instructions: '', defaultModel: '' })
    setEditing('new')
  }

  const openEdit = (agent) => {
    setForm({
      name: agent.name || '',
      slug: agent.slug || '',
      description: agent.description || '',
      instructions: agent.instructions || '',
      defaultModel: agent.defaultModel || '',
    })
    setEditing(agent)
  }

  const save = async () => {
    try {
      if (editing === 'new') {
        await api.post('/agents', form)
        toast('Agent created')
      } else {
        await api.patch(`/agents/${editing.id}`, form)
        toast('Agent updated')
      }
      setEditing(null)
      load()
    } catch (e) { toast('Error: ' + e.message) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this agent?')) return
    try {
      await api.del(`/agents/${id}`)
      toast('Agent deleted')
      load()
    } catch (e) { toast('Error: ' + e.message) }
  }

  if (editing) {
    return (
      <div className="p-6 max-w-2xl">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">{editing === 'new' ? 'Create Agent' : 'Edit Agent'}</h3>
        <div className="space-y-3">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} />
          <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          <Field label="Instructions" value={form.instructions} onChange={(v) => setForm({ ...form, instructions: v })} multiline />
          <Field label="Default Model" value={form.defaultModel} onChange={(v) => setForm({ ...form, defaultModel: v })} placeholder="e.g. gpt-4o" />
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={save} className="px-4 py-2 rounded-xl bg-[#D94E2A] text-white text-sm font-bold hover:bg-[#B8401F] transition-all flex items-center gap-2"><Check size={14} />Save</button>
          <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-sm font-bold hover:bg-[var(--bg-hover)] transition-all flex items-center gap-2"><X size={14} />Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Agents</h3>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"><RefreshCw size={14} /></button>
          <button onClick={openNew} className="px-3 py-2 rounded-xl bg-[#D94E2A] text-white text-xs font-bold hover:bg-[#B8401F] transition-all flex items-center gap-1"><Plus size={14} />New Agent</button>
        </div>
      </div>
      {loading ? <p className="text-sm text-[var(--text-tertiary)]">Loading...</p> : agents.length === 0 ? <p className="text-sm text-[var(--text-tertiary)]">No agents found.</p> : (
        <div className="space-y-2">
          {agents.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <div>
                <div className="font-bold text-sm text-[var(--text-primary)]">{a.name}</div>
                <div className="text-xs text-[var(--text-tertiary)]">{a.slug} {a.defaultModel ? `| ${a.defaultModel}` : ''}</div>
                {a.description && <div className="text-xs text-[var(--text-tertiary)] mt-1">{a.description}</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(a)} className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"><Pencil size={14} /></button>
                <button onClick={() => remove(a.id)} className="p-2 rounded-lg bg-[var(--bg-subtle)] text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── LLM Configuration ───────────────────────────────────────────────
function LlmConfig({ api }) {
  const [config, setConfig] = useState(null)
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [providerInput, setProviderInput] = useState('')
  const [modelInput, setModelInput] = useState('')
  const [keyProvider, setKeyProvider] = useState('')
  const [keyValue, setKeyValue] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cfgRes, provRes] = await Promise.all([
        api.get('/llm-config'),
        api.get('/llm-config/providers'),
      ])
      setConfig(cfgRes.data || cfgRes)
      setProviders(provRes.data || [])
      if (cfgRes.data) {
        setProviderInput(cfgRes.data.provider || '')
        setModelInput(cfgRes.data.model || '')
      }
    } catch (e) { toast('Failed to load LLM config: ' + e.message) }
    finally { setLoading(false) }
  }, [api])

  useEffect(() => { load() }, [load])

  const saveConfig = async () => {
    try {
      await api.put('/llm-config', { provider: providerInput, model: modelInput })
      toast('LLM config updated')
      load()
    } catch (e) { toast('Error: ' + e.message) }
  }

  const saveKey = async () => {
    if (!keyProvider || !keyValue) return
    try {
      await api.put('/llm-config/api-key', { provider: keyProvider, key: keyValue })
      toast(`API key saved for ${keyProvider}`)
      setKeyValue('')
      load()
    } catch (e) { toast('Error: ' + e.message) }
  }

  const deleteKey = async (provider) => {
    if (!confirm(`Delete API key for ${provider}?`)) return
    try {
      await api.del(`/llm-config/api-key/${provider}`)
      toast(`API key deleted for ${provider}`)
      load()
    } catch (e) { toast('Error: ' + e.message) }
  }

  if (loading) return <div className="p-6 text-sm text-[var(--text-tertiary)]">Loading...</div>

  return (
    <div className="p-6 max-w-2xl space-y-8">
      {/* Current Config */}
      <section>
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Current Configuration</h3>
        {config && (
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-sm space-y-1">
            <div><span className="text-[var(--text-tertiary)]">Provider:</span> <span className="text-[var(--text-primary)] font-mono">{config.provider || 'Not set'}</span></div>
            <div><span className="text-[var(--text-tertiary)]">Model:</span> <span className="text-[var(--text-primary)] font-mono">{config.model || 'Not set'}</span></div>
          </div>
        )}
      </section>

      {/* Set Provider/Model */}
      <section>
        <h3 className="text-base font-bold text-[var(--text-primary)] mb-3">Set Provider & Model</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">Provider</label>
            <input value={providerInput} onChange={(e) => setProviderInput(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#D94E2A]" placeholder="openai" />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">Model</label>
            <input value={modelInput} onChange={(e) => setModelInput(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#D94E2A]" placeholder="gpt-4o" />
          </div>
          <button onClick={saveConfig} className="px-4 py-2 rounded-xl bg-[#D94E2A] text-white text-sm font-bold hover:bg-[#B8401F] transition-all whitespace-nowrap">Save</button>
        </div>
      </section>

      {/* Available Providers */}
      {providers.length > 0 && (
        <section>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-3">Available Providers</h3>
          <div className="space-y-2">
            {providers.map((p) => (
              <div key={p.id || p.name} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[var(--text-primary)]">{p.name || p.id}</span>
                    {p.hasKey && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Key configured</span>}
                    {p.keyPrefix && <span className="ml-2 text-xs text-[var(--text-tertiary)] font-mono">{p.keyPrefix}...</span>}
                  </div>
                  {p.hasKey && (
                    <button onClick={() => deleteKey(p.name || p.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                  )}
                </div>
                {p.models && p.models.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.models.map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-xs text-[var(--text-tertiary)] font-mono">{m}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Save API Key */}
      <section>
        <h3 className="text-base font-bold text-[var(--text-primary)] mb-3">Save API Key</h3>
        <div className="flex gap-3 items-end">
          <div className="w-40">
            <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">Provider</label>
            <input value={keyProvider} onChange={(e) => setKeyProvider(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#D94E2A]" placeholder="openai" />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">API Key</label>
            <input type="password" value={keyValue} onChange={(e) => setKeyValue(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#D94E2A]" placeholder="sk-..." />
          </div>
          <button onClick={saveKey} className="px-4 py-2 rounded-xl bg-[#D94E2A] text-white text-sm font-bold hover:bg-[#B8401F] transition-all flex items-center gap-1"><Key size={14} />Save</button>
        </div>
      </section>
    </div>
  )
}

// ─── Knowledge Base ──────────────────────────────────────────────────
function KnowledgeBase({ api, agents }) {
  const [agentId, setAgentId] = useState('')
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({ name: '', content: '', sourceType: '' })

  const loadDocs = useCallback(async () => {
    if (!agentId) return
    setLoading(true)
    try {
      const res = await api.get(`/agents/${agentId}/documents`)
      setDocs(res.data || [])
      setSearchResults(null)
    } catch (e) { toast('Failed to load documents: ' + e.message) }
    finally { setLoading(false) }
  }, [api, agentId])

  useEffect(() => { if (agentId) loadDocs() }, [agentId, loadDocs])

  const search = async () => {
    if (!agentId || !searchQuery) return
    try {
      const res = await api.get(`/agents/${agentId}/documents/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchResults(res.data || [])
    } catch (e) { toast('Search failed: ' + e.message) }
  }

  const upload = async () => {
    if (!agentId || !uploadForm.name || !uploadForm.content) return
    try {
      const body = { name: uploadForm.name, content: uploadForm.content }
      if (uploadForm.sourceType) body.sourceType = uploadForm.sourceType
      await api.post(`/agents/${agentId}/documents`, body)
      toast('Document uploaded')
      setUploadForm({ name: '', content: '', sourceType: '' })
      setUploading(false)
      loadDocs()
    } catch (e) { toast('Error: ' + e.message) }
  }

  const remove = async (docId) => {
    if (!confirm('Delete this document?')) return
    try {
      await api.del(`/agents/${agentId}/documents/${docId}`)
      toast('Document deleted')
      loadDocs()
    } catch (e) { toast('Error: ' + e.message) }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Knowledge Base</h3>

      {/* Agent Selector */}
      <AgentSelector agents={agents} value={agentId} onChange={setAgentId} />

      {!agentId ? <p className="text-sm text-[var(--text-tertiary)] mt-4">Select an agent to manage its knowledge base.</p> : (
        <div className="mt-4 space-y-6">
          {/* Search */}
          <div className="flex gap-2">
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search documents..." className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#D94E2A]" onKeyDown={(e) => e.key === 'Enter' && search()} />
            <button onClick={search} className="px-3 py-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"><Search size={14} /></button>
            <button onClick={() => { setUploading(true) }} className="px-3 py-2 rounded-xl bg-[#D94E2A] text-white text-xs font-bold hover:bg-[#B8401F] transition-all flex items-center gap-1"><Upload size={14} />Upload</button>
            <button onClick={loadDocs} className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"><RefreshCw size={14} /></button>
          </div>

          {/* Upload Form */}
          {uploading && (
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-3">
              <Field label="Name" value={uploadForm.name} onChange={(v) => setUploadForm({ ...uploadForm, name: v })} />
              <Field label="Content" value={uploadForm.content} onChange={(v) => setUploadForm({ ...uploadForm, content: v })} multiline />
              <Field label="Source Type (optional)" value={uploadForm.sourceType} onChange={(v) => setUploadForm({ ...uploadForm, sourceType: v })} placeholder="e.g. manual, url, pdf" />
              <div className="flex gap-2">
                <button onClick={upload} className="px-4 py-2 rounded-xl bg-[#D94E2A] text-white text-sm font-bold hover:bg-[#B8401F] transition-all flex items-center gap-2"><Check size={14} />Upload</button>
                <button onClick={() => setUploading(false)} className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-sm font-bold hover:bg-[var(--bg-hover)] transition-all"><X size={14} /></button>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults && (
            <div>
              <h4 className="text-sm font-bold text-[var(--text-secondary)] mb-2">Search Results ({searchResults.length})</h4>
              <DocList docs={searchResults} onDelete={remove} />
            </div>
          )}

          {/* Documents List */}
          {loading ? <p className="text-sm text-[var(--text-tertiary)]">Loading...</p> : (
            <div>
              <h4 className="text-sm font-bold text-[var(--text-secondary)] mb-2">All Documents ({docs.length})</h4>
              <DocList docs={docs} onDelete={remove} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Agent Memory ────────────────────────────────────────────────────
function AgentMemory({ api, agents }) {
  const [agentId, setAgentId] = useState('')
  const [memDocs, setMemDocs] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [viewContent, setViewContent] = useState('')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ docKey: '', content: '', docType: '' })

  const load = useCallback(async () => {
    if (!agentId) return
    setLoading(true)
    try {
      const res = await api.get(`/agents/${agentId}/memory`)
      setMemDocs(res.data || [])
    } catch (e) { toast('Failed to load memory: ' + e.message) }
    finally { setLoading(false) }
  }, [api, agentId])

  useEffect(() => { if (agentId) load() }, [agentId, load])

  const viewDoc = async (docKey) => {
    try {
      const res = await api.get(`/agents/${agentId}/memory/${encodeURIComponent(docKey)}`)
      setViewing(docKey)
      setViewContent(typeof res.data === 'string' ? res.data : (res.data?.content || JSON.stringify(res.data, null, 2)))
    } catch (e) { toast('Error: ' + e.message) }
  }

  const saveMemory = async () => {
    if (!agentId || !editForm.docKey || !editForm.content) return
    try {
      const body = { content: editForm.content }
      if (editForm.docType) body.docType = editForm.docType
      await api.put(`/agents/${agentId}/memory/${encodeURIComponent(editForm.docKey)}`, body)
      toast('Memory saved')
      setEditing(false)
      setEditForm({ docKey: '', content: '', docType: '' })
      load()
    } catch (e) { toast('Error: ' + e.message) }
  }

  const remove = async (docKey) => {
    if (!confirm(`Delete memory "${docKey}"?`)) return
    try {
      await api.del(`/agents/${agentId}/memory/${encodeURIComponent(docKey)}`)
      toast('Memory deleted')
      load()
    } catch (e) { toast('Error: ' + e.message) }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Agent Memory</h3>

      <AgentSelector agents={agents} value={agentId} onChange={setAgentId} />

      {!agentId ? <p className="text-sm text-[var(--text-tertiary)] mt-4">Select an agent to manage its memory.</p> : (
        <div className="mt-4 space-y-6">
          <div className="flex gap-2">
            <button onClick={() => { setEditing(true); setViewing(null) }} className="px-3 py-2 rounded-xl bg-[#D94E2A] text-white text-xs font-bold hover:bg-[#B8401F] transition-all flex items-center gap-1"><Plus size={14} />Create/Update Memory</button>
            <button onClick={load} className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"><RefreshCw size={14} /></button>
          </div>

          {/* Create/Update Form */}
          {editing && (
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-3">
              <Field label="Document Key" value={editForm.docKey} onChange={(v) => setEditForm({ ...editForm, docKey: v })} placeholder="e.g. personality, guidelines" />
              <Field label="Content" value={editForm.content} onChange={(v) => setEditForm({ ...editForm, content: v })} multiline />
              <Field label="Doc Type (optional)" value={editForm.docType} onChange={(v) => setEditForm({ ...editForm, docType: v })} placeholder="e.g. context, rules" />
              <div className="flex gap-2">
                <button onClick={saveMemory} className="px-4 py-2 rounded-xl bg-[#D94E2A] text-white text-sm font-bold hover:bg-[#B8401F] transition-all flex items-center gap-2"><Check size={14} />Save</button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-sm font-bold hover:bg-[var(--bg-hover)] transition-all"><X size={14} /></button>
              </div>
            </div>
          )}

          {/* View Memory */}
          {viewing && (
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-[var(--text-primary)] font-mono">{viewing}</h4>
                <button onClick={() => setViewing(null)} className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><X size={14} /></button>
              </div>
              <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap bg-[var(--bg-primary)] p-3 rounded-lg overflow-auto max-h-64">{viewContent}</pre>
            </div>
          )}

          {/* Memory List */}
          {loading ? <p className="text-sm text-[var(--text-tertiary)]">Loading...</p> : memDocs.length === 0 ? <p className="text-sm text-[var(--text-tertiary)]">No memory documents.</p> : (
            <div className="space-y-2">
              {memDocs.map((doc) => {
                const key = doc.docKey || doc.key || doc.id
                return (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                    <div>
                      <div className="font-bold text-sm text-[var(--text-primary)] font-mono">{key}</div>
                      {doc.docType && <div className="text-xs text-[var(--text-tertiary)]">{doc.docType}</div>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => viewDoc(key)} className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"><Eye size={14} /></button>
                      <button onClick={() => { setEditForm({ docKey: key, content: '', docType: doc.docType || '' }); setEditing(true); setViewing(null) }} className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"><Pencil size={14} /></button>
                      <button onClick={() => remove(key)} className="p-2 rounded-lg bg-[var(--bg-subtle)] text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Shared Components ───────────────────────────────────────────────
function Field({ label, value, onChange, multiline, placeholder }) {
  const cls = "w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#D94E2A] placeholder:text-[var(--text-tertiary)]"
  return (
    <div>
      <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={5} className={cls + " resize-y"} placeholder={placeholder} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} placeholder={placeholder} />
      )}
    </div>
  )
}

function AgentSelector({ agents, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">Agent</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-xs px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#D94E2A]"
      >
        <option value="">Select an agent...</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>{a.name} ({a.slug})</option>
        ))}
      </select>
    </div>
  )
}

function DocList({ docs, onDelete }) {
  if (!docs || docs.length === 0) return <p className="text-sm text-[var(--text-tertiary)]">No documents.</p>
  return (
    <div className="space-y-2">
      {docs.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm text-[var(--text-primary)] truncate">{doc.name || doc.id}</div>
            <div className="text-xs text-[var(--text-tertiary)]">
              {doc.sourceType && <span>{doc.sourceType} | </span>}
              {doc.chunkCount != null && <span>{doc.chunkCount} chunks | </span>}
              {doc.createdAt && <span>{new Date(doc.createdAt).toLocaleDateString()}</span>}
            </div>
          </div>
          <button onClick={() => onDelete(doc.id)} className="p-2 rounded-lg bg-[var(--bg-subtle)] text-red-400 hover:bg-red-500/10 transition-all shrink-0"><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  )
}

// ─── Main Admin Panel ────────────────────────────────────────────────
export default function AdminPanel() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('admin-key') || '')
  const [authenticated, setAuthenticated] = useState(false)
  const [adminTab, setAdminTab] = useState('agents')
  const [agents, setAgents] = useState([])

  const api = useMemo(() => adminKey ? createAdminApi(adminKey) : null, [adminKey])

  // Auto-validate stored key on mount
  useEffect(() => {
    if (!adminKey) return
    const validate = async () => {
      try {
        const a = createAdminApi(adminKey)
        await a.get('/llm-config')
        setAuthenticated(true)
      } catch {
        localStorage.removeItem('admin-key')
        setAdminKey('')
      }
    }
    validate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load agents list for Knowledge Base and Memory tabs
  useEffect(() => {
    if (!authenticated || !api) return
    api.get('/agents').then((res) => setAgents(res.data || [])).catch(() => {})
  }, [authenticated, api])

  const handleLogin = (key) => {
    setAdminKey(key)
    setAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin-key')
    setAdminKey('')
    setAuthenticated(false)
  }

  if (!authenticated) {
    return (
      <div className="h-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <AdminLogin onLogin={handleLogin} />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
      {/* Admin sub-tabs header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-subtle)] shrink-0">
        <div className="flex items-center gap-1 bg-[var(--bg-subtle)] rounded-xl p-1">
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all
                  ${adminTab === tab.id
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
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={12} />
          Logout
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {adminTab === 'agents' && <AgentManager api={api} />}
        {adminTab === 'llm' && <LlmConfig api={api} />}
        {adminTab === 'knowledge' && <KnowledgeBase api={api} agents={agents} />}
        {adminTab === 'memory' && <AgentMemory api={api} agents={agents} />}
      </div>
    </div>
  )
}
