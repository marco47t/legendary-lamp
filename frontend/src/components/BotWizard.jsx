import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/client'

// ─── Shared step wrapper ───────────────────────────────────────────────────
function WizardShell({ step, totalSteps, percent, onBack, onNext, nextLabel, nextIcon, nextDisabled, loading, children }) {
  const steps = [
    { label: 'Identity',  icon: 'badge' },
    { label: 'Knowledge', icon: 'folder_open' },
    { label: 'Persona',   icon: 'psychology' },
    { label: 'Deploy',    icon: 'rocket_launch' },
  ]

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col overflow-hidden rounded-xl"
      style={{ background: 'white', boxShadow: '0 20px 40px rgba(45,51,53,0.08)' }}>

      {/* Header */}
      <header className="p-8 pb-4">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="font-bold tracking-wider text-[0.75rem] uppercase" style={{ color: '#742fe5' }}>
              Configuration
            </span>
            <h1 className="text-2xl font-black tracking-tight mt-1" style={{ color: '#2d3335' }}>
              Step {step} of {totalSteps}: {steps[step - 1].label}
            </h1>
          </div>
          <span className="font-medium text-sm" style={{ color: '#5a6062' }}>{percent}% Complete</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#ebeef0' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: '#742fe5' }}
            initial={false}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between mt-8 px-2 relative">
          <div className="absolute top-5 left-10 right-10 h-[2px]" style={{ backgroundColor: '#ebeef0', zIndex: 0 }} />
          {steps.map((s, i) => {
            const num = i + 1
            const done = num < step
            const active = num === step
            return (
              <div key={s.label} className="relative flex flex-col items-center gap-2" style={{ zIndex: 1 }}>
                <motion.div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                  animate={{
                    backgroundColor: done || active ? '#742fe5' : '#ebeef0',
                    color: done || active ? '#ffffff' : '#5a6062',
                    boxShadow: active ? '0 0 20px rgba(116,47,229,0.35)' : 'none',
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ outline: '4px solid white' }}
                >
                  {done
                    ? <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                    : <span>{num}</span>
                  }
                </motion.div>
                <span className="text-[0.7rem] font-bold uppercase tracking-tighter"
                  style={{ color: active ? '#742fe5' : done ? '#2d3335' : '#adb3b5' }}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </header>

      {/* Content */}
      <section className="px-8 py-6 flex-grow min-h-[320px]">
        {children}
      </section>

      {/* Footer */}
      <footer className="p-8 pt-4 flex items-center justify-between"
        style={{ backgroundColor: 'rgba(241,244,245,0.5)' }}>
        <button
          onClick={onBack}
          disabled={step === 1}
          className="px-6 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-30"
          style={{ color: '#2d3335' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ebeef0'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back
        </button>

        <motion.button
          onClick={onNext}
          disabled={nextDisabled || loading}
          whileHover={{ scale: nextDisabled ? 1 : 1.02 }}
          whileTap={{ scale: nextDisabled ? 1 : 0.97 }}
          className="px-8 py-3.5 rounded-full font-bold text-sm flex items-center gap-3 disabled:opacity-50 transition-all text-white"
          style={{
            background: 'linear-gradient(135deg, #742fe5 0%, #8342f4 100%)',
            boxShadow: '0 8px 16px rgba(116,47,229,0.22)',
          }}
        >
          {loading ? 'Creating...' : nextLabel}
          <span className="material-symbols-outlined text-lg">{nextIcon}</span>
        </motion.button>
      </footer>
    </div>
  )
}

// ─── Step 1: Identity ─────────────────────────────────────────────────────
function StepIdentity({ data, onChange }) {
  const avatars = ['🤖', '🧠', '💬', '📚', '🎯', '⚡', '🦾', '🌐']

  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      {/* Info banner */}
      <div className="p-4 rounded-xl flex gap-4 border"
        style={{ backgroundColor: 'rgba(233,222,248,0.3)', borderColor: 'rgba(233,222,248,0.4)' }}>
        <span className="material-symbols-outlined" style={{ color: '#742fe5' }}>badge</span>
        <div>
          <h3 className="text-sm font-bold" style={{ color: '#564e63' }}>Give your bot an identity</h3>
          <p className="text-xs leading-relaxed mt-1" style={{ color: 'rgba(86,78,99,0.8)' }}>
            Choose a name and avatar that represent your bot's purpose. This is what users will see.
          </p>
        </div>
      </div>

      {/* Avatar picker */}
      <div className="space-y-2">
        <label className="text-sm font-bold ml-1" style={{ color: '#5a6062' }}>Bot Avatar</label>
        <div className="grid grid-cols-8 gap-2">
          {avatars.map(emoji => (
            <motion.button
              key={emoji}
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange({ avatar: emoji })}
              className="w-full aspect-square rounded-2xl text-2xl flex items-center justify-center transition-all"
              style={{
                backgroundColor: data.avatar === emoji ? 'rgba(116,47,229,0.12)' : '#f1f4f5',
                border: data.avatar === emoji ? '2px solid #742fe5' : '2px solid transparent',
              }}
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Bot name */}
      <div className="space-y-2">
        <label className="text-sm font-bold ml-1" style={{ color: '#5a6062' }}>Bot Name *</label>
        <input
          type="text"
          value={data.name}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g. Customer Support Bot"
          className="w-full px-5 py-4 border-none rounded-2xl focus:outline-none placeholder:text-[#adb3b5] transition-all"
          style={{ backgroundColor: '#f1f4f5', color: '#2d3335' }}
          onFocus={e => { e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(116,47,229,0.25)' }}
          onBlur={e => { e.target.style.backgroundColor = '#f1f4f5'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      {/* Language */}
      <div className="space-y-2">
        <label className="text-sm font-bold ml-1" style={{ color: '#5a6062' }}>Response Language</label>
        <select
          value={data.language}
          onChange={e => onChange({ language: e.target.value })}
          className="w-full px-5 py-4 border-none rounded-2xl focus:outline-none transition-all"
          style={{ backgroundColor: '#f1f4f5', color: '#2d3335' }}
          onFocus={e => { e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(116,47,229,0.25)' }}
          onBlur={e => { e.target.style.backgroundColor = '#f1f4f5'; e.target.style.boxShadow = 'none' }}
        >
          <option value="en">🇬🇧 English</option>
          <option value="ar">🇸🇦 Arabic</option>
          <option value="fr">🇫🇷 French</option>
          <option value="es">🇪🇸 Spanish</option>
          <option value="de">🇩🇪 German</option>
          <option value="tr">🇹🇷 Turkish</option>
        </select>
      </div>
    </motion.div>
  )
}

// ─── Step 2: Knowledge ────────────────────────────────────────────────────
function StepKnowledge({ data, onChange }) {
  const fileRef = useRef()
  const [dragOver, setDragOver] = useState(false)

  const addFiles = (newFiles) => {
    const list = Array.from(newFiles).filter(f =>
      ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(f.type)
        || f.name.endsWith('.pdf') || f.name.endsWith('.docx') || f.name.endsWith('.txt')
    )
    onChange({ files: [...(data.files || []), ...list] })
  }

  const removeFile = (idx) => {
    const updated = [...data.files]
    updated.splice(idx, 1)
    onChange({ files: updated })
  }

  const fileIcon = (name) => {
    if (name.endsWith('.pdf'))  return { icon: '📕', color: '#ef4444' }
    if (name.endsWith('.docx')) return { icon: '📘', color: '#3b82f6' }
    return { icon: '📄', color: '#6b7280' }
  }

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      {/* Info banner */}
      <div className="p-4 rounded-xl flex gap-4 border"
        style={{ backgroundColor: 'rgba(233,222,248,0.3)', borderColor: 'rgba(233,222,248,0.4)' }}>
        <span className="material-symbols-outlined" style={{ color: '#742fe5' }}>folder_open</span>
        <div>
          <h3 className="text-sm font-bold" style={{ color: '#564e63' }}>Upload your knowledge base</h3>
          <p className="text-xs leading-relaxed mt-1" style={{ color: 'rgba(86,78,99,0.8)' }}>
            Your bot will only answer based on these documents. Supports PDF, DOCX, and TXT. You can add more later.
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current.click()}
        onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all"
        style={{
          borderColor: dragOver ? '#742fe5' : '#adb3b5',
          backgroundColor: dragOver ? 'rgba(116,47,229,0.04)' : 'transparent',
        }}
      >
        <motion.div
          animate={{ y: dragOver ? -4 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-5xl mb-3">📁</div>
          <p className="font-bold text-sm" style={{ color: '#2d3335' }}>
            Drop files here or <span style={{ color: '#742fe5' }}>browse</span>
          </p>
          <p className="text-xs mt-1" style={{ color: '#767c7e' }}>PDF, DOCX, TXT — Max 20MB each</p>
        </motion.div>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      <AnimatePresence>
        {data.files?.length > 0 && (
          <div className="space-y-2">
            {data.files.map((file, i) => {
              const { icon } = fileIcon(file.name)
              return (
                <motion.div
                  key={`${file.name}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: '#f1f4f5' }}
                >
                  <span className="text-2xl shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#2d3335' }}>{file.name}</p>
                    <p className="text-xs" style={{ color: '#767c7e' }}>{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ backgroundColor: 'rgba(116,47,229,0.1)', color: '#742fe5' }}>
                    Ready
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ color: '#adb3b5' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444' }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#adb3b5' }}
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </AnimatePresence>

      {(!data.files || data.files.length === 0) && (
        <p className="text-center text-xs font-medium" style={{ color: '#adb3b5' }}>
          You can also skip this and add documents after creating the bot
        </p>
      )}
    </motion.div>
  )
}

// ─── Step 3: Persona ─────────────────────────────────────────────────────
function StepPersona({ data, onChange }) {
  const templates = [
    { label: 'Support', prompt: 'You are a helpful customer support assistant. Be patient, clear, and empathetic. Only answer questions based on the provided documents.' },
    { label: 'Sales', prompt: 'You are an enthusiastic sales assistant. Help users understand products and pricing. Be friendly and persuasive.' },
    { label: 'HR Bot', prompt: 'You are an HR assistant. Answer employee questions about company policies, benefits, and procedures based on the provided documentation.' },
    { label: 'Technical', prompt: 'You are a technical assistant. Provide precise, accurate answers. Use proper terminology and structure your responses clearly.' },
  ]

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      {/* Info banner */}
      <div className="p-4 rounded-xl flex gap-4 border"
        style={{ backgroundColor: 'rgba(233,222,248,0.3)', borderColor: 'rgba(233,222,248,0.4)' }}>
        <span className="material-symbols-outlined" style={{ color: '#742fe5' }}>psychology</span>
        <div>
          <h3 className="text-sm font-bold" style={{ color: '#564e63' }}>Defining Tone &amp; Voice</h3>
          <p className="text-xs leading-relaxed mt-1" style={{ color: 'rgba(86,78,99,0.8)' }}>
            Describe how your bot should behave. Is it professional, witty, or strictly informative? Define its personality here.
          </p>
        </div>
      </div>

      {/* Quick templates */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest ml-1" style={{ color: '#767c7e' }}>Quick Templates</label>
        <div className="grid grid-cols-4 gap-2">
          {templates.map(t => (
            <button
              key={t.label}
              type="button"
              onClick={() => onChange({ persona: t.prompt })}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all border"
              style={{
                backgroundColor: data.persona === t.prompt ? 'rgba(116,47,229,0.1)' : '#f1f4f5',
                color: data.persona === t.prompt ? '#742fe5' : '#5a6062',
                borderColor: data.persona === t.prompt ? '#742fe5' : 'transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="space-y-2">
        <label className="text-sm font-bold ml-1" style={{ color: '#5a6062' }}>
          System Prompt / Persona Description *
        </label>
        <div className="relative">
          <textarea
            rows={8}
            value={data.persona}
            onChange={e => onChange({ persona: e.target.value })}
            placeholder="Example: You are a helpful technical support assistant for a cloud hosting company. Your tone is patient, clear, and professional. Avoid jargon where possible..."
            className="w-full border-none rounded-2xl p-5 focus:outline-none placeholder:text-[#adb3b5] transition-all resize-none"
            style={{ backgroundColor: '#f1f4f5', color: '#2d3335' }}
            onFocus={e => { e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(116,47,229,0.25)' }}
            onBlur={e => { e.target.style.backgroundColor = '#f1f4f5'; e.target.style.boxShadow = 'none' }}
          />
          <div className="absolute bottom-4 right-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#adb3b5' }}>
            {data.persona?.length || 0} chars
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Step 4: Deploy ──────────────────────────────────────────────────────
function StepDeploy({ data, onChange }) {
  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      {/* Info banner */}
      <div className="p-4 rounded-xl flex gap-4 border"
        style={{ backgroundColor: 'rgba(233,222,248,0.3)', borderColor: 'rgba(233,222,248,0.4)' }}>
        <span className="material-symbols-outlined" style={{ color: '#742fe5' }}>rocket_launch</span>
        <div>
          <h3 className="text-sm font-bold" style={{ color: '#564e63' }}>Deploy your bot</h3>
          <p className="text-xs leading-relaxed mt-1" style={{ color: 'rgba(86,78,99,0.8)' }}>
            Connect a Telegram bot token to go live instantly, or skip and deploy later from the bot dashboard.
          </p>
        </div>
      </div>

      {/* Deploy options */}
      <div className="space-y-3">
        {[
          {
            value: 'telegram',
            icon: '✈️',
            title: 'Deploy to Telegram now',
            desc: "Paste your @BotFather token and your bot goes live in seconds",
          },
          {
            value: 'skip',
            icon: '⏭️',
            title: 'Skip for now',
            desc: 'Create the bot and deploy to Telegram later from the dashboard',
          },
        ].map(opt => (
          <motion.button
            key={opt.value}
            type="button"
            whileTap={{ scale: 0.99 }}
            onClick={() => onChange({ deployChoice: opt.value })}
            className="w-full p-5 rounded-2xl text-left flex items-start gap-4 transition-all border-2"
            style={{
              borderColor: data.deployChoice === opt.value ? '#742fe5' : 'transparent',
              backgroundColor: data.deployChoice === opt.value ? 'rgba(116,47,229,0.05)' : '#f1f4f5',
            }}
          >
            <span className="text-3xl shrink-0">{opt.icon}</span>
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: '#2d3335' }}>{opt.title}</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#5a6062' }}>{opt.desc}</p>
            </div>
            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all"
              style={{
                borderColor: data.deployChoice === opt.value ? '#742fe5' : '#adb3b5',
                backgroundColor: data.deployChoice === opt.value ? '#742fe5' : 'transparent',
              }}>
              {data.deployChoice === opt.value && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Telegram token input */}
      <AnimatePresence>
        {data.deployChoice === 'telegram' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-1">
              {/* Mini guide */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(116,47,229,0.06)' }}>
                <p className="text-xs font-bold mb-2" style={{ color: '#742fe5' }}>Get your token in 3 steps:</p>
                <div className="space-y-1.5">
                  {[
                    'Open Telegram → search @BotFather',
                    'Send /newbot and follow the prompts',
                    'Copy the token and paste it below',
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: '#742fe5', color: 'white' }}>
                        {i + 1}
                      </span>
                      <span className="text-xs" style={{ color: '#5a6062' }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={data.telegramToken || ''}
                onChange={e => onChange({ telegramToken: e.target.value })}
                placeholder="1234567890:AAFxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-5 py-4 border-none rounded-2xl focus:outline-none font-mono text-sm placeholder:text-[#adb3b5] transition-all"
                style={{ backgroundColor: '#f1f4f5', color: '#2d3335' }}
                onFocus={e => { e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(116,47,229,0.25)' }}
                onBlur={e => { e.target.style.backgroundColor = '#f1f4f5'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary card */}
      <div className="p-5 rounded-2xl space-y-2 border" style={{ backgroundColor: '#f8f9fa', borderColor: '#dee3e6' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#5a6062' }}>Bot Summary</p>
        {[
          { label: 'Name',       value: data.name || '—' },
          { label: 'Language',   value: data.language?.toUpperCase() || 'EN' },
          { label: 'Documents',  value: data.files?.length > 0 ? `${data.files.length} file(s)` : 'None (add later)' },
          { label: 'Persona',    value: data.persona ? `${data.persona.slice(0, 40)}…` : 'Default' },
        ].map(row => (
          <div key={row.label} className="flex justify-between items-center">
            <span className="text-xs" style={{ color: '#767c7e' }}>{row.label}</span>
            <span className="text-xs font-semibold" style={{ color: '#2d3335' }}>{row.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Main wizard component ─────────────────────────────────────────────────
export default function BotWizard({ onClose, onCreated }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState({
    avatar: '🤖',
    name: '',
    language: 'en',
    files: [],
    persona: '',
    deployChoice: 'skip',
    telegramToken: '',
  })

  const update = (patch) => setData(prev => ({ ...prev, ...patch }))

  const STEPS = 4
  const percentMap = { 1: 25, 2: 50, 3: 75, 4: 100 }

  const nextConfig = {
    1: { label: 'Next: Knowledge Base', icon: 'folder_open', disabled: !data.name.trim() },
    2: { label: 'Next: Bot Persona',    icon: 'psychology',  disabled: false },
    3: { label: 'Next: Deployment',     icon: 'rocket_launch', disabled: !data.persona.trim() },
    4: {
      label: 'Create Bot',
      icon: 'check_circle',
      disabled: data.deployChoice === 'telegram' && !data.telegramToken.trim(),
    },
  }

  const handleNext = async () => {
    if (step < STEPS) { setStep(s => s + 1); return }

    // Final step — create bot
    setLoading(true)
    setError('')
    try {
      // 1. Create bot
      const botRes = await api.post('/bots/', {
        name: data.name,
        language: data.language,
        persona: data.persona,
      })
      const botId = botRes.data.id

      // 2. Upload files if any
      for (const file of data.files) {
        const fd = new FormData()
        fd.append('file', file)
        await api.post(`/bots/${botId}/documents/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      // 3. Deploy to Telegram if chosen
      if (data.deployChoice === 'telegram' && data.telegramToken.trim()) {
        await api.post(`/bots/${botId}/telegram/deploy`, {
          telegram_token: data.telegramToken,
        })
      }

      if (onCreated) onCreated()
      navigate(`/bots/${botId}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create bot. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: 'rgba(116,47,229,0.08)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: 'rgba(125,81,110,0.08)' }} />

      <motion.div
        className="w-full max-w-2xl relative"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all"
          style={{ backgroundColor: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
        >
          <span className="material-symbols-outlined text-sm" style={{ color: '#5a6062' }}>close</span>
        </button>

        <WizardShell
          step={step}
          totalSteps={STEPS}
          percent={percentMap[step]}
          onBack={() => setStep(s => Math.max(1, s - 1))}
          onNext={handleNext}
          nextLabel={nextConfig[step].label}
          nextIcon={nextConfig[step].icon}
          nextDisabled={nextConfig[step].disabled}
          loading={loading}
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
              style={{ backgroundColor: '#fff0f0', color: '#a8364b' }}
            >
              <span className="material-symbols-outlined text-sm">error</span> {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && <StepIdentity data={data} onChange={update} />}
            {step === 2 && <StepKnowledge data={data} onChange={update} />}
            {step === 3 && <StepPersona data={data} onChange={update} />}
            {step === 4 && <StepDeploy data={{ ...data }} onChange={update} />}
          </AnimatePresence>
        </WizardShell>
      </motion.div>
    </div>
  )
}