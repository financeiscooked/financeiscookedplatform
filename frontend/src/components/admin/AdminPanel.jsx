import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Shield, Bot, Settings, Database, Brain, LogOut, Plus, Pencil, Trash2,
  Search, Upload, Eye, RefreshCw, Key, Check, X, ChevronDown, ChevronRight,
  Plug, ToggleLeft, ToggleRight, Cpu, Globe, Package, Zap, TestTube2,
  FileText, AlertCircle, Loader2,
} from 'lucide-react'
import { createAdminApi } from '../../lib/api'
import { toast } from '../Toast'

// ─── Constants ──────────────────────────────────────────────────────
const AVAILABLE_MODELS = {
  openai: [
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'o1', label: 'O1' },
    { id: 'o3-mini', label: 'O3 Mini' },
  ],
  anthropic: [
    { id: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  ],
  google: [
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  ],
}

const PROVIDER_COLORS = {
  openai: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/40', accent: '#10b981' },
  anthropic: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/40', accent: '#f97316' },
  google: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/40', accent: '#3b82f6' },
}

const ALL_MODELS_FLAT = Object.entries(AVAILABLE_MODELS).flatMap(([provider, models]) =>
  models.map((m) => ({ ...m, provider }))
)

function getProviderForModel(modelId) {
  for (const [provider, models] of Object.entries(AVAILABLE_MODELS)) {
    if (models.some((m) => m.id === modelId)) return provider
  }
  return null
}

function getProviderColor(provider) {
  return PROVIDER_COLORS[provider] || { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/40', accent: '#6b7280' }
}

const ADMIN_TABS = [
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'mcp', label: 'MCP Hub', icon: Plug },
  { id: 'llm', label: 'LLM Config', icon: Cpu },
]

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

// ─── Shared Components ───────────────────────────────────────────────
function Field({ label, value, onChange, multiline, placeholder, rows, disabled }) {
  const cls = "w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#D94E2A] placeholder:text-[var(--text-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed"
  return (
    <div>
      <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows || 5} className={cls + " resize-y"} placeholder={placeholder} disabled={disabled} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} placeholder={placeholder} disabled={disabled} />
      )}
    </div>
  )
}

function ModelBadge({ modelId }) {
  const provider = getProviderForModel(modelId)
  const colors = getProviderColor(provider)
  const model = ALL_MODELS_FLAT.find((m) => m.id === modelId)
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}>
      {model?.label || modelId || 'No model'}
    </span>
  )
}

function ModelDropdown({ value, onChange }) {
  return (
    <div>
      <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">Model</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#D94E2A]"
      >
        <option value="">Select a model...</option>
        {Object.entries(AVAILABLE_MODELS).map(([provider, models]) => (
          <optgroup key={provider} label={provider.charAt(0).toUpperCase() + provider.slice(1)}>
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}

function TabButton({ active, onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all
        ${disabled ? 'opacity-40 cursor-not-allowed text-[var(--text-tertiary)]' :
          active ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-lg' :
          'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
        }`}
    >
      {children}
    </button>
  )
}

function DisabledTabMessage({ tabName }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle size={32} className="text-[var(--text-tertiary)] mb-3" />
      <p className="text-sm text-[var(--text-tertiary)]">Save the agent first to configure {tabName}.</p>
    </div>
  )
}

function Spinner() {
  return <Loader2 size={16} className="animate-spin text-[var(--text-tertiary)]" />
}

// ─── Agent Config Modal ──────────────────────────────────────────────
function AgentConfigModal({ api, agent, onClose, onSaved }) {
  const isNew = !agent
  const [modalTab, setModalTab] = useState('general')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: agent?.name || '',
    slug: agent?.slug || '',
    description: agent?.description || '',
    instructions: agent?.instructions || '',
  })

  // Knowledge Base state
  const [docs, setDocs] = useState([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({ name: '', content: '', sourceType: '' })
  const [dragOver, setDragOver] = useState(false)

  // Memory state
  const [memDocs, setMemDocs] = useState([])
  const [memLoading, setMemLoading] = useState(false)
  const [memEditing, setMemEditing] = useState(false)
  const [memForm, setMemForm] = useState({ docKey: '', content: '' })
  const [memViewing, setMemViewing] = useState(null)
  const [memViewContent, setMemViewContent] = useState('')

  // MCP Capabilities state
  const [allCaps, setAllCaps] = useState([])
  const [agentCaps, setAgentCaps] = useState([])
  const [capsLoading, setCapsLoading] = useState(false)

  const agentId = agent?.id

  // Load knowledge base docs
  const loadDocs = useCallback(async () => {
    if (!agentId) return
    setDocsLoading(true)
    try {
      const res = await api.get(`/agents/${agentId}/documents`)
      setDocs(res.data || [])
      setSearchResults(null)
    } catch (e) { toast('Failed to load documents: ' + e.message) }
    finally { setDocsLoading(false) }
  }, [api, agentId])

  // Load memory docs
  const loadMemory = useCallback(async () => {
    if (!agentId) return
    setMemLoading(true)
    try {
      const res = await api.get(`/agents/${agentId}/memory`)
      setMemDocs(res.data || [])
    } catch (e) { toast('Failed to load memory: ' + e.message) }
    finally { setMemLoading(false) }
  }, [api, agentId])

  // Load capabilities
  const loadCaps = useCallback(async () => {
    if (!agentId) return
    setCapsLoading(true)
    try {
      const [allRes, agentRes] = await Promise.all([
        api.get('/capabilities'),
        api.get(`/agents/${agentId}/capabilities`),
      ])
      setAllCaps(allRes.data || [])
      setAgentCaps(agentRes.data || [])
    } catch (e) { toast('Failed to load capabilities: ' + e.message) }
    finally { setCapsLoading(false) }
  }, [api, agentId])

  // Load tab data on switch
  useEffect(() => {
    if (!agentId) return
    if (modalTab === 'knowledge') loadDocs()
    if (modalTab === 'memory') loadMemory()
    if (modalTab === 'mcphub') loadCaps()
  }, [modalTab, agentId, loadDocs, loadMemory, loadCaps])

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast('Agent name is required')
      return
    }
    setSaving(true)
    try {
      if (isNew) {
        const res = await api.post('/agents', form)
        toast('Agent created')
        onSaved(res.data || res)
      } else {
        await api.patch(`/agents/${agentId}`, form)
        toast('Agent updated')
        onSaved(null)
      }
    } catch (e) { toast('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  // Knowledge Base actions
  const searchDocs = async () => {
    if (!agentId || !searchQuery) return
    try {
      const res = await api.get(`/agents/${agentId}/documents/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchResults(res.data || [])
    } catch (e) { toast('Search failed: ' + e.message) }
  }

  const uploadDoc = async () => {
    if (!agentId || !uploadForm.name || !uploadForm.content) return
    try {
      const payload = { name: uploadForm.name, content: uploadForm.content }
      if (uploadForm.sourceType) payload.sourceType = uploadForm.sourceType
      await api.post(`/agents/${agentId}/documents`, payload)
      toast('Document uploaded')
      setUploadForm({ name: '', content: '', sourceType: '' })
      setUploading(false)
      loadDocs()
    } catch (e) { toast('Error: ' + e.message) }
  }

  const handleFileRead = (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    const allowed = ['txt', 'md', 'csv', 'json', 'pdf']
    if (!allowed.includes(ext)) {
      toast('Unsupported file type. Allowed: .txt, .md, .csv, .json, .pdf')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadForm({ name: file.name, content: e.target.result, sourceType: ext })
      setUploading(true)
    }
    reader.readAsText(file)
  }

  const handleFileDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    handleFileRead(file)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    handleFileRead(file)
  }

  const deleteDoc = async (docId) => {
    if (!confirm('Delete this document?')) return
    try {
      await api.del(`/agents/${agentId}/documents/${docId}`)
      toast('Document deleted')
      loadDocs()
    } catch (e) { toast('Error: ' + e.message) }
  }

  // Memory actions
  const viewMemory = async (docKey) => {
    try {
      const res = await api.get(`/agents/${agentId}/memory/${encodeURIComponent(docKey)}`)
      setMemViewing(docKey)
      setMemViewContent(typeof res.data === 'string' ? res.data : (res.data?.content || JSON.stringify(res.data, null, 2)))
    } catch (e) { toast('Error: ' + e.message) }
  }

  const saveMemory = async () => {
    if (!agentId || !memForm.docKey || !memForm.content) return
    try {
      await api.put(`/agents/${agentId}/memory/${encodeURIComponent(memForm.docKey)}`, { content: memForm.content })
      toast('Memory saved')
      setMemEditing(false)
      setMemForm({ docKey: '', content: '' })
      loadMemory()
    } catch (e) { toast('Error: ' + e.message) }
  }

  const deleteMemory = async (docKey) => {
    if (!confirm(`Delete memory "${docKey}"?`)) return
    try {
      await api.del(`/agents/${agentId}/memory/${encodeURIComponent(docKey)}`)
      toast('Memory deleted')
      loadMemory()
    } catch (e) { toast('Error: ' + e.message) }
  }

  // MCP Hub actions
  const isCapEnabled = (capId) => agentCaps.some((c) => (c.capabilityId || c.id) === capId)

  const toggleCap = async (capId) => {
    try {
      if (isCapEnabled(capId)) {
        await api.del(`/agents/${agentId}/capabilities/${capId}`)
        toast('Capability disabled')
      } else {
        await api.put(`/agents/${agentId}/capabilities/${capId}`, {})
        toast('Capability enabled')
      }
      loadCaps()
    } catch (e) { toast('Error: ' + e.message) }
  }

  const MODAL_TABS = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'knowledge', label: 'Knowledge Base', icon: Database },
    { id: 'memory', label: 'Memory', icon: Brain },
    { id: 'mcphub', label: 'MCP Hub', icon: Plug },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] shrink-0">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {isNew ? 'Create Agent' : `Edit: ${agent.name}`}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] shrink-0">
          {MODAL_TABS.map((tab) => {
            const Icon = tab.icon
            const disabled = isNew && tab.id !== 'general'
            return (
              <TabButton key={tab.id} active={modalTab === tab.id} onClick={() => !disabled && setModalTab(tab.id)} disabled={disabled}>
                <Icon size={12} />
                {tab.label}
              </TabButton>
            )
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-6">
          {/* General Tab */}
          {modalTab === 'general' && (
            <div className="space-y-4 max-w-xl">
              <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Finance Agent" />
              <Field label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="e.g. finance-agent" />
              <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Brief description of what this agent does" />
              <Field label="System Prompt / Instructions" value={form.instructions} onChange={(v) => setForm({ ...form, instructions: v })} multiline rows={8} placeholder="You are a helpful assistant that..." />
            </div>
          )}

          {/* Knowledge Base Tab */}
          {modalTab === 'knowledge' && (
            isNew ? <DisabledTabMessage tabName="Knowledge Base" /> : (
              <div className="space-y-4">
                {/* Search + Actions */}
                <div className="flex gap-2">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documents..."
                    className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#D94E2A]"
                    onKeyDown={(e) => e.key === 'Enter' && searchDocs()}
                  />
                  <button onClick={searchDocs} className="px-3 py-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"><Search size={14} /></button>
                  <button onClick={loadDocs} className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"><RefreshCw size={14} /></button>
                </div>

                {/* File Drop Zone */}
                {!uploading && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    onClick={() => document.getElementById('kb-file-input')?.click()}
                    className={`p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all text-center ${
                      dragOver
                        ? 'border-[#D94E2A] bg-[#D94E2A]/10'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-tertiary)]'
                    }`}
                  >
                    <FileText size={32} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
                    <p className="text-sm text-[var(--text-secondary)] font-bold mb-1">Drop files here</p>
                    <p className="text-xs text-[var(--text-tertiary)] mb-3">or click to browse</p>
                    <p className="text-xs text-[var(--text-tertiary)]">.txt .md .csv .json .pdf</p>
                    <input
                      id="kb-file-input"
                      type="file"
                      accept=".txt,.md,.csv,.json,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Upload Confirmation */}
                {uploading && (
                  <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText size={18} className="text-[#D94E2A] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[var(--text-primary)] truncate">{uploadForm.name}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{uploadForm.sourceType?.toUpperCase()} file &middot; {(uploadForm.content.length / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Field label="Document Name" value={uploadForm.name} onChange={(v) => setUploadForm({ ...uploadForm, name: v })} placeholder="e.g. FAQ, Product Guide" />
                    <div className="flex gap-2">
                      <button onClick={uploadDoc} disabled={!uploadForm.name || !uploadForm.content} className="px-4 py-2 rounded-xl bg-[#D94E2A] text-white text-sm font-bold hover:bg-[#B8401F] disabled:opacity-50 transition-all flex items-center gap-2"><Upload size={14} />Upload</button>
                      <button onClick={() => { setUploading(false); setUploadForm({ name: '', content: '', sourceType: '' }) }} className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-sm font-bold hover:bg-[var(--bg-hover)] transition-all"><X size={14} /></button>
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {searchResults && (
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-secondary)] mb-2">Search Results ({searchResults.length})</h4>
                    <DocList docs={searchResults} onDelete={deleteDoc} />
                  </div>
                )}

                {/* Document List */}
                {docsLoading ? (
                  <div className="flex items-center gap-2 py-4"><Spinner /><span className="text-sm text-[var(--text-tertiary)]">Loading documents...</span></div>
                ) : (
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-secondary)] mb-2">All Documents ({docs.length})</h4>
                    <DocList docs={docs} onDelete={deleteDoc} />
                  </div>
                )}
              </div>
            )
          )}

          {/* Memory Tab */}
          {modalTab === 'memory' && (
            isNew ? <DisabledTabMessage tabName="Memory" /> : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button onClick={() => { setMemEditing(true); setMemViewing(null) }} className="px-3 py-2 rounded-xl bg-[#D94E2A] text-white text-xs font-bold hover:bg-[#B8401F] transition-all flex items-center gap-1"><Plus size={14} />Create/Update Memory</button>
                  <button onClick={loadMemory} className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"><RefreshCw size={14} /></button>
                </div>

                {/* Create/Update Form */}
                {memEditing && (
                  <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3">
                    <Field label="Document Key" value={memForm.docKey} onChange={(v) => setMemForm({ ...memForm, docKey: v })} placeholder="e.g. personality, guidelines" />
                    <Field label="Content" value={memForm.content} onChange={(v) => setMemForm({ ...memForm, content: v })} multiline rows={6} />
                    <div className="flex gap-2">
                      <button onClick={saveMemory} className="px-4 py-2 rounded-xl bg-[#D94E2A] text-white text-sm font-bold hover:bg-[#B8401F] transition-all flex items-center gap-2"><Check size={14} />Save</button>
                      <button onClick={() => setMemEditing(false)} className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-sm font-bold hover:bg-[var(--bg-hover)] transition-all"><X size={14} /></button>
                    </div>
                  </div>
                )}

                {/* View Memory */}
                {memViewing && (
                  <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-[var(--text-primary)] font-mono">{memViewing}</h4>
                      <button onClick={() => setMemViewing(null)} className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><X size={14} /></button>
                    </div>
                    <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap bg-[var(--bg-secondary)] p-3 rounded-lg overflow-auto max-h-48">{memViewContent}</pre>
                  </div>
                )}

                {/* Memory List */}
                {memLoading ? (
                  <div className="flex items-center gap-2 py-4"><Spinner /><span className="text-sm text-[var(--text-tertiary)]">Loading memory...</span></div>
                ) : memDocs.length === 0 ? (
                  <p className="text-sm text-[var(--text-tertiary)]">No memory documents.</p>
                ) : (
                  <div className="space-y-2">
                    {memDocs.map((doc) => {
                      const key = doc.docKey || doc.key || doc.id
                      return (
                        <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                          <div>
                            <div className="font-bold text-sm text-[var(--text-primary)] font-mono">{key}</div>
                            {doc.docType && <div className="text-xs text-[var(--text-tertiary)]">{doc.docType}</div>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => viewMemory(key)} className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"><Eye size={14} /></button>
                            <button onClick={() => { setMemForm({ docKey: key, content: '' }); setMemEditing(true); setMemViewing(null) }} className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"><Pencil size={14} /></button>
                            <button onClick={() => deleteMemory(key)} className="p-2 rounded-lg bg-[var(--bg-subtle)] text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          )}

          {/* MCP Hub Tab */}
          {modalTab === 'mcphub' && (
            isNew ? <DisabledTabMessage tabName="MCP Hub" /> : (
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-tertiary)]">Toggle capabilities on/off for this agent.</p>
                {capsLoading ? (
                  <div className="flex items-center gap-2 py-4"><Spinner /><span className="text-sm text-[var(--text-tertiary)]">Loading capabilities...</span></div>
                ) : allCaps.length === 0 ? (
                  <p className="text-sm text-[var(--text-tertiary)]">No capabilities registered. Add them from the MCP Hub tab.</p>
                ) : (
                  <div className="space-y-2">
                    {allCaps.map((cap) => {
                      const enabled = isCapEnabled(cap.id)
                      return (
                        <div key={cap.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                          <div className="flex items-center gap-3">
                            <Plug size={16} className="text-[var(--text-tertiary)]" />
                            <div>
                              <div className="font-bold text-sm text-[var(--text-primary)]">{cap.name}</div>
                              {cap.description && <div className="text-xs text-[var(--text-tertiary)]">{cap.description}</div>}
                            </div>
                          </div>
                          <button onClick={() => toggleCap(cap.id)} className="transition-all">
                            {enabled ? (
                              <ToggleRight size={28} className="text-[#D94E2A]" />
                            ) : (
                              <ToggleLeft size={28} className="text-[var(--text-tertiary)]" />
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-sm font-bold hover:bg-[var(--bg-hover)] transition-all">
            Cancel
          </button>
          {modalTab === 'general' && (
            <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl bg-[#D94E2A] text-white text-sm font-bold hover:bg-[#B8401F] disabled:opacity-50 transition-all flex items-center gap-2">
              {saving ? <><Spinner /> Saving...</> : <><Check size={14} /> {isNew ? 'Create Agent' : 'Save Changes'}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Document List (shared) ──────────────────────────────────────────
function DocList({ docs, onDelete }) {
  if (!docs || docs.length === 0) return <p className="text-sm text-[var(--text-tertiary)]">No documents.</p>
  return (
    <div className="space-y-2">
      {docs.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
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

// ─── Agent Grid ──────────────────────────────────────────────────────
function AgentGrid({ api, onRefreshNeeded }) {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAgent, setModalAgent] = useState(undefined) // undefined=closed, null=new, object=edit

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/agents')
      setAgents(res.data || [])
    } catch (e) { toast('Failed to load agents: ' + e.message) }
    finally { setLoading(false) }
  }, [api])

  useEffect(() => { load() }, [load])

  const deleteAgent = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this agent?')) return
    try {
      await api.del(`/agents/${id}`)
      toast('Agent deleted')
      load()
    } catch (e) { toast('Error: ' + e.message) }
  }

  const handleModalSaved = (newAgent) => {
    setModalAgent(undefined)
    load()
    if (onRefreshNeeded) onRefreshNeeded()
  }

  // Count docs for an agent (we show it from the agent data if available)
  const getDocCount = (agent) => agent.documentCount ?? agent._count?.documents ?? '?'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Agents</h3>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Manage your AI agents and their configurations.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"><RefreshCw size={14} /></button>
          <button onClick={() => setModalAgent(null)} className="px-4 py-2 rounded-xl bg-[#D94E2A] text-white text-xs font-bold hover:bg-[#B8401F] transition-all flex items-center gap-2"><Plus size={14} />New Agent</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8"><Spinner /><span className="text-sm text-[var(--text-tertiary)]">Loading agents...</span></div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bot size={40} className="text-[var(--text-tertiary)] mb-3" />
          <p className="text-sm text-[var(--text-tertiary)]">No agents yet. Create your first agent to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const provider = getProviderForModel(agent.defaultModel)
            const colors = getProviderColor(provider)
            return (
              <div
                key={agent.id}
                className="relative p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-tertiary)] transition-all group"
                style={{ borderLeftWidth: '3px', borderLeftColor: colors.accent }}
              >
                {/* Top Row: Name + Settings Gear */}
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">{agent.name}</h4>
                    <span className="text-xs text-[var(--text-tertiary)] font-mono">{agent.slug}</span>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => setModalAgent(agent)}
                      className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Settings size={14} />
                    </button>
                    <button
                      onClick={(e) => deleteAgent(e, agent.id)}
                      className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Model Badge */}
                <div className="mb-3">
                  <ModelBadge modelId={agent.defaultModel} />
                </div>

                {/* Description */}
                {agent.description && (
                  <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 mb-3">{agent.description}</p>
                )}

                {/* Footer Stats */}
                <div className="flex items-center gap-3 pt-3 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                    <FileText size={12} />
                    <span>{getDocCount(agent)} docs</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Agent Config Modal */}
      {modalAgent !== undefined && (
        <AgentConfigModal
          api={api}
          agent={modalAgent}
          onClose={() => setModalAgent(undefined)}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  )
}

// ─── MCP Hub ─────────────────────────────────────────────────────────
function McpHub({ api }) {
  const [capabilities, setCapabilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [regForm, setRegForm] = useState({ name: '', description: '', serverUrl: '' })
  const [expanded, setExpanded] = useState({})
  const [testing, setTesting] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/capabilities')
      const caps = res.data || []
      setCapabilities(caps)

      // Auto-register bundled MCP if not present
      const hasBundled = caps.some((c) => c.type === 'BUNDLED' || c.type === 'bundled')
      if (!hasBundled) {
        try {
          await api.post('/capabilities', {
            name: 'financeiscooked Platform MCP',
            description: 'Built-in MCP server with episode, segment, slide, and vote tools',
            type: 'bundled',
          })
          const reloadRes = await api.get('/capabilities')
          setCapabilities(reloadRes.data || [])
        } catch (regErr) { /* silently ignore if auto-register fails */ }
      }
    } catch (e) { toast('Failed to load capabilities: ' + e.message) }
    finally { setLoading(false) }
  }, [api])

  useEffect(() => { load() }, [load])

  const registerCap = async () => {
    if (!regForm.name || !regForm.serverUrl) {
      toast('Name and Server URL are required')
      return
    }
    try {
      await api.post('/capabilities', { ...regForm, type: 'EXTERNAL' })
      toast('MCP server registered')
      setRegForm({ name: '', description: '', serverUrl: '' })
      setRegistering(false)
      load()
    } catch (e) { toast('Error: ' + e.message) }
  }

  const deleteCap = async (id) => {
    if (!confirm('Delete this capability?')) return
    try {
      await api.del(`/capabilities/${id}`)
      toast('Capability deleted')
      load()
    } catch (e) { toast('Error: ' + e.message) }
  }

  const testConnection = async (id) => {
    setTesting((prev) => ({ ...prev, [id]: 'loading' }))
    try {
      await api.post(`/capabilities/${id}/test`, {})
      setTesting((prev) => ({ ...prev, [id]: 'success' }))
      toast('Connection successful')
    } catch (e) {
      setTesting((prev) => ({ ...prev, [id]: 'error' }))
      toast('Connection failed: ' + e.message)
    }
    setTimeout(() => setTesting((prev) => ({ ...prev, [id]: null })), 3000)
  }

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">MCP Hub</h3>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Manage platform capabilities and external MCP server connections.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"><RefreshCw size={14} /></button>
          <button onClick={() => setRegistering(true)} className="px-4 py-2 rounded-xl bg-[#D94E2A] text-white text-xs font-bold hover:bg-[#B8401F] transition-all flex items-center gap-2"><Globe size={14} />Register External</button>
        </div>
      </div>

      {/* Register Form */}
      {registering && (
        <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] mb-6 space-y-3">
          <h4 className="text-sm font-bold text-[var(--text-primary)] mb-2">Register External MCP Server</h4>
          <Field label="Name" value={regForm.name} onChange={(v) => setRegForm({ ...regForm, name: v })} placeholder="e.g. Custom Tools Server" />
          <Field label="Description" value={regForm.description} onChange={(v) => setRegForm({ ...regForm, description: v })} placeholder="What this server provides" />
          <Field label="Server URL" value={regForm.serverUrl} onChange={(v) => setRegForm({ ...regForm, serverUrl: v })} placeholder="https://your-mcp-server.example.com" />
          <div className="flex gap-2 pt-1">
            <button onClick={registerCap} className="px-4 py-2 rounded-xl bg-[#D94E2A] text-white text-sm font-bold hover:bg-[#B8401F] transition-all flex items-center gap-2"><Check size={14} />Register</button>
            <button onClick={() => setRegistering(false)} className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-sm font-bold hover:bg-[var(--bg-hover)] transition-all"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Capability List */}
      {loading ? (
        <div className="flex items-center gap-2 py-8"><Spinner /><span className="text-sm text-[var(--text-tertiary)]">Loading capabilities...</span></div>
      ) : capabilities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Plug size={40} className="text-[var(--text-tertiary)] mb-3" />
          <p className="text-sm text-[var(--text-tertiary)]">No capabilities registered yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {capabilities.map((cap) => {
            const isBundled = cap.type === 'BUNDLED' || cap.bundled
            const isExpanded = expanded[cap.id]
            const testStatus = testing[cap.id]
            const connectedCount = cap.agentCount ?? cap._count?.agents ?? 0

            return (
              <div key={cap.id} className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] overflow-hidden">
                {/* Card Header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button onClick={() => toggleExpand(cap.id)} className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all shrink-0">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-[var(--text-primary)] truncate">{cap.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isBundled ? 'bg-purple-500/15 text-purple-400' : 'bg-sky-500/15 text-sky-400'
                        }`}>
                          {isBundled ? 'Bundled' : 'External'}
                        </span>
                      </div>
                      {cap.description && <p className="text-xs text-[var(--text-tertiary)] truncate">{cap.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                      <Bot size={12} />
                      <span>{connectedCount} agent{connectedCount !== 1 ? 's' : ''}</span>
                    </div>
                    {!isBundled && (
                      <>
                        <button
                          onClick={() => testConnection(cap.id)}
                          disabled={testStatus === 'loading'}
                          className={`p-2 rounded-lg transition-all ${
                            testStatus === 'success' ? 'bg-emerald-500/15 text-emerald-400' :
                            testStatus === 'error' ? 'bg-red-500/15 text-red-400' :
                            'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                          }`}
                          title="Test connection"
                        >
                          {testStatus === 'loading' ? <Spinner /> : <TestTube2 size={14} />}
                        </button>
                        <button onClick={() => deleteCap(cap.id)} className="p-2 rounded-lg bg-[var(--bg-subtle)] text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-[var(--border-subtle)]">
                    <div className="pt-3 space-y-2">
                      {cap.serverUrl && (
                        <div className="text-xs">
                          <span className="text-[var(--text-tertiary)]">Server URL: </span>
                          <span className="text-[var(--text-secondary)] font-mono">{cap.serverUrl}</span>
                        </div>
                      )}
                      {cap.agents && cap.agents.length > 0 ? (
                        <div>
                          <span className="text-xs text-[var(--text-tertiary)] block mb-1">Connected Agents:</span>
                          <div className="flex flex-wrap gap-1">
                            {cap.agents.map((a) => (
                              <span key={a.id || a} className="px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-xs text-[var(--text-secondary)]">
                                {a.name || a}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--text-tertiary)]">No agents connected to this capability.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
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
  const [saving, setSaving] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [keyValue, setKeyValue] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cfgRes, provRes] = await Promise.all([
        api.get('/llm-config'),
        api.get('/llm-config/providers'),
      ])
      const cfg = cfgRes.data || cfgRes
      setConfig(cfg)
      setProviders(provRes.data || [])
      setSelectedProvider(cfg.provider || '')
      setSelectedModel(cfg.model || '')
    } catch (e) { toast('Failed to load LLM config: ' + e.message) }
    finally { setLoading(false) }
  }, [api])

  useEffect(() => { load() }, [load])

  const getKeyStatus = (providerName) => {
    const p = providers.find((pr) => (pr.name || pr.id) === providerName)
    return p?.hasKey || false
  }

  const saveAll = async () => {
    if (!selectedProvider || !selectedModel) {
      toast('Please select a provider and model')
      return
    }
    setSaving(true)
    try {
      await api.put('/llm-config', { provider: selectedProvider, model: selectedModel })
      if (keyValue.trim()) {
        await api.put('/llm-config/api-key', { provider: selectedProvider, apiKey: keyValue.trim() })
        setKeyValue('')
      }
      toast('LLM configuration saved')
      load()
    } catch (e) { toast('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const deleteKey = async (provider) => {
    if (!confirm(`Delete API key for ${provider}?`)) return
    try {
      await api.del(`/llm-config/api-key/${provider}`)
      toast(`API key deleted for ${provider}`)
      load()
    } catch (e) { toast('Error: ' + e.message) }
  }

  const handleProviderSelect = (p) => {
    setSelectedProvider(p)
    setKeyValue('')
    if (!AVAILABLE_MODELS[p]?.some((m) => m.id === selectedModel)) {
      setSelectedModel(AVAILABLE_MODELS[p]?.[0]?.id || '')
    }
  }

  if (loading) return <div className="flex items-center gap-2 p-6"><Spinner /><span className="text-sm text-[var(--text-tertiary)]">Loading LLM config...</span></div>

  const providerNames = Object.keys(AVAILABLE_MODELS)
  const modelsForProvider = AVAILABLE_MODELS[selectedProvider] || []

  return (
    <div className="p-6 max-w-3xl">
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">LLM Configuration</h3>

      <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-6">
        {/* Step 1: Provider Selection */}
        <div>
          <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">1. Select Provider</label>
          <div className="flex gap-2">
            {providerNames.map((p) => {
              const colors = getProviderColor(p)
              const isActive = selectedProvider === p
              const hasKey = getKeyStatus(p)
              return (
                <button
                  key={p}
                  onClick={() => handleProviderSelect(p)}
                  className={`relative px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                    isActive
                      ? `${colors.bg} ${colors.text} ${colors.border}`
                      : 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                  {hasKey && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 2: Model Selection */}
        {selectedProvider && (
          <div>
            <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">2. Select Model</label>
            <div className="flex flex-wrap gap-2">
              {modelsForProvider.map((m) => {
                const isActive = selectedModel === m.id
                const colors = getProviderColor(selectedProvider)
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                      isActive
                        ? `${colors.bg} ${colors.text} ${colors.border}`
                        : 'bg-[var(--bg-primary)] text-[var(--text-tertiary)] border-[var(--border-subtle)] hover:text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                    }`}
                  >
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 3: API Key */}
        {selectedProvider && (
          <div>
            <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">
              3. API Key for {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="password"
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#D94E2A]"
                placeholder={getKeyStatus(selectedProvider) ? 'Key already set — enter new key to replace' : 'sk-...'}
              />
              {getKeyStatus(selectedProvider) && (
                <button onClick={() => deleteKey(selectedProvider)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all" title="Delete existing key"><Trash2 size={14} /></button>
              )}
            </div>
            {getKeyStatus(selectedProvider) && (
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><Check size={12} /> Key configured. Leave blank to keep current key.</p>
            )}
          </div>
        )}

        {/* Save All Button */}
        <button
          onClick={saveAll}
          disabled={saving || !selectedProvider || !selectedModel}
          className="w-full px-5 py-3 rounded-xl bg-[#D94E2A] text-white text-sm font-bold hover:bg-[#B8401F] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {saving ? <><Spinner /> Saving...</> : <><Check size={14} /> Save All</>}
        </button>
      </div>
    </div>
  )
}

// ─── Main Admin Panel ────────────────────────────────────────────────
export default function AdminPanel() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('admin-key') || '')
  const [authenticated, setAuthenticated] = useState(false)
  const [adminTab, setAdminTab] = useState('agents')

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
        {adminTab === 'agents' && <AgentGrid api={api} />}
        {adminTab === 'mcp' && <McpHub api={api} />}
        {adminTab === 'llm' && <LlmConfig api={api} />}
      </div>
    </div>
  )
}
