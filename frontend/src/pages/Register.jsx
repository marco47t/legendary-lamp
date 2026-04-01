import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import PageTransition from '../components/PageTransition'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', user_type: 'nocode' })
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    if (!agreed) { setError('Please agree to the Terms of Service.'); return }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      const res = await api.post('/auth/login', { email: form.email, password: form.password })
      login({ email: form.email, user_type: form.user_type }, res.data.access_token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
  }

  return (
    <PageTransition>
      <div
        className="min-h-screen flex overflow-hidden"
        style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#f8f9fa', color: '#2d3335' }}
      >
        {/* Left panel */}
        <motion.section
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:flex lg:w-[60%] relative flex-col justify-between p-16 overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 z-0 overflow-hidden" style={{ backgroundColor: '#742fe5' }}>
            <div
              className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 30%, #8342f4 0%, transparent 50%), radial-gradient(circle at 80% 70%, #a476ff 0%, transparent 50%)',
              }}
            />
            {/* Animated blobs */}
            <motion.div
              className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px]"
              style={{ backgroundColor: 'rgba(164,118,255,0.3)' }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-[100px]"
              style={{ backgroundColor: 'rgba(116,47,229,0.4)' }}
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Brand */}
          <motion.div
            className="relative z-10 flex items-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-2xl" style={{ color: '#742fe5', fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
            </div>
            <span className="text-white text-2xl font-black tracking-tighter">DocBot</span>
          </motion.div>

          {/* Hero text */}
          <motion.div
            className="relative z-10 max-w-xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block px-4 py-1 rounded-full text-xs font-medium tracking-widest uppercase mb-6"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}>
              AI Document Intelligence
            </span>
            <h1 className="text-white text-6xl font-extrabold tracking-tight leading-[1.1] mb-8">
              Turn your documents into a 24/7 AI assistant
            </h1>
            <p className="text-lg leading-relaxed max-w-md" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Deploy intelligent chatbots that understand your data in minutes. No complex training required.
            </p>
          </motion.div>

          {/* Feature chips */}
          <motion.div
            className="relative z-10 flex gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
          >
            {[
              { icon: 'verified_user', label: 'Enterprise Security' },
              { icon: 'bolt', label: 'Instant Deployment' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3 px-6 py-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
                <span className="material-symbols-outlined text-white">{f.icon}</span>
                <span className="text-white text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* Right panel — form */}
        <main className="w-full lg:w-[40%] flex flex-col justify-center px-8 sm:px-16 lg:px-20 relative overflow-y-auto"
          style={{ backgroundColor: '#f8f9fa' }}>
          <motion.div
            className="max-w-md w-full mx-auto py-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Mobile brand */}
            <motion.div variants={itemVariants} className="lg:hidden flex items-center gap-2 mb-12">
              <span className="material-symbols-outlined text-3xl" style={{ color: '#742fe5', fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
              <span className="text-xl font-black tracking-tighter" style={{ color: '#2d3335' }}>DocBot</span>
            </motion.div>

            <motion.header variants={itemVariants} className="mb-10">
              <h2 className="text-3xl font-bold tracking-tight mb-2" style={{ color: '#2d3335' }}>Create your account</h2>
              <p className="text-sm" style={{ color: '#5a6062' }}>Join the next generation of AI document intelligence.</p>
            </motion.header>

            <form onSubmit={submit} className="space-y-6">
              {/* Account type */}
              <motion.div variants={itemVariants} className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#767c7e' }}>Account Type</label>
                <div className="grid grid-cols-2 gap-3 p-1.5 rounded-full" style={{ backgroundColor: '#f1f4f5' }}>
                  {[
                    { type: 'nocode', icon: 'auto_awesome', label: 'No-Code' },
                    { type: 'developer', icon: 'code', label: 'Developer' },
                  ].map(opt => (
                    <motion.button
                      key={opt.type}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setForm(f => ({ ...f, user_type: opt.type }))}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-all"
                      style={form.user_type === opt.type
                        ? { backgroundColor: 'white', color: '#742fe5', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }
                        : { color: '#5a6062' }}
                    >
                      <span className="material-symbols-outlined text-sm">{opt.icon}</span>
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 rounded-2xl text-sm flex items-center gap-2"
                  style={{ backgroundColor: '#fff0f0', color: '#a8364b' }}
                >
                  <span className="material-symbols-outlined text-sm">error</span> {error}
                </motion.div>
              )}

              {/* Fields */}
              <motion.div variants={itemVariants} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest px-1" style={{ color: '#767c7e' }}>Email Address</label>
                  <input
                    type="email" required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="name@company.com"
                    className="w-full px-5 py-4 border-none rounded-2xl transition-all focus:outline-none focus:ring-2 placeholder:text-[#adb3b5]"
                    style={{ backgroundColor: '#f1f4f5', color: '#2d3335', focusRingColor: 'rgba(116,47,229,0.3)' }}
                    onFocus={e => { e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(116,47,229,0.25)' }}
                    onBlur={e => { e.target.style.backgroundColor = '#f1f4f5'; e.target.style.boxShadow = 'none' }}
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest px-1" style={{ color: '#767c7e' }}>Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} required
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-5 py-4 border-none rounded-2xl transition-all focus:outline-none placeholder:text-[#adb3b5]"
                      style={{ backgroundColor: '#f1f4f5', color: '#2d3335' }}
                      onFocus={e => { e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(116,47,229,0.25)' }}
                      onBlur={e => { e.target.style.backgroundColor = '#f1f4f5'; e.target.style.boxShadow = 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: '#adb3b5' }}
                      onMouseEnter={e => e.target.style.color = '#742fe5'}
                      onMouseLeave={e => e.target.style.color = '#adb3b5'}
                    >
                      <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Terms */}
              <motion.div variants={itemVariants} className="flex items-start gap-3 px-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded cursor-pointer"
                  style={{ accentColor: '#742fe5' }}
                />
                <label htmlFor="terms" className="text-xs leading-relaxed cursor-pointer" style={{ color: '#5a6062' }}>
                  I agree to the{' '}
                  <a href="#" className="font-medium hover:underline" style={{ color: '#742fe5' }}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="font-medium hover:underline" style={{ color: '#742fe5' }}>Privacy Policy</a>.
                </label>
              </motion.div>

              {/* Submit */}
              <motion.div variants={itemVariants}>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-full text-white font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #742fe5 0%, #8342f4 100%)',
                    boxShadow: '0 8px 24px rgba(116,47,229,0.25)',
                  }}
                >
                  {loading ? 'Creating account...' : (
                    <>Create Account <span className="material-symbols-outlined">arrow_forward</span></>
                  )}
                </motion.button>
              </motion.div>
            </form>

            <motion.p variants={itemVariants} className="text-center text-sm mt-8" style={{ color: '#5a6062' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-bold hover:underline" style={{ color: '#742fe5' }}>Sign In</Link>
            </motion.p>
          </motion.div>

          {/* Decorative bottom right */}
          <div className="absolute bottom-10 right-10 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[120px]" style={{ color: '#742fe5' }}>token</span>
          </div>
        </main>
      </div>
    </PageTransition>
  )
}