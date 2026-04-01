import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import PageTransition from '../components/PageTransition'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      login({ email: form.email, user_type: res.data.user_type }, res.data.access_token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
  }

  const inputStyle = {
    backgroundColor: '#f1f4f5',
    color: '#2d3335',
    border: 'none',
    width: '100%',
    padding: '1rem 1rem 1rem 3rem',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.2s',
  }

  return (
    <PageTransition>
      <div
        className="flex h-screen w-screen overflow-hidden"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Left — Visual hero */}
        <motion.section
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:flex w-[60%] relative overflow-hidden p-16 flex-col justify-between"
          style={{
            background: 'linear-gradient(135deg, #742fe5 0%, #8342f4 100%)',
          }}
        >
          {/* Animated blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute top-1/2 left-1/2 rounded-full blur-[120px]"
              style={{ width: 800, height: 400, backgroundColor: 'rgba(131,66,244,0.4)', translateX: '-50%', translateY: '-50%' }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full blur-[80px]"
              style={{ backgroundColor: 'rgba(164,118,255,0.3)' }}
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Wave SVG */}
            <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,213.3C960,203,1056,181,1152,165.3C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                fill="rgba(255,255,255,0.07)" />
            </svg>
          </div>

          {/* Brand */}
          <motion.div
            className="z-10 flex items-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl" style={{ color: '#742fe5', fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">DocBot</span>
          </motion.div>

          {/* Hero text */}
          <motion.div
            className="relative z-10 max-w-xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-6xl font-black text-white leading-[1.1] tracking-tight mb-6">
              Welcome back.
            </h1>
            <p className="text-xl font-medium leading-relaxed" style={{ color: 'rgba(229,213,255,0.9)' }}>
              Log in to your dashboard and continue managing your AI-powered chatbots.
            </p>
          </motion.div>

          {/* Feature footer */}
          <motion.div
            className="relative z-10 flex gap-12 pt-8"
            style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            {[
              { icon: 'verified_user', label: 'Enterprise Security' },
              { icon: 'bolt', label: 'Instant Deployment' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
                  <span className="material-symbols-outlined text-white text-lg">{f.icon}</span>
                </div>
                <span className="text-sm font-semibold uppercase tracking-widest text-white">{f.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* Right — Form */}
        <section
          className="w-full lg:w-[40%] flex flex-col items-center justify-center p-8 lg:p-16"
          style={{ backgroundColor: '#f8f9fa' }}
        >
          <motion.div
            className="w-full max-w-md"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Mobile logo */}
            <motion.div variants={itemVariants} className="lg:hidden flex justify-center mb-12">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#742fe5' }}>
                <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-black tracking-tight mb-2" style={{ color: '#2d3335' }}>Access Dashboard</h2>
              <p className="text-sm font-medium" style={{ color: '#5a6062' }}>Please enter your credentials to proceed.</p>
            </motion.div>

            <form onSubmit={submit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                  style={{ backgroundColor: '#fff0f0', color: '#a8364b' }}
                >
                  <span className="material-symbols-outlined text-sm">error</span> {error}
                </motion.div>
              )}

              {/* Email */}
              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-[0.75rem] font-bold uppercase tracking-wider px-1" style={{ color: '#5a6062' }}>
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#adb3b5' }}>mail</span>
                  <input
                    type="email" required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="name@company.com"
                    style={inputStyle}
                    onFocus={e => { e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(116,47,229,0.25)' }}
                    onBlur={e => { e.target.style.backgroundColor = '#f1f4f5'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={itemVariants} className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[0.75rem] font-bold uppercase tracking-wider" style={{ color: '#5a6062' }}>Password</label>
                  <a href="#" className="text-[0.75rem] font-bold uppercase tracking-wider hover:underline" style={{ color: '#742fe5' }}>
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#adb3b5' }}>lock</span>
                  <input
                    type="password" required
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    style={inputStyle}
                    onFocus={e => { e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(116,47,229,0.25)' }}
                    onBlur={e => { e.target.style.backgroundColor = '#f1f4f5'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              </motion.div>

              {/* Remember me */}
              <motion.div variants={itemVariants} className="flex items-center gap-3 px-1">
                <input
                  type="checkbox" id="remember"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-5 h-5 rounded cursor-pointer"
                  style={{ accentColor: '#742fe5' }}
                />
                <label htmlFor="remember" className="text-sm font-medium cursor-pointer" style={{ color: '#5a6062' }}>
                  Remember me for 30 days
                </label>
              </motion.div>

              {/* Submit */}
              <motion.div variants={itemVariants}>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-full font-bold text-white transition-all disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #742fe5 0%, #8342f4 100%)',
                    boxShadow: '0 8px 24px rgba(116,47,229,0.25)',
                  }}
                >
                  {loading ? 'Signing in...' : 'Log In'}
                </motion.button>
              </motion.div>
            </form>

            {/* Divider */}
            <motion.div variants={itemVariants} className="my-8 flex items-center gap-4">
              <div className="h-[1px] flex-1" style={{ backgroundColor: '#dee3e6' }} />
              <span className="text-[0.7rem] font-bold uppercase tracking-[0.1em]" style={{ color: '#adb3b5' }}>Or continue with</span>
              <div className="h-[1px] flex-1" style={{ backgroundColor: '#dee3e6' }} />
            </motion.div>

            {/* Social buttons */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              {[
                {
                  label: 'Google',
                  icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  ),
                },
                {
                  label: 'GitHub',
                  icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  ),
                },
              ].map(social => (
                <motion.button
                  key={social.label}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl transition-colors"
                  style={{ backgroundColor: '#f1f4f5' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ebeef0'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f1f4f5'}
                >
                  {social.icon}
                  <span className="text-sm font-bold" style={{ color: '#2d3335' }}>{social.label}</span>
                </motion.button>
              ))}
            </motion.div>

            <motion.p variants={itemVariants} className="mt-12 text-center text-sm font-medium" style={{ color: '#5a6062' }}>
              Don't have an account?{' '}
              <Link to="/register" className="font-bold hover:underline" style={{ color: '#742fe5' }}>Sign up for free</Link>
            </motion.p>
          </motion.div>

          {/* Footer meta */}
          <footer className="mt-auto pt-8 w-full max-w-md flex justify-between">
            <div className="flex gap-6">
              {['Privacy', 'Terms', 'Support'].map(item => (
                <a key={item} href="#"
                  className="text-[0.65rem] font-bold uppercase tracking-widest transition-colors"
                  style={{ color: '#adb3b5' }}
                  onMouseEnter={e => e.target.style.color = '#742fe5'}
                  onMouseLeave={e => e.target.style.color = '#adb3b5'}
                >
                  {item}
                </a>
              ))}
            </div>
            <span className="text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: '#adb3b5' }}>© 2026 DocBot.</span>
          </footer>
        </section>
      </div>
    </PageTransition>
  )
}