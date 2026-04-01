import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import BotWizard from '../components/BotWizard'
import BotPanel from '../components/BotPanel'
import PageTransition from '../components/PageTransition'

export default function Dashboard() {
  const [bots, setBots] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [showBots, setShowBots] = useState(false)
  const [selectedBotId, setSelectedBotId] = useState(null)
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const username = user?.email?.split('@')[0] || 'there'

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const fetchBots = () => {
    setLoading(true)
    api.get('/bots/')
      .then(r => setBots(r.data))
      .catch(() => setBots([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBots() }, [])

  const openBot = (id) => {
    setSelectedBotId(id)
    setSearch('')
    setSearchFocused(false)
  }

  const navItems = [
    {
      icon: selectedBotId ? 'arrow_back' : 'grid_view',
      label: selectedBotId ? 'Back' : 'Dashboard',
      action: () => { setSelectedBotId(null); setShowBots(false); setSearch('') },
    },
    {
      icon: 'smart_toy',
      label: 'My Bots',
      action: () => { setSelectedBotId(null); setShowBots(true) },
    },
    {
      icon: 'description',
      label: 'Docs',
      action: () => {},
    },
    {
      icon: 'api',
      label: 'API',
      action: () => navigate('/dev'),
    },
    {
      icon: 'logout',
      label: 'Sign out',
      action: () => { logout(); navigate('/login') },
    },
  ]

  const activeNavIndex = selectedBotId ? 0 : showBots ? 1 : 0

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
            {navItems.map((item, i) => {
              const isActive = i === activeNavIndex && !selectedBotId
                ? activeNavIndex === i
                : selectedBotId && i === 0

              return (
                <motion.button
                  key={item.icon + i}
                  onClick={item.action}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  title={item.label}
                  className="w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200"
                  style={
                    (!selectedBotId && i === 0 && !showBots) ||
                    (!selectedBotId && i === 1 && showBots)
                      ? { backgroundColor: 'white', color: '#742fe5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }
                      : { color: '#64748b' }
                  }
                  onMouseEnter={e => {
                    const active =
                      (!selectedBotId && i === 0 && !showBots) ||
                      (!selectedBotId && i === 1 && showBots)
                    if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.5)'
                  }}
                  onMouseLeave={e => {
                    const active =
                      (!selectedBotId && i === 0 && !showBots) ||
                      (!selectedBotId && i === 1 && showBots)
                    if (!active) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                </motion.button>
              )
            })}
          </nav>
        </aside>

        {/* ── Top bar ── */}
        <header className="fixed top-0 w-full flex items-center justify-between px-8 py-6 z-50">
          <span className="text-xl font-bold tracking-tighter" style={{ color: '#0f172a' }}>
            DocBot
          </span>
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
              onClick={() => navigate('/dev')}
            >
              {username[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* ── Main canvas ── */}
        <main className="relative w-full max-w-2xl px-6 flex flex-col items-center mt-16">
          <AnimatePresence mode="wait">

            {/* ────── Bot Detail View ────── */}
            {selectedBotId ? (
              <BotPanel
                key="botpanel"
                botId={selectedBotId}
                onBack={() => { setSelectedBotId(null); setShowBots(true) }}
              />

            ) : !showBots ? (
              /* ────── Home View ────── */
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center w-full"
              >
                {/* Welcome */}
                <div className="mb-12 text-center">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="font-medium tracking-widest uppercase mb-3"
                    style={{ color: '#742fe5', fontSize: '0.65rem' }}
                  >
                    Workspace Dashboard
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="text-4xl md:text-5xl font-bold tracking-tight"
                    style={{ color: '#2d3335' }}
                  >
                    {greeting()},{' '}
                    <span style={{ color: '#742fe5' }}>
                      {username.charAt(0).toUpperCase() + username.slice(1)}
                    </span>
                  </motion.h1>
                </div>

                {/* Search bar */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="w-full relative"
                >
                  {/* Glow */}
                  <div
                    className="absolute inset-0 rounded-full transition-opacity duration-700"
                    style={{
                      background: 'rgba(116,47,229,0.05)',
                      filter: 'blur(40px)',
                      transform: 'scale(1.1)',
                      opacity: searchFocused ? 1 : 0,
                    }}
                  />

                  {/* Bar */}
                  <div
                    className="relative flex items-center w-full px-8 py-5 transition-all duration-300"
                    style={{
                      background: 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      borderRadius: 9999,
                      boxShadow: '0 20px 40px rgba(45,51,53,0.06)',
                      border: searchFocused
                        ? '1px solid rgba(116,47,229,0.35)'
                        : '1px solid rgba(255,255,255,0.4)',
                    }}
                  >
                    <span className="material-symbols-outlined mr-4" style={{ color: '#adb3b5' }}>
                      {search ? 'smart_toy' : 'search'}
                    </span>
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                      onKeyDown={e => {
                        if (e.key === 'Escape') { setSearch(''); setSearchFocused(false) }
                      }}
                      className="w-full bg-transparent border-none focus:ring-0 text-lg font-medium focus:outline-none placeholder:text-[#adb3b5]"
                      placeholder="Search bots or ask DocBot..."
                      style={{ color: '#2d3335' }}
                    />
                    {search ? (
                      <button
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => setSearch('')}
                        className="ml-4 w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: '#f1f4f5', color: '#767c7e' }}
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    ) : (
                      <div
                        className="hidden md:flex items-center space-x-1 ml-4 px-2 py-1 rounded-md shrink-0"
                        style={{ backgroundColor: '#f1f4f5' }}
                      >
                        <span className="text-[10px] font-bold" style={{ color: '#767c7e' }}>⌘</span>
                        <span className="text-[10px] font-bold" style={{ color: '#767c7e' }}>K</span>
                      </div>
                    )}
                  </div>

                  {/* Floating dropdown */}
                  <AnimatePresence>
                    {search && searchFocused && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-3 rounded-2xl overflow-hidden z-50"
                        style={{
                          background: 'rgba(255,255,255,0.95)',
                          backdropFilter: 'blur(24px)',
                          WebkitBackdropFilter: 'blur(24px)',
                          boxShadow: '0 20px 40px rgba(45,51,53,0.12)',
                          border: '1px solid rgba(255,255,255,0.6)',
                        }}
                      >
                        {/* Bot matches */}
                        {bots.filter(b => b.name.toLowerCase().includes(search.toLowerCase())).length > 0 && (
                          <div className="p-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-2"
                              style={{ color: '#adb3b5' }}>
                              Your Bots
                            </p>
                            {bots
                              .filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
                              .slice(0, 4)
                              .map(bot => (
                                <button
                                  key={bot.id}
                                  onMouseDown={() => openBot(bot.id)}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(116,47,229,0.05)'}
                                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <div
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
                                    style={{ background: 'linear-gradient(135deg, rgba(116,47,229,0.12), rgba(131,66,244,0.12))' }}
                                  >
                                    🤖
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate" style={{ color: '#2d3335' }}>{bot.name}</p>
                                    <p className="text-xs" style={{ color: '#767c7e' }}>{bot.language?.toUpperCase()}</p>
                                  </div>
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                                    style={bot.telegram_webhook_active
                                      ? { backgroundColor: '#f0fdf4', color: '#16a34a' }
                                      : { backgroundColor: '#f1f4f5', color: '#767c7e' }}
                                  >
                                    {bot.telegram_webhook_active ? '● Live' : '○ Offline'}
                                  </span>
                                </button>
                              ))}
                          </div>
                        )}

                        {/* Divider */}
                        {bots.filter(b => b.name.toLowerCase().includes(search.toLowerCase())).length > 0 && (
                          <div style={{ height: 1, backgroundColor: '#f1f4f5', margin: '0 12px' }} />
                        )}

                        {/* Ask DocBot */}
                        <div className="p-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-2"
                            style={{ color: '#adb3b5' }}>
                            Ask DocBot
                          </p>
                          <button
                            onMouseDown={() => {
                              if (bots.length > 0) openBot(bots[0].id)
                              else setShowWizard(true)
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(116,47,229,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: 'linear-gradient(135deg, #742fe5, #8342f4)' }}
                            >
                              <span className="material-symbols-outlined text-white text-sm"
                                style={{ fontVariationSettings: "'FILL' 1" }}>
                                smart_toy
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: '#2d3335' }}>
                                "{search.length > 35 ? search.slice(0, 35) + '…' : search}"
                              </p>
                              <p className="text-xs" style={{ color: '#767c7e' }}>
                                {bots.length > 0 ? 'Go to bot and ask this question' : 'Create a bot first'}
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-sm" style={{ color: '#742fe5' }}>
                              arrow_forward
                            </span>
                          </button>
                        </div>

                        {/* No results */}
                        {bots.filter(b => b.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                          <div className="px-5 pb-4 text-center">
                            <p className="text-sm font-medium" style={{ color: '#5a6062' }}>
                              No bots match "{search}"
                            </p>
                            <button
                              onMouseDown={() => setShowWizard(true)}
                              className="mt-2 text-xs font-bold hover:underline"
                              style={{ color: '#742fe5' }}
                            >
                              + Create a new bot
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Action circles */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                  className="mt-16 flex items-center justify-center space-x-12 md:space-x-20"
                >
                  {[
                    { icon: 'add_circle', label: 'Create Bot', action: () => setShowWizard(true) },
                    { icon: 'smart_toy',  label: 'My Bots',    action: () => setShowBots(true) },
                    { icon: 'api',        label: 'Get API',    action: () => navigate('/dev') },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.07 }}
                      className="flex flex-col items-center space-y-4 cursor-pointer"
                      onClick={item.action}
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.93 }}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-300"
                        style={{
                          background: 'rgba(255,255,255,0.7)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                          border: '1px solid rgba(255,255,255,0.4)',
                          color: '#5a6062',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#742fe5'
                          e.currentTarget.style.color = 'white'
                          e.currentTarget.style.boxShadow = '0 12px 32px rgba(116,47,229,0.25)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.7)'
                          e.currentTarget.style.color = '#5a6062'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'
                        }}
                      >
                        <span className="material-symbols-outlined text-2xl md:text-3xl">{item.icon}</span>
                      </motion.button>
                      <span className="text-xs font-semibold tracking-wide" style={{ color: '#5a6062' }}>
                        {item.label}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-24 text-center"
                >
                  <div className="flex items-center justify-center space-x-6">
                    {[
                      { value: loading ? '…' : bots.length, label: 'Active Bots' },
                      { value: loading ? '…' : bots.filter(b => b.telegram_webhook_active).length, label: 'On Telegram' },
                      { value: '99.9%', label: 'Uptime' },
                    ].map((stat, i) => (
                      <div key={stat.label} className="flex items-center space-x-6">
                        {i > 0 && (
                          <div className="h-8 w-[1px]" style={{ backgroundColor: 'rgba(173,179,181,0.3)' }} />
                        )}
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-bold" style={{ color: '#2d3335' }}>{stat.value}</span>
                          <span className="font-bold uppercase tracking-tighter"
                            style={{ color: '#adb3b5', fontSize: '10px' }}>
                            {stat.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>

            ) : (
              /* ────── Bots List View ────── */
              <motion.div
                key="bots"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#2d3335' }}>Your Bots</h2>
                    <p className="text-sm mt-0.5" style={{ color: '#5a6062' }}>
                      {loading ? 'Loading...' : `${bots.length} bot${bots.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowWizard(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #742fe5, #8342f4)',
                      boxShadow: '0 6px 20px rgba(116,47,229,0.2)',
                    }}
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    New Bot
                  </motion.button>
                </div>

                {/* Inline search */}
                <div
                  className="flex items-center px-5 py-3 rounded-2xl mb-5"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                >
                  <span className="material-symbols-outlined mr-3" style={{ color: '#adb3b5' }}>search</span>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Filter bots..."
                    className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm"
                    style={{ color: '#2d3335' }}
                  />
                  {search && (
                    <button onClick={() => setSearch('')}>
                      <span className="material-symbols-outlined text-sm" style={{ color: '#adb3b5' }}>close</span>
                    </button>
                  )}
                </div>

                {/* Bot cards */}
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 rounded-2xl animate-pulse"
                        style={{ backgroundColor: 'rgba(255,255,255,0.6)' }} />
                    ))}
                  </div>
                ) : bots.filter(b => b.name.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-5xl mb-4">🤖</div>
                    <p className="font-semibold" style={{ color: '#2d3335' }}>
                      {search ? `No bots match "${search}"` : 'No bots yet'}
                    </p>
                    <p className="text-sm mt-1 mb-5" style={{ color: '#5a6062' }}>
                      {search ? 'Try a different name' : 'Create your first bot to get started'}
                    </p>
                    {!search && (
                      <button
                        onClick={() => setShowWizard(true)}
                        className="px-5 py-2.5 rounded-full text-white text-sm font-bold"
                        style={{ background: 'linear-gradient(135deg, #742fe5, #8342f4)' }}
                      >
                        Create Bot
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 420 }}>
                    <AnimatePresence>
                      {bots
                        .filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
                        .map((bot, i) => (
                          <motion.div
                            key={bot.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => openBot(bot.id)}
                            className="flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer group transition-all duration-200"
                            style={{
                              background: 'rgba(255,255,255,0.7)',
                              backdropFilter: 'blur(20px)',
                              border: '1px solid rgba(255,255,255,0.4)',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.border = '1px solid rgba(116,47,229,0.25)'
                              e.currentTarget.style.boxShadow = '0 8px 24px rgba(116,47,229,0.08)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.4)'
                              e.currentTarget.style.boxShadow = 'none'
                            }}
                          >
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                              style={{ background: 'linear-gradient(135deg, rgba(116,47,229,0.12), rgba(131,66,244,0.12))' }}
                            >
                              🤖
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate" style={{ color: '#2d3335' }}>{bot.name}</p>
                              <p className="text-xs mt-0.5" style={{ color: '#767c7e' }}>
                                {bot.language?.toUpperCase()} · {new Date(bot.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
                              style={bot.telegram_webhook_active
                                ? { backgroundColor: '#f0fdf4', color: '#16a34a' }
                                : { backgroundColor: '#f1f4f5', color: '#767c7e' }}
                            >
                              {bot.telegram_webhook_active ? '● Live' : '○ Offline'}
                            </span>
                            <span
                              className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              style={{ color: '#742fe5' }}
                            >
                              arrow_forward
                            </span>
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </div>
                )}
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
              <a
                key={link}
                href="#"
                className="font-bold transition-colors"
                style={{ fontSize: '10px', color: '#5a6062' }}
                onMouseEnter={e => e.target.style.color = '#742fe5'}
                onMouseLeave={e => e.target.style.color = '#5a6062'}
              >
                {link}
              </a>
            ))}
          </div>
        </div>

        {/* ── Wizard ── */}
        {showWizard && (
          <BotWizard
            onClose={() => setShowWizard(false)}
            onCreated={() => {
              setShowWizard(false)
              fetchBots()
              setShowBots(true)
            }}
          />
        )}
      </div>
    </PageTransition>
  )
}