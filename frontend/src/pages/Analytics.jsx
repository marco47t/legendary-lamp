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
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const res = await api.get('/analytics/')
        setAnalytics(res.data)
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
        setAnalytics(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  return (
    <PageTransition>
      <div
        className="min-h-screen overflow-auto flex items-start justify-center pt-16 pb-16 relative"
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
        <header className="fixed top-0 w-full flex items-center justify-between px-8 py-6 z-50" style={{ background: 'rgba(248,249,250,0.6)', backdropFilter: 'blur(20px)' }}>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-semibold hover:opacity-70 transition-opacity"
            style={{ color: '#742fe5' }}
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Dashboard
          </button>
          <span className="text-xl font-bold tracking-tighter" style={{ color: '#0f172a' }}>
            Analytics
          </span>
          <div className="w-12" />
        </header>

        {/* ── Main content ── */}
        <main className="relative w-full max-w-4xl px-6 flex flex-col items-center">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 h-24 animate-pulse" />
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
                  { label: 'Total Tokens', value: analytics.total_tokens?.toLocaleString() ?? '—', icon: '⚡', color: 'text-amber-600' },
                  { label: 'Unique Sessions', value: analytics.total_sessions ?? '—', icon: '👤', color: 'text-blue-600' },
                  { label: 'Messages (30d)', value: analytics.daily?.reduce((s, d) => s + d.chats, 0) ?? '—', icon: '💬', color: 'text-brand-600' },
                  { label: 'Tokens (30d)', value: analytics.daily?.reduce((s, d) => s + d.tokens, 0)?.toLocaleString() ?? '—', icon: '📊', color: 'text-purple-600' },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-card">
                    <div className="text-2xl mb-2">{kpi.icon}</div>
                    <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                    <div className="text-xs text-gray-400 mt-0.5 font-medium">{kpi.label}</div>
                  </div>
                ))}
              </motion.div>

              {/* ── Daily Activity ── */}
              {analytics.daily && analytics.daily.filter(d => d.chats > 0).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card w-full"
                >
                  <h3 className="font-semibold text-gray-900 mb-4">Daily Activity (Last 30 Days)</h3>
                  <div className="space-y-2">
                    {analytics.daily
                      .filter(d => d.chats > 0)
                      .slice(-10)
                      .reverse()
                      .map((d, i) => {
                        const maxChats = Math.max(...analytics.daily.map(x => x.chats))
                        return (
                          <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                            <span className="text-xs text-gray-400 w-24 shrink-0">{d.date}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-brand-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(100, (d.chats / maxChats) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600 w-16 text-right shrink-0">{d.chats} chats</span>
                          </div>
                        )
                      })}
                  </div>
                </motion.div>
              )}

              {/* ── Empty state ── */}
              {!analytics.daily || analytics.daily.filter(d => d.chats > 0).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No activity data available yet</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Failed to load analytics</p>
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  )
}
