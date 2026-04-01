import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import PageTransition from '../components/PageTransition'

export default function DevPortal() {
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [newKey, setNewKey] = useState(null)
  const [label, setLabel] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [activeTab, setActiveTab] = useState('keys')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const username = user?.email?.split('@')[0] || 'there'

  const fetchKeys = () => {
    api.get('/api-keys/')
      .then(r => setKeys(r.data))
      .catch(() => setKeys([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchKeys() }, [])

  const generate = async () => {
    if (!label.trim()) return
    setGenerating(true)
    try {
      const res = await api.post('/api-keys/', { label })
      setNewKey(res.data.key)
      setLabel('')
      setShowForm(false)
      fetchKeys()
    } catch {}
    finally { setGenerating(false) }
  }

  const revoke = async (id) => {
    await api.delete(`/api-keys/${id}`).catch(() => {})
    setKeys(prev => prev.filter(k => k.id !== id))
  }

  const copy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const tabs = [
    { id: 'keys',     icon: 'key',          label: 'API Keys' },
    { id: 'docs',     icon: 'integration_instructions', label: 'Docs' },
    { id: 'examples', icon: 'code',          label: 'Examples' },
  ]

  const navItems = [
    { icon: 'grid_view', label: 'Dashboard', action: () => navigate('/dashboard') },
    { icon: 'api',       label: 'API',       action: () => {} },
    { icon: 'logout',    label: 'Sign out',  action: () => { logout(); navigate('/login') } },
  ]

  // ── Code snippet helper ─────────────────────────────────────────────────
  const CodeBlock = ({ code, id }) => (
    <div className="relative group">
      <pre
        className="rounded-2xl p-5 text-xs overflow-x-auto leading-relaxed"
        style={{ backgroundColor: '#1e1b2e', color: '#e2d9f3', fontFamily: 'monospace' }}
      >
        <code>{code}</code>
      </pre>
      <button
        onClick={() => copy(code, id)}
        className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-all"
        style={{
          backgroundColor: copiedId === id ? '#16a34a' : 'rgba(116,47,229,0.8)',
          color: 'white',
        }}
      >
        {copiedId === id ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  )

  return (
    <PageTransition>
      <div
        className="min-h-screen overflow-hidden flex items-center justify-center relative"
        style={{
          fontFamily: 'Inter, sans-serif',
          backgroundColor: '#f8f9fa',
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(116,47,229,0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(131,66,244,0.10) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(233,222,248,0.40) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(116,47,229,0.05) 0px, transparent 50%)
          `,
        }}
      >
        {/* ── Floating pill sidebar ── */}
        <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-50">
          <nav
            className="flex flex-col p-4 space-y-4 rounded-full shadow-sm"
            style={{
              background: 'rgba(248,249,250,0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            {navItems.map((item, i) => (
              <motion.button
                key={item.label}
                onClick={item.action}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                title={item.label}
                className="w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200"
                style={
                  i === 1
                    ? { backgroundColor: 'white', color: '#742fe5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }
                    : { color: '#64748b' }
                }
                onMouseEnter={e => { if (i !== 1) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.5)' }}
                onMouseLeave={e => { if (i !== 1) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
              </motion.button>
            ))}
          </nav>
        </aside>

        {/* ── Top bar ── */}
        <header className="fixed top-0 w-full flex items-center justify-between px-8 py-6 z-50">
          <span className="text-xl font-bold tracking-tighter" style={{ color: '#0f172a' }}>DocBot</span>
          <div className="flex items-center space-x-4">
            <motion.button
              whileTap={{ scale: 0.93 }}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              style={{ color: '#64748b' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(241,244,245,0.7)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span className="material-symbols-outlined">notifications</span>
            </motion.button>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer select-none"
              style={{ background: 'linear-gradient(135deg, #742fe5, #8342f4)' }}
            >
              {username[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* ── Main canvas ── */}
        <main className="relative w-full max-w-2xl px-6 flex flex-col mt-16 py-10">

          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <p className="font-medium tracking-widest uppercase mb-2"
              style={{ color: '#742fe5', fontSize: '0.65rem' }}>
              Developer Portal
            </p>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#2d3335' }}>
              API Access
            </h1>
            <p className="text-sm mt-1" style={{ color: '#5a6062' }}>
              Integrate DocBot into any app with your personal API keys.
            </p>
          </motion.div>

          {/* New key banner */}
          <AnimatePresence>
            {newKey && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-5 rounded-2xl border"
                style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold mb-2" style={{ color: '#16a34a' }}>
                      ✓ New key generated — copy it now, it won't be shown again
                    </p>
                    <code
                      className="text-xs break-all block px-3 py-2 rounded-xl font-mono"
                      style={{ backgroundColor: 'rgba(22,163,74,0.08)', color: '#166534' }}
                    >
                      {newKey}
                    </code>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => copy(newKey, 'new')}
                      className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{
                        backgroundColor: copiedId === 'new' ? '#16a34a' : '#742fe5',
                        color: 'white',
                      }}
                    >
                      {copiedId === 'new' ? '✓ Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={() => setNewKey(null)}
                      className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{ backgroundColor: '#f1f4f5', color: '#5a6062' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-1 p-1 rounded-2xl mb-6"
            style={{ backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)' }}
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={activeTab === tab.id
                  ? { backgroundColor: 'white', color: '#742fe5', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                  : { color: '#5a6062' }}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Tab content */}
          <AnimatePresence mode="wait">

            {/* ── Keys Tab ── */}
            {activeTab === 'keys' && (
              <motion.div
                key="keys"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Generate form */}
                <div
                  className="p-5 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                >
                  <AnimatePresence mode="wait">
                    {!showForm ? (
                      <motion.button
                        key="trigger"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowForm(true)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: 'linear-gradient(135deg, #742fe5, #8342f4)',
                          color: 'white',
                          boxShadow: '0 6px 20px rgba(116,47,229,0.2)',
                        }}
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Generate New API Key
                      </motion.button>
                    ) : (
                      <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-3"
                      >
                        <label className="text-xs font-bold uppercase tracking-widest"
                          style={{ color: '#767c7e' }}>
                          Key Label
                        </label>
                        <input
                          type="text"
                          value={label}
                          onChange={e => setLabel(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && generate()}
                          placeholder="e.g. Production, My App, Testing"
                          autoFocus
                          className="w-full px-5 py-3.5 border-none rounded-2xl focus:outline-none placeholder:text-[#adb3b5] transition-all text-sm"
                          style={{ backgroundColor: '#f1f4f5', color: '#2d3335' }}
                          onFocus={e => { e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(116,47,229,0.25)' }}
                          onBlur={e => { e.target.style.backgroundColor = '#f1f4f5'; e.target.style.boxShadow = 'none' }}
                        />
                        <div className="flex gap-2">
                          <motion.button
                            onClick={generate}
                            disabled={!label.trim() || generating}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #742fe5, #8342f4)' }}
                          >
                            {generating ? 'Generating...' : 'Generate'}
                          </motion.button>
                          <button
                            onClick={() => { setShowForm(false); setLabel('') }}
                            className="px-4 py-3 rounded-xl text-sm font-bold transition-all"
                            style={{ backgroundColor: '#f1f4f5', color: '#5a6062' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ebeef0'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f1f4f5'}
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Key list */}
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <div key={i} className="h-20 rounded-2xl animate-pulse"
                        style={{ backgroundColor: 'rgba(255,255,255,0.5)' }} />
                    ))}
                  </div>
                ) : keys.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-14 rounded-2xl"
                    style={{
                      background: 'rgba(255,255,255,0.5)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.4)',
                    }}
                  >
                    <div className="text-4xl mb-3">🔑</div>
                    <p className="font-semibold text-sm" style={{ color: '#2d3335' }}>No API keys yet</p>
                    <p className="text-xs mt-1" style={{ color: '#767c7e' }}>Generate your first key above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {keys.map((key, i) => (
                        <motion.div
                          key={key.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-5 rounded-2xl"
                          style={{
                            background: 'rgba(255,255,255,0.7)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.4)',
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: 'linear-gradient(135deg, rgba(116,47,229,0.12), rgba(131,66,244,0.12))' }}
                              >
                                <span className="material-symbols-outlined text-sm" style={{ color: '#742fe5' }}>key</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm" style={{ color: '#2d3335' }}>{key.label}</p>
                                <p className="text-xs font-mono mt-0.5 truncate" style={{ color: '#adb3b5' }}>
                                  sk-••••••••••••{key.key_preview || '••••'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => copy(`sk-${key.id}`, key.id)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                                style={{
                                  backgroundColor: copiedId === key.id ? '#f0fdf4' : '#f1f4f5',
                                  color: copiedId === key.id ? '#16a34a' : '#5a6062',
                                }}
                                title="Copy key ID"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  {copiedId === key.id ? 'check' : 'content_copy'}
                                </span>
                              </button>
                              <button
                                onClick={() => revoke(key.id)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                                style={{ backgroundColor: '#f1f4f5', color: '#adb3b5' }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444' }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f1f4f5'; e.currentTarget.style.color = '#adb3b5' }}
                                title="Revoke key"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-3 pt-3"
                            style={{ borderTop: '1px solid #f1f4f5' }}>
                            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                              style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                              ● Active
                            </span>
                            <span className="text-xs" style={{ color: '#adb3b5' }}>
                              Created {new Date(key.created_at).toLocaleDateString()}
                            </span>
                            {key.last_used && (
                              <span className="text-xs" style={{ color: '#adb3b5' }}>
                                Last used {new Date(key.last_used).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Docs Tab ── */}
            {activeTab === 'docs' && (
              <motion.div
                key="docs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Base URL */}
                <div
                  className="p-5 rounded-2xl space-y-3"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#adb3b5' }}>
                    Base URL
                  </p>
                  <code
                    className="block text-sm px-4 py-3 rounded-xl font-mono"
                    style={{ backgroundColor: '#f1f4f5', color: '#742fe5' }}
                  >
                    {import.meta.env.VITE_API_URL || 'https://api.docbot.io'}/api/v1
                  </code>
                </div>

                {/* Auth */}
                <div
                  className="p-5 rounded-2xl space-y-3"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#adb3b5' }}>
                    Authentication
                  </p>
                  <p className="text-sm" style={{ color: '#5a6062' }}>
                    Pass your API key in the request header:
                  </p>
                  <CodeBlock id="auth" code={`X-API-Key: sk-your_api_key_here`} />
                </div>

                {/* Endpoints */}
                {[
                  {
                    method: 'POST',
                    path: '/chat',
                    desc: 'Send a message to a bot and get a response.',
                    color: '#16a34a',
                    bg: '#f0fdf4',
                    body: `{
  "bot_id": "uuid-of-your-bot",
  "message": "What is your return policy?",
  "session_id": "user-session-123"
}`,
                    response: `{
  "answer": "Our return policy allows...",
  "sources": ["returns_policy.pdf § 2.1"],
  "session_id": "user-session-123"
}`,
                  },
                  {
                    method: 'GET',
                    path: '/bots',
                    desc: 'List all bots belonging to your account.',
                    color: '#2563eb',
                    bg: '#eff6ff',
                    response: `[
  {
    "id": "uuid",
    "name": "Support Bot",
    "language": "en",
    "telegram_webhook_active": true
  }
]`,
                  },
                ].map(ep => (
                  <div
                    key={ep.path}
                    className="p-5 rounded-2xl space-y-4"
                    style={{
                      background: 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.4)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-black px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: ep.bg, color: ep.color }}
                      >
                        {ep.method}
                      </span>
                      <code className="text-sm font-mono font-bold" style={{ color: '#2d3335' }}>{ep.path}</code>
                    </div>
                    <p className="text-sm" style={{ color: '#5a6062' }}>{ep.desc}</p>
                    {ep.body && (
                      <>
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#adb3b5' }}>Request Body</p>
                        <CodeBlock id={`req-${ep.path}`} code={ep.body} />
                      </>
                    )}
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#adb3b5' }}>Response</p>
                    <CodeBlock id={`res-${ep.path}`} code={ep.response} />
                  </div>
                ))}
              </motion.div>
            )}

            {/* ── Examples Tab ── */}
            {activeTab === 'examples' && (
              <motion.div
                key="examples"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {[
                  {
                    lang: 'Python',
                    icon: '🐍',
                    code: `import requests

API_KEY = "sk-your_key_here"
BOT_ID  = "your-bot-uuid"

response = requests.post(
    "https://api.docbot.io/api/v1/chat",
    headers={"X-API-Key": API_KEY},
    json={
        "bot_id": BOT_ID,
        "message": "What is your refund policy?",
        "session_id": "user-001"
    }
)

print(response.json()["answer"])`,
                  },
                  {
                    lang: 'JavaScript',
                    icon: '🟨',
                    code: `const response = await fetch(
  "https://api.docbot.io/api/v1/chat",
  {
    method: "POST",
    headers: {
      "X-API-Key": "sk-your_key_here",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bot_id: "your-bot-uuid",
      message: "What is your refund policy?",
      session_id: "user-001",
    }),
  }
);

const { answer } = await response.json();
console.log(answer);`,
                  },
                  {
                    lang: 'cURL',
                    icon: '⚡',
                    code: `curl -X POST https://api.docbot.io/api/v1/chat \\
  -H "X-API-Key: sk-your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "bot_id": "your-bot-uuid",
    "message": "What is your refund policy?",
    "session_id": "user-001"
  }'`,
                  },
                ].map(ex => (
                  <div
                    key={ex.lang}
                    className="p-5 rounded-2xl space-y-4"
                    style={{
                      background: 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.4)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{ex.icon}</span>
                      <p className="text-sm font-bold" style={{ color: '#2d3335' }}>{ex.lang}</p>
                    </div>
                    <CodeBlock id={ex.lang} code={ex.code} />
                  </div>
                ))}

                {/* Rate limits note */}
                <div
                  className="flex gap-3 p-5 rounded-2xl"
                  style={{
                    background: 'rgba(116,47,229,0.05)',
                    border: '1px solid rgba(116,47,229,0.12)',
                  }}
                >
                  <span className="material-symbols-outlined text-lg shrink-0" style={{ color: '#742fe5' }}>
                    info
                  </span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#742fe5' }}>Rate Limits</p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: '#5a6062' }}>
                      Free tier: 100 requests/day per API key. Responses are streamed for latency under 1s.
                      Contact support to upgrade your limits.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ── Bottom right meta ── */}
        <div
          className="fixed bottom-12 right-12 z-10 flex flex-col items-end space-y-2 transition-opacity duration-300"
          style={{ opacity: 0.4 }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0.4}
        >
          <p className="font-bold tracking-widest uppercase" style={{ fontSize: '10px', color: '#767c7e' }}>
            DocBot v1.0
          </p>
          <div className="flex space-x-4">
            {['DOCS', 'STATUS', 'SUPPORT'].map(link => (
              <a key={link} href="#" className="font-bold transition-colors"
                style={{ fontSize: '10px', color: '#5a6062' }}
                onMouseEnter={e => e.target.style.color = '#742fe5'}
                onMouseLeave={e => e.target.style.color = '#5a6062'}>
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}