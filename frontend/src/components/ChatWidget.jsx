import { useState, useRef, useEffect } from 'react'
import api from '../api/client'

export default function ChatWidget({ botId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const sessionId = `web-${botId}-${Date.now()}`

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setLoading(true)
    try {
      const res = await api.post('/chat', { bot_id: botId, message: text, session_id: sessionId })
      setMessages(prev => [...prev, { role: 'bot', text: res.data.answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[480px] bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-semibold text-sm">B</div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Bot Preview</p>
          <p className="text-xs text-green-500 font-medium">● Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-2xl mb-3">💬</div>
            <p className="text-sm font-medium text-gray-600">Start a conversation</p>
            <p className="text-xs text-gray-400 mt-1">Ask anything about your uploaded documents</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'bot' && (
              <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 text-xs font-semibold shrink-0 mt-0.5">B</div>
            )}
            <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-brand-600 text-white rounded-tr-sm'
                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 text-xs font-semibold shrink-0">B</div>
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex gap-2 bg-gray-50 rounded-xl px-4 py-2 border border-gray-200 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type your message..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-7 h-7 bg-brand-600 hover:bg-brand-700 disabled:opacity-30 text-white rounded-lg flex items-center justify-center transition shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}