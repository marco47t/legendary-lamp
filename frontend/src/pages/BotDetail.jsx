import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import ChatWidget from '../components/ChatWidget'

const TABS = [
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'persona', label: 'Persona', icon: '🎭' },
  { id: 'telegram', label: 'Telegram', icon: '✈️' },
  { id: 'test', label: 'Test Chat', icon: '💬' },
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

  useEffect(() => {
    Promise.all([api.get(`/bots/${id}`), api.get(`/bots/${id}/documents/`)])
      .then(([b, d]) => { setBot(b.data); setPersona(b.data.persona || ''); setDocs(d.data) })
      .finally(() => setLoading(false))
  }, [id])

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
    } finally {
      setDeploying(false)
    }
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
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
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

      {/* Documents */}
      {activeTab === 'documents' && (
        <div className="max-w-2xl">
          {/* Drop zone */}
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

          {/* Doc list */}
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

      {/* Persona */}
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
                  personaSaved
                    ? 'bg-green-500 text-white'
                    : 'bg-brand-600 hover:bg-brand-700 text-white'
                } disabled:opacity-60`}
              >
                {personaSaved ? '✓ Saved!' : savingPersona ? 'Saving...' : 'Save Persona'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telegram */}
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

              {/* Steps */}
              <div className="bg-brand-50 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-brand-800 mb-3">Get your bot token in 3 steps:</p>
                <div className="space-y-2">
                  {[
                    'Open Telegram and search @BotFather',
                    'Send /newbot and follow the prompts',
                    'Copy the token and paste it below',
                  ].map((step, i) => (
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

      {/* Test Chat */}
      {activeTab === 'test' && (
        <div className="max-w-2xl">
          <p className="text-sm text-gray-500 mb-4">Test your bot live — ask questions about the uploaded documents</p>
          <ChatWidget botId={id} />
        </div>
      )}
    </div>
  )
}