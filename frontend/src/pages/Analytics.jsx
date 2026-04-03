import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/client'
import PageTransition from '../components/PageTransition'

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchAnalytics = async (isInitial = false) => {
      if (isInitial) setLoading(true)
      try {
        const [summaryRes, dailyRes, botsRes] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/analytics/daily?days=30'),
          api.get('/analytics/bots'),
        ])
        
        setAnalytics({
          ...summaryRes.data,
          daily: dailyRes.data || [],
          bots: botsRes.data || [],
        })
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
        // If initial load fails, set analytics to null to show error state
        if (isInitial) setAnalytics(null)
      } finally {
        if (isInitial) setLoading(false)
      }
    }

    // Initial fetch
    fetchAnalytics(true)

    // Real-time polling every 30 seconds
    const interval = setInterval(() => fetchAnalytics(false), 30000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <PageTransition>
      <div
        className="min-h-screen overflow-auto flex items-start justify-center pt-24 pb-16 relative"
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
        {/* ── Top bar ── */}
        <header className="fixed top-0 w-full flex items-center justify-between px-8 py-6 z-50" style={{ background: 'rgba(248,249,250,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm font-semibold hover:opacity-70 transition-opacity"
            style={{ color: '#742fe5' }}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Dashboard
          </button>
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold tracking-tighter" style={{ color: '#0f172a' }}>
              Analytics
            </span>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Live Updates
            </span>
          </div>
          <div className="w-20" />
        </header>

        {/* ── Main content ── */}
        <main className="relative w-full max-w-5xl px-6 flex flex-col items-center">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 h-32 animate-pulse" />
              ))}
            </div>
          ) : analytics ? (
            <>
              {/* ── KPI Cards ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8"
              >
                {[
                  { label: 'Total Tokens', value: analytics.total_tokens_all_time?.toLocaleString() ?? '0', icon: '⚡', color: 'text-amber-600' },
                  { label: 'Unique Users', value: analytics.unique_users?.toLocaleString() ?? '0', icon: '👤', color: 'text-blue-600' },
                  { label: 'Chats (30d)', value: analytics.chats_last_30_days?.toLocaleString() ?? '0', icon: '💬', color: 'text-purple-600' },
                  { label: 'Tokens (30d)', value: analytics.tokens_last_30_days?.toLocaleString() ?? '0', icon: '📊', color: 'text-emerald-600' },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-2xl mb-2">{kpi.icon}</div>
                    <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                    <div className="text-xs text-gray-400 mt-0.5 font-semibold uppercase tracking-wider">{kpi.label}</div>
                  </div>
                ))}
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                {/* ── Daily Activity Chart ── */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="md:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
                >
                  <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400">calendar_today</span>
                    Daily Activity (Last 30 Days)
                  </h3>
                  
                  {analytics.daily?.some(d => d.chats > 0) ? (
                    <div className="space-y-3">
                      {analytics.daily
                        .filter(d => d.chats > 0 || d.tokens > 0)
                        .slice(-10)
                        .reverse()
                        .map((d, i) => {
                          const maxChats = Math.max(...analytics.daily.map(x => x.chats), 1);
                          return (
                            <div key={i} className="flex items-center gap-4 group">
                              <span className="text-[11px] font-medium text-gray-400 w-20 shrink-0 tabular-nums">{d.date}</span>
                              <div className="flex-1 bg-gray-50 rounded-full h-3 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(d.chats / maxChats) * 100}%` }}
                                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all"
                                />
                              </div>
                              <span className="text-xs font-bold text-gray-700 w-16 text-right shrink-0">{d.chats} chats</span>
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-gray-400 italic text-sm">
                      No chat activity recorded in this period
                    </div>
                  )}
                </motion.div>

                {/* ── Bot Usage Breakdown ── */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
                >
                  <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400">smart_toy</span>
                    Top Bots
                  </h3>
                  <div className="space-y-4">
                    {analytics.bots?.length > 0 ? (
                      analytics.bots.map((bot, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50">
                          <div>
                            <div className="text-sm font-bold text-gray-800">{bot.name || 'Assistant'}</div>
                            <div className="text-[10px] text-gray-400 uppercase font-semibold">Sessions</div>
                          </div>
                          <div className="text-lg font-black text-purple-600">
                            {bot.chats ?? 0}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400 text-sm">No bot data available</div>
                    )}
                  </div>
                </motion.div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 w-full shadow-sm">
              <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">analytics</span>
              <p className="text-gray-500 font-medium">Failed to load analytics data.</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 text-sm font-bold text-purple-600 hover:underline"
              >
                Try refreshing
              </button>
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  )
}