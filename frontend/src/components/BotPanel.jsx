import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/client'

// ── Documents Tab ──────────────────────────────────────────────────────────
function DocumentsTab({ botId }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const fetchDocs = () => {
    api.get(`/bots/${botId}/documents/`)
      .then(r => setDocs(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDocs() }, [botId])

  const upload = async (files) => {
    setUploading(true)
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      await api.post(`/bots/${botId}/documents/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).catch(() => {})
    }
    fetchDocs()
    setUploading(false)
  }

  const deleteDoc = async (docId) => {
    await api.delete(`/bots/${botId}/documents/${docId}`)
    setDocs(prev => prev.filter(d => d.id !== docId))
  }

  const statusStyle = (status) => {
    if (status === 'indexed')  return { bg: '#f0fdf4', color: '#16a34a', label: 'Indexed' }
    if (status === 'pending')  return { bg: '#fefce8', color: '#ca8a04', label: 'Processing' }
    return                            { bg: '#fff0f0', color: '#a8364b', label: 'Failed' }
  }

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onClick={() => fileRef.current.click()}
        className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all"
        style={{ borderColor: '#adb3b5' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#742fe5'; e.currentTarget.style.backgroundColor = 'rgba(116,47,229,0.02)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#adb3b5'; e.currentTarget.style.backgroundColor = 'transparent' }}
        onDrop={e => { e.preventDefault(); upload(e.dataTransfer.files) }}
        onDragOver={e => e.preventDefault()}
      >
        <div className="text-3xl mb-2">{uploading ? '⏳' : '📁'}</div>
        <p className="text-sm font-semibold" style={{ color: '#2d3335' }}>
          {uploading ? 'Uploading...' : 'Drop files or click to upload'}
        </p>
        <p className="text-xs mt-1" style={{ color: '#767c7e' }}>PDF, DOCX, TXT</p>
        <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.txt" className="hidden"
          onChange={e => upload(e.target.files)} />
      </div>

      {/* Doc list */}
      {loading ? (
        <div className="space-y-2">
          {[1,2].map(i => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: '#f1f4f5' }} />)}
        </div>
      ) : docs.length === 0 ? (
        <p className="text-center text-sm py-6" style={{ color: '#adb3b5' }}>No documents yet</p>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => {
            const s = statusStyle(doc.status)
            return (
              <div key={doc.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor: '#f8f9fa', border: '1px solid #ebeef0' }}>
                <span className="text-xl shrink-0">
                  {doc.filename?.endsWith('.pdf') ? '📕' : doc.filename?.endsWith('.docx') ? '📘' : '📄'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#2d3335' }}>{doc.filename}</p>
                  <p className="text-xs" style={{ color: '#767c7e' }}>{doc.chunk_count || 0} chunks</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
                  style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                <button onClick={() => deleteDoc(doc.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0"
                  style={{ color: '#adb3b5' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#adb3b5' }}>
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Persona Tab ────────────────────────────────────────────────────────────
function PersonaTab({ bot, onSaved }) {
  const [persona, setPersona] = useState(bot.persona || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    await api.put(`/bots/${bot.id}`, { persona }).catch(() => {})
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    if (onSaved) onSaved()
  }

  const templates = [
    { label: 'Support',   prompt: 'You are a helpful customer support assistant. Be patient, clear, and empathetic. Only answer questions based on the provided documents.' },
    { label: 'Sales',     prompt: 'You are an enthusiastic sales assistant. Help users understand products and pricing. Be friendly and persuasive.' },
    { label: 'HR',        prompt: 'You are an HR assistant. Answer employee questions about policies, benefits, and procedures based on the provided documentation.' },
    { label: 'Technical', prompt: 'You are a technical assistant. Provide precise, accurate answers. Use proper terminology and structure your responses clearly.' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {templates.map(t => (
          <button key={t.label} onClick={() => setPersona(t.prompt)}
            className="px-3 py-2 rounded-xl text-xs font-bold transition-all border"
            style={{
              backgroundColor: persona === t.prompt ? 'rgba(116,47,229,0.1)' : '#f1f4f5',
              color: persona === t.prompt ? '#742fe5' : '#5a6062',
              borderColor: persona === t.prompt ? '#742fe5' : 'transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>
      <textarea rows={8} value={persona} onChange={e => setPersona(e.target.value)}
        placeholder="Describe your bot's personality, tone, and constraints..."
        className="w-full border-none rounded-2xl p-5 focus:outline-none resize-none placeholder:text-[#adb3b5] transition-all"
        style={{ backgroundColor: '#f1f4f5', color: '#2d3335' }}
        onFocus={e => { e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(116,47,229,0.25)' }}
        onBlur={e => { e.target.style.backgroundColor = '#f1f4f5'; e.target.style.boxShadow = 'none' }}
      />
      <motion.button onClick={save} disabled={saving}
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
        className="px-6 py-2.5 rounded-full text-white text-sm font-bold transition-all"
        style={{ background: saved ? '#16a34a' : 'linear-gradient(135deg, #742fe5, #8342f4)' }}>
        {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Persona'}
      </motion.button>
    </div>
  )
}

// ── Telegram Tab ───────────────────────────────────────────────────────────
function TelegramTab({ bot, onUpdated }) {
  const [token, setToken] = useState(bot.telegram_token || '')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  const deploy = async () => {
    setLoading(true); setStatus(null)
    try {
      await api.post(`/bots/${bot.id}/telegram/deploy`, { telegram_token: token })
      setStatus('success')
      if (onUpdated) onUpdated()
    } catch (e) {
      setStatus('error')
    } finally { setLoading(false) }
  }

  const undeploy = async () => {
    setLoading(true); setStatus(null)
    try {
      await api.delete(`/bots/${bot.id}/telegram/undeploy`)
      setStatus('undeployed')
      if (onUpdated) onUpdated()
    } catch { setStatus('error') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      {/* Status pill */}
      <div className="flex items-center gap-3 p-4 rounded-2xl"
        style={{ backgroundColor: bot.telegram_webhook_active ? '#f0fdf4' : '#f8f9fa', border: '1px solid #ebeef0' }}>
        <span className="text-2xl">{bot.telegram_webhook_active ? '✅' : '💤'}</span>
        <div>
          <p className="text-sm font-bold" style={{ color: '#2d3335' }}>
            {bot.telegram_webhook_active ? 'Live on Telegram' : 'Not deployed'}
          </p>
          <p className="text-xs" style={{ color: '#767c7e' }}>
            {bot.telegram_webhook_active ? 'Your bot is receiving messages' : 'Connect a token to go live'}
          </p>
        </div>
      </div>

      {/* How to guide */}
      <div className="p-4 rounded-xl space-y-2" style={{ backgroundColor: 'rgba(116,47,229,0.05)' }}>
        <p className="text-xs font-bold" style={{ color: '#742fe5' }}>Get your token in 3 steps:</p>
        {['Open Telegram → search @BotFather', 'Send /newbot and follow the prompts', 'Copy the token and paste below'].map((s, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ backgroundColor: '#742fe5', color: 'white' }}>{i+1}</span>
            <span className="text-xs" style={{ color: '#5a6062' }}>{s}</span>
          </div>
        ))}
      </div>

      {/* Token input */}
      <input type="text" value={token} onChange={e => setToken(e.target.value)}
        placeholder="1234567890:AAFxxxxxxxxxxxxxxxxxxxxxxx"
        className="w-full px-5 py-4 border-none rounded-2xl focus:outline-none font-mono text-sm placeholder:text-[#adb3b5] transition-all"
        style={{ backgroundColor: '#f1f4f5', color: '#2d3335' }}
        onFocus={e => { e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(116,47,229,0.25)' }}
        onBlur={e => { e.target.style.backgroundColor = '#f1f4f5'; e.target.style.boxShadow = 'none' }}
      />

      {/* Status feedback */}
      <AnimatePresence>
        {status && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-4 py-3 rounded-xl text-sm font-medium"
            style={{
              backgroundColor: status === 'success' ? '#f0fdf4' : status === 'undeployed' ? '#f1f4f5' : '#fff0f0',
              color: status === 'success' ? '#16a34a' : status === 'undeployed' ? '#5a6062' : '#a8364b',
            }}>
            {status === 'success' ? '✓ Bot deployed successfully!' : status === 'undeployed' ? 'Bot undeployed.' : '✗ Failed. Check your token.'}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <motion.button onClick={deploy} disabled={loading || !token.trim()}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
          className="flex-1 py-3 rounded-full text-white text-sm font-bold disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #742fe5, #8342f4)' }}>
          {loading ? 'Deploying...' : '🚀 Deploy'}
        </motion.button>
        {bot.telegram_webhook_active && (
          <button onClick={undeploy} disabled={loading}
            className="px-5 py-3 rounded-full text-sm font-bold transition-all"
            style={{ backgroundColor: '#f1f4f5', color: '#5a6062' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f1f4f5'}>
            Undeploy
          </button>
        )}
      </div>
    </div>
  )
}

// ── Chat Tab ───────────────────────────────────────────────────────────────
function ChatTab({ botId }) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I\'m ready to answer questions based on my documents. Ask me anything.' }
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const sessionId = useRef(`session_${Date.now()}`)
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const send = async () => {
    const text = input.trim()
    if (!text || thinking) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setThinking(true)
    try {
      const res = await api.post('/chat', { bot_id: botId, message: text, session_id: sessionId.current })
      setMessages(prev => [...prev, { role: 'bot', text: res.data.answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Something went wrong. Please try again.' }])
    } finally { setThinking(false) }
  }

  return (
    <div className="flex flex-col" style={{ height: 380 }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-3">
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
              style={msg.role === 'user'
                ? { background: 'linear-gradient(135deg, #742fe5, #8342f4)', color: 'white', borderBottomRightRadius: 6 }
                : { backgroundColor: '#f1f4f5', color: '#2d3335', borderBottomLeftRadius: 6 }}>
              {msg.text}
            </div>
          </motion.div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl flex gap-1.5 items-center" style={{ backgroundColor: '#f1f4f5', borderBottomLeftRadius: 6 }}>
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: '#742fe5' }}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: '#ebeef0' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask a question..."
          className="flex-1 px-4 py-3 rounded-2xl border-none focus:outline-none text-sm placeholder:text-[#adb3b5] transition-all"
          style={{ backgroundColor: '#f1f4f5', color: '#2d3335' }}
          onFocus={e => { e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(116,47,229,0.2)' }}
          onBlur={e => { e.target.style.backgroundColor = '#f1f4f5'; e.target.style.boxShadow = 'none' }}
        />
        <motion.button onClick={send} disabled={!input.trim() || thinking}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 transition-all"
          style={{ background: 'linear-gradient(135deg, #742fe5, #8342f4)', color: 'white' }}>
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
        </motion.button>
      </div>
    </div>
  )
}

// ── Main BotPanel ──────────────────────────────────────────────────────────
export default function BotPanel({ botId, onBack }) {
  const [bot, setBot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('chat')

  const fetchBot = () => {
    api.get(`/bots/${botId}`)
      .then(r => setBot(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBot() }, [botId])

  const tabs = [
    { id: 'chat',      icon: 'chat',        label: 'Test Chat' },
    { id: 'documents', icon: 'folder_open', label: 'Documents' },
    { id: 'persona',   icon: 'psychology',  label: 'Persona' },
    { id: 'telegram',  icon: 'send',        label: 'Telegram' },
  ]

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#742fe5', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!bot) {
    return (
      <div className="text-center py-20">
        <p style={{ color: '#5a6062' }}>Bot not found.</p>
        <button onClick={onBack} className="mt-3 text-sm font-bold" style={{ color: '#742fe5' }}>← Back</button>
      </div>
    )
  }

  return (
    <motion.div
      key="botpanel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      {/* Bot header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0"
          style={{ backgroundColor: '#f1f4f5', color: '#5a6062' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ebeef0'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f1f4f5'}>
          <span className="material-symbols-outlined text-sm">arrow_back</span>
        </button>
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(116,47,229,0.15), rgba(131,66,244,0.15))' }}>
          🤖
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg truncate" style={{ color: '#2d3335' }}>{bot.name}</h2>
          <p className="text-xs" style={{ color: '#767c7e' }}>
            {bot.language?.toUpperCase()} · {bot.telegram_webhook_active ? '● Live on Telegram' : '○ Not deployed'}
          </p>
        </div>
        <span
          className="text-xs px-3 py-1.5 rounded-full font-medium shrink-0"
          style={bot.telegram_webhook_active
            ? { backgroundColor: '#f0fdf4', color: '#16a34a' }
            : { backgroundColor: '#f1f4f5', color: '#767c7e' }}>
          {bot.telegram_webhook_active ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl mb-5" style={{ backgroundColor: '#f1f4f5' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
            style={activeTab === tab.id
              ? { backgroundColor: 'white', color: '#742fe5', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
              : { color: '#5a6062' }}>
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}>
          {activeTab === 'chat'      && <ChatTab botId={bot.id} />}
          {activeTab === 'documents' && <DocumentsTab botId={bot.id} />}
          {activeTab === 'persona'   && <PersonaTab bot={bot} onSaved={fetchBot} />}
          {activeTab === 'telegram'  && <TelegramTab bot={bot} onUpdated={fetchBot} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}