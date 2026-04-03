import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import ChatWidget from '../components/ChatWidget'

const TABS = [
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'persona',   label: 'Persona',   icon: '🎭' },
  { id: 'telegram',  label: 'Telegram',  icon: '✈️' },
  { id: 'embed',     label: 'Embed',     icon: '🔗' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'apikeys',   label: 'API Keys',  icon: '🔑' },
  { id: 'test',      label: 'Test Chat', icon: '💬' },
]

export default function BotDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bot, setBot] = useState(null)
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('documents')
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [persona, setPersona] = useState('')
  const [savingPersona, setSavingPersona] = useState(false)
  const [personaSaved, setPersonaSaved] = useState(false)
  const [tgToken, setTgToken] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [tgError, setTgError] = useState('')
  const [tgSuccess, setTgSuccess] = useState('')

  // API Keys state
  const [apiKeys, setApiKeys] = useState([])
  const [keysLoading, setKeysLoading] = useState(false)
  const [creatingKey, setCreatingKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyVisible, setNewKeyVisible] = useState(null)
  const [copiedKey, setCopiedKey] = useState(null)

  // Analytics state
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Embed state
  const [embedCopied, setEmbedCopied] = useState(false)

  useEffect(() => {
    Promise.all([api.get(`/bots/${id}`), api.get(`/bots/${id}/documents/`)])
      .then(([b, d]) => { setBot(b.data); setPersona(b.data.persona || ''); setDocs(d.data) })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (activeTab === 'apikeys' && apiKeys.length === 0) fetchApiKeys()
    if (activeTab === 'analytics') fetchAnalytics()
  }, [activeTab])

  const fetchApiKeys = async () => {
    setKeysLoading(true)
    try {
      const res = await api.get(`/api-keys/`)
      setApiKeys(res.data)
    } catch { setApiKeys([]) }
    finally { setKeysLoading(false) }
  }

  const createApiKey = async (e) => {
    e.preventDefault()
    if (!newKeyName.trim()) return
    setCreatingKey(true)
    try {
      const res = await api.post(`/api-keys/`, { label: newKeyName.trim() })
      setNewKeyVisible(res.data)
      setApiKeys(prev => [...prev, res.data])
      setNewKeyName('')
    } catch {}
    finally { setCreatingKey(false) }
  }

  const deleteApiKey = async (keyId) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return
    await api.delete(`/api-keys/${keyId}`)
    setApiKeys(prev => prev.filter(k => k.id !== keyId))
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const res = await api.get(`/analytics/bots/${id}`)
      setAnalytics(res.data)
    } catch { setAnalytics(null) }
    finally { setAnalyticsLoading(false) }
  }

  const uploadFile = async (file) => {
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await api.post(`/bots/${id}/documents/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setDocs(prev => [...prev, res.data])
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    uploadFile(e.dataTransfer.files[0])
  }

  const deleteDoc = async (docId) => {
    if (!confirm('Delete this document?')) return
    await api.delete(`/bots/${id}/documents/${docId}`)
    setDocs(prev => prev.filter(d => d.id !== docId))
  }

  const savePersona = async () => {
    setSavingPersona(true)
    await api.put(`/bots/${id}`, { persona })
    setSavingPersona(false)
    setPersonaSaved(true)
    setTimeout(() => setPersonaSaved(false), 2000)
  }

  const deployTelegram = async (e) => {
    e.preventDefault()
    setTgError(''); setTgSuccess(''); setDeploying(true)
    try {
      await api.post(`/bots/${id}/telegram/deploy`, { telegram_token: tgToken })
      setBot(prev => ({ ...prev, telegram_webhook_active: true }))
      setTgSuccess('Bot deployed successfully!')
      setTgToken('')
    } catch (err) {
      setTgError(err.response?.data?.detail || 'Deployment failed')
    } finally { setDeploying(false) }
  }

  const undeployTelegram = async () => {
    if (!confirm('Undeploy?')) return
    await api.delete(`/bots/${id}/telegram/undeploy`)
    setBot(prev => ({ ...prev, telegram_webhook_active: false }))
    setTgSuccess('')
  }

  const statusBadge = {
    pending: 'bg-amber-50 text-amber-600',
    indexed: 'bg-green-50 text-green-600',
    failed:  'bg-red-50 text-red-600',
  }

  // The embed snippet users copy into their website
  const embedSnippet = `<script>
  window.DocBotConfig = { botId: "${id}" };
</script>
<script src="${window.location.origin}/embed.js" async></script>`

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="text-gray-400 text-sm">Loading bot...</div>
    </div>
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/dashboard')} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition text-sm">
          ←
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{bot?.name}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${bot?.telegram_webhook_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {bot?.telegram_webhook_active ? '● Live on Telegram' : '○ Not deployed'}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">{bot?.language?.toUpperCase()} · Bot ID: {id?.slice(0, 8)}...</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* ── Documents ── */}
      {activeTab === 'documents' && (
        <div className="max-w-2xl">
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-6 ${
              dragOver ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-4xl mb-3">{uploading ? '⏳' : '📁'}</div>
            <p className="font-semibold text-gray-700 text-sm">{uploading ? 'Uploading...' : 'Drop files here or click to upload'}</p>
            <p className="text-xs text-gray-400 mt-1">Supports PDF, DOCX, TXT</p>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => uploadFile(e.target.files[0])} />
          </div>
          {docs.length > 0 && (
            <div className="space-y-2">
              {docs.map(doc => (
                <div key={doc.id} className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center gap-4 shadow-card">
                  <div className="text-2xl shrink-0">
                    {doc.file_type === 'pdf' ? '📕' : doc.file_type === 'docx' ? '📘' : '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.filename}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {doc.chunk_count > 0 ? `${doc.chunk_count} chunks indexed` : 'Processing...'}
                    </p>
                    {doc.error_message && <p className="text-xs text-red-500 mt-0.5 truncate">{doc.error_message}</p>}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${statusBadge[doc.status] || 'bg-gray-100 text-gray-500'}`}>
                    {doc.status}
                  </span>
                  <button onClick={() => deleteDoc(doc.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition shrink-0">
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Persona ── */}
      {activeTab === 'persona' && (
        <div className="max-w-2xl">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
            <h2 className="font-semibold text-gray-900 mb-1">System Prompt</h2>
            <p className="text-sm text-gray-400 mb-4">Defines how your bot introduces itself and responds</p>
            <textarea
              value={persona}
              onChange={e => setPersona(e.target.value)}
              rows={10}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none transition"
              placeholder="You are a helpful assistant for [Company Name]. Answer questions based only on the provided documents..."
            />
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-400">{persona.length} characters</p>
              <button
                onClick={savePersona}
                disabled={savingPersona}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  personaSaved ? 'bg-green-500 text-white' : 'bg-brand-600 hover:bg-brand-700 text-white'
                } disabled:opacity-60`}
              >
                {personaSaved ? '✓ Saved!' : savingPersona ? 'Saving...' : 'Save Persona'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Telegram ── */}
      {activeTab === 'telegram' && (
        <div className="max-w-2xl">
          {bot?.telegram_webhook_active ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">✅</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Bot is live on Telegram!</h3>
                  <p className="text-sm text-gray-500 mt-1">Your bot is receiving messages and responding automatically.</p>
                  <button onClick={undeployTelegram} className="mt-4 text-sm text-red-500 hover:text-red-700 font-medium transition">
                    Undeploy bot →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
              <h2 className="font-semibold text-gray-900 mb-4">Deploy to Telegram</h2>
              <div className="bg-brand-50 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-brand-800 mb-3">Get your bot token in 3 steps:</p>
                <div className="space-y-2">
                  {['Open Telegram and search @BotFather', 'Send /newbot and follow the prompts', 'Copy the token and paste it below'].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-brand-200 text-brand-700 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                      <span className="text-sm text-brand-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <form onSubmit={deployTelegram} className="space-y-4">
                {tgError && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{tgError}</div>}
                {tgSuccess && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm">✅ {tgSuccess}</div>}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Bot Token</label>
                  <input
                    required
                    value={tgToken}
                    onChange={e => setTgToken(e.target.value)}
                    placeholder="1234567890:AAFxxxxxxxxxxxxxxx"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>
                <button
                  type="submit" disabled={deploying}
                  className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"
                >
                  {deploying ? 'Deploying...' : '🚀 Deploy to Telegram'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ── Embed ── */}
      {activeTab === 'embed' && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
            <h2 className="font-semibold text-gray-900 mb-1">Embed on your website</h2>
            <p className="text-sm text-gray-400 mb-5">Copy and paste this snippet just before the closing <code className="bg-gray-100 px-1 rounded text-xs">&lt;/body&gt;</code> tag of your site.</p>
            <div className="relative bg-gray-900 rounded-xl p-4 mb-4">
              <pre className="text-green-400 text-xs overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">{embedSnippet}</pre>
              <button
                onClick={() => { copyToClipboard(embedSnippet, 'embed'); setEmbedCopied(true); setTimeout(() => setEmbedCopied(false), 2000) }}
                className="absolute top-3 right-3 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded-lg transition font-medium"
              >
                {embedCopied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-1">What this does</p>
              <p className="text-xs text-blue-600">A floating chat button appears in the bottom-right corner of your website. Visitors can click it to chat with your bot without leaving your page.</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
            <h2 className="font-semibold text-gray-900 mb-1">Direct chat link</h2>
            <p className="text-sm text-gray-400 mb-4">Share this URL to let anyone chat with your bot directly.</p>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <span className="text-sm text-gray-600 truncate flex-1 font-mono">
                {window.location.origin}/chat/{id}
              </span>
              <button
                onClick={() => copyToClipboard(`${window.location.origin}/chat/${id}`, 'link')}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs rounded-lg transition font-medium shrink-0"
              >
                {copiedKey === 'link' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Analytics ── */}
      {activeTab === 'analytics' && (
        <div className="max-w-2xl space-y-4">
          {analyticsLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 h-24 animate-pulse" />
              ))}
            </div>
          ) : analytics ? (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Total Messages', value: analytics.total_messages ?? '—', icon: '💬', color: 'text-brand-600' },
                  { label: 'Unique Sessions', value: analytics.unique_sessions ?? '—', icon: '👤', color: 'text-blue-600' },
                  { label: 'Avg Response Time', value: analytics.avg_response_time ? `${analytics.avg_response_time}s` : '—', icon: '⚡', color: 'text-amber-600' },
                  { label: 'Unanswered', value: analytics.unanswered ?? '—', icon: '❓', color: 'text-red-500' },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-card">
                    <div className="text-2xl mb-2">{kpi.icon}</div>
                    <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                    <div className="text-xs text-gray-400 mt-0.5 font-medium">{kpi.label}</div>
                  </div>
                ))}
              </div>

              {/* Top questions */}
              {analytics.top_questions && analytics.top_questions.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
                  <h3 className="font-semibold text-gray-900 mb-4">Top Questions</h3>
                  <div className="space-y-2">
                    {analytics.top_questions.slice(0, 8).map((q, i) => (
                      <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                        <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                        <p className="text-sm text-gray-700 flex-1">{q.question}</p>
                        <span className="text-xs text-gray-400 shrink-0">{q.count}×</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 shadow-card flex flex-col items-center text-center">
              <div className="text-5xl mb-4">📊</div>
              <p className="font-semibold text-gray-700">No analytics yet</p>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">Analytics will appear here once users start chatting with your bot.</p>
            </div>
          )}
        </div>
      )}

      {/* ── API Keys ── */}
      {activeTab === 'apikeys' && (
        <div className="max-w-2xl space-y-4">
          {/* New revealed key */}
          {newKeyVisible && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-green-800 mb-2">🎉 Key created — save it now, it won't be shown again!</p>
              <div className="flex items-center gap-2 bg-white border border-green-200 rounded-xl px-4 py-3">
                <code className="text-sm font-mono text-green-700 truncate flex-1">{newKeyVisible.key}</code>
                <button
                  onClick={() => copyToClipboard(newKeyVisible.key, newKeyVisible.id)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition font-medium shrink-0"
                >
                  {copiedKey === newKeyVisible.id ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <button onClick={() => setNewKeyVisible(null)} className="mt-2 text-xs text-green-600 hover:text-green-800">Dismiss</button>
            </div>
          )}

          {/* Create key form */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
            <h2 className="font-semibold text-gray-900 mb-1">API Keys</h2>
            <p className="text-sm text-gray-400 mb-5">Use these keys to access your bot programmatically via the REST API.</p>
            <form onSubmit={createApiKey} className="flex gap-2">
              <input
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g. Production App)"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
              <button
                type="submit"
                disabled={creatingKey || !newKeyName.trim()}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition"
              >
                {creatingKey ? '...' : '+ Create'}
              </button>
            </form>
          </div>

          {/* Keys list */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-card overflow-hidden">
            {keysLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2].map(i => <div key={i} className="h-12 rounded-xl animate-pulse bg-gray-100" />)}
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-gray-400 text-sm">No API keys yet. Create one above.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {apiKeys.map(k => (
                  <div key={k.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm shrink-0">🔑</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{k.name}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        {k.key_preview || `••••••••${k.key?.slice(-6) || '••••••'}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${k.is_active !== false ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {k.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => deleteApiKey(k.id)}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition ml-1"
                        title="Revoke key"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Usage example */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card">
            <h3 className="font-semibold text-gray-900 mb-3">Usage Example</h3>
            <div className="bg-gray-900 rounded-xl p-4 relative">
              <pre className="text-green-400 text-xs overflow-x-auto whitespace-pre font-mono leading-relaxed">{`curl -X POST ${window.location.origin}/api/chat \\
  -H "X-API-Key: YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "bot_id": "${id}",
    "message": "What is the refund policy?",
    "session_id": "user-123"
  }'`}</pre>
              <button
                onClick={() => copyToClipboard(`curl -X POST ${window.location.origin}/api/chat -H "X-API-Key: YOUR_KEY_HERE" -H "Content-Type: application/json" -d '{"bot_id":"${id}","message":"What is the refund policy?","session_id":"user-123"}'`, 'curl')}
                className="absolute top-3 right-3 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded-lg transition font-medium"
              >
                {copiedKey === 'curl' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Test Chat ── */}
      {activeTab === 'test' && (
        <div className="max-w-2xl">
          <p className="text-sm text-gray-500 mb-4">Test your bot live — ask questions about the uploaded documents</p>
          <ChatWidget botId={id} />
        </div>
      )}
    </div>
  )
}