import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="text-on-surface antialiased">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm font-sans tracking-tight">
        <div className="flex justify-between items-center px-8 h-20 max-w-7xl mx-auto">
          <div className="text-2xl font-black tracking-tighter text-slate-900">DocBot</div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-violet-600 font-semibold border-b-2 border-violet-600 hover:text-violet-500 transition-colors duration-200">Home</a>
            <a href="#features" className="text-slate-600 font-medium hover:text-violet-500 transition-colors duration-200">Features</a>
            <a href="#pricing" className="text-slate-600 font-medium hover:text-violet-500 transition-colors duration-200">Pricing</a>
            <a href="#about" className="text-slate-600 font-medium hover:text-violet-500 transition-colors duration-200">About</a>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="hidden md:block text-slate-600 font-medium hover:text-violet-500 transition-colors px-4 py-2"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-primary text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
        <div className="bg-slate-100 h-[1px] opacity-20"></div>
      </nav>

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold tracking-wider mb-6">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              NEXT-GEN DOCUMENT INTELLIGENCE
            </div>
            <h1 className="text-[3.5rem] font-black leading-[1.1] tracking-tight text-on-surface mb-6">
              Turn your documents into a{' '}
              <span className="text-primary">24/7 AI assistant</span> — in minutes.
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed max-w-xl mb-10">
              Upload PDFs, Word docs, or text files. DocBot instantly builds a custom AI chatbot that answers queries, supports your team, and deploys to Telegram in one click.
            </p>
            <div className="flex flex-wrap gap-4 mb-12">
              <button
                onClick={() => navigate('/register')}
                className="hero-gradient text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2"
              >
                Build your bot for free
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button className="bg-surface-container-highest text-on-surface px-8 py-4 rounded-full font-bold text-lg hover:bg-surface-container-high transition-all">
                See how it works
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col gap-4">
              <p className="text-sm font-bold text-inverse-on-surface tracking-widest">TRUSTED BY 10,000+ BUSINESSES</p>
              <div className="flex flex-wrap gap-6 items-center">
                {['Acme Corp', 'TechFlow', 'Nexus Inc', 'Verdia'].map(name => (
                  <span key={name} className="text-sm font-bold text-on-surface-variant opacity-40 tracking-tight">{name}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Chat UI Mockup */}
          <div className="lg:col-span-5 relative">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px]"></div>
            <div className="relative bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(45,51,53,0.06)] overflow-hidden border border-outline-variant/10">
              {/* Chat header */}
              <div className="bg-surface-container-low px-6 py-4 flex items-center justify-between border-b border-outline-variant/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full hero-gradient flex items-center justify-center text-white shadow-lg shadow-primary/30">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">DocBot Assistant</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-[10px] text-on-surface-variant font-medium">Online &amp; Learning</span>
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline">more_vert</span>
              </div>

              {/* Messages */}
              <div className="p-6 space-y-6 h-[400px] overflow-y-auto">
                <div className="flex flex-col items-end gap-2">
                  <div className="bg-primary-container/10 text-primary px-4 py-3 rounded-2xl rounded-tr-none text-sm max-w-[80%] font-medium">
                    How does the pricing for enterprise plans work?
                  </div>
                  <span className="text-[10px] text-inverse-on-surface">10:42 AM</span>
                </div>
                <div className="flex flex-col items-start gap-2">
                  <div className="bg-surface-container-low text-on-surface px-4 py-3 rounded-2xl rounded-tl-none text-sm max-w-[85%] leading-relaxed">
                    Based on your uploaded{' '}
                    <span className="inline-flex items-center gap-1 bg-secondary-container px-2 py-0.5 rounded text-[11px] font-bold text-on-secondary-container">
                      pricing_guide_v4.pdf
                    </span>
                    , enterprise plans start at $499/mo and include custom API limits.
                  </div>
                  <div className="bg-surface-container-low text-on-surface px-4 py-3 rounded-2xl rounded-tl-none text-sm max-w-[85%] leading-relaxed">
                    Would you like me to connect you with a representative?
                  </div>
                  <span className="text-[10px] text-inverse-on-surface">10:43 AM</span>
                </div>
                {/* Typing dots */}
                <div className="flex gap-1 items-center px-4 py-3 bg-surface-container-low rounded-2xl rounded-tl-none w-fit">
                  {[0, 150, 300].map(delay => (
                    <div
                      key={delay}
                      className="w-1.5 h-1.5 bg-outline-variant rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="p-4 bg-surface-container-low border-t border-outline-variant/5">
                <div className="bg-surface-container-lowest rounded-full px-4 py-3 flex items-center justify-between shadow-sm">
                  <span className="text-on-surface-variant text-sm">Ask a question...</span>
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-sm">send</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating stats card */}
            <div className="absolute -bottom-6 -left-12 bg-white p-5 rounded-lg shadow-xl border border-outline-variant/10 hidden md:block max-w-[200px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="material-symbols-outlined text-green-600 text-lg">bolt</span>
                </div>
                <span className="font-bold text-sm">Accuracy</span>
              </div>
              <div className="text-2xl font-black text-on-surface">99.8%</div>
              <p className="text-[10px] text-on-surface-variant mt-1">Verified across 2k documents</p>
            </div>
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section id="features" className="max-w-7xl mx-auto px-8 mt-32">
          <div className="text-center mb-16">
            <span className="text-primary font-bold text-sm tracking-widest uppercase">The Toolkit</span>
            <h2 className="text-4xl font-black tracking-tight mt-4">Built for clarity and speed.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large card */}
            <div className="md:col-span-2 bg-white p-10 rounded-lg shadow-sm hover:shadow-md transition-all border border-outline-variant/5 overflow-hidden relative group">
              <div className="relative z-10">
                <span className="material-symbols-outlined text-primary text-4xl mb-6 block">description</span>
                <h3 className="text-2xl font-bold mb-4">Multi-format Document Support</h3>
                <p className="text-on-surface-variant max-w-md leading-relaxed">
                  Upload PDFs, Word documents, or plain text files. DocBot automatically extracts, chunks, and indexes everything for instant AI retrieval.
                </p>
              </div>
              <div className="absolute right-[-10%] bottom-[-10%] opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-[200px]">folder_copy</span>
              </div>
            </div>

            {/* Purple card */}
            <div className="bg-primary text-white p-10 rounded-lg shadow-xl shadow-primary/10 flex flex-col justify-between">
              <div>
                <span className="material-symbols-outlined text-4xl mb-6 block">rocket_launch</span>
                <h3 className="text-2xl font-bold mb-4">One-Click Telegram Deploy</h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  Paste your BotFather token and your bot goes live on Telegram instantly. No server config, no webhooks to manage manually.
                </p>
              </div>
              <button
                onClick={() => navigate('/register')}
                className="mt-6 font-bold flex items-center gap-2 group"
              >
                Try it free
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>

            {/* Small card */}
            <div className="bg-surface-container-low p-10 rounded-lg border border-outline-variant/10">
              <span className="material-symbols-outlined text-tertiary text-4xl mb-6 block">translate</span>
              <h3 className="text-xl font-bold mb-4">Multi-language Support</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Serve your customers in their language. Your bot understands and responds in 95+ languages automatically.
              </p>
            </div>

            {/* Wide card */}
            <div className="md:col-span-2 bg-surface-container-lowest p-10 rounded-lg border border-outline-variant/10 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4">Developer API Access</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Generate API keys and integrate DocBot into any application. Full REST API with auto-generated docs, session support, and source citations.
                </p>
              </div>
              <div className="flex-1 bg-surface-container p-4 rounded-lg w-full">
                <div className="flex items-end gap-2 h-24">
                  {[40, 60, 30, 90, 75].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t transition-all"
                      style={{ height: `${h}%`, backgroundColor: `rgba(116, 47, 229, ${0.2 + i * 0.15})` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-5xl mx-auto px-8 mt-40">
          <div className="bg-on-surface rounded-xl p-16 text-center text-white relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />
            <div className="relative z-10">
              <h2 className="text-[2.5rem] font-black mb-6 leading-tight">
                Ready to automate your<br />knowledge base?
              </h2>
              <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
                Join 10,000+ businesses using DocBot to save hundreds of hours every month.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-primary text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-primary-fixed transition-all"
                >
                  Get started for free
                </button>
                <button className="bg-white/10 backdrop-blur-md text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all border border-white/20">
                  Book a demo
                </button>
              </div>
              <p className="mt-8 text-sm text-white/40 font-medium">No credit card required · 14-day free trial</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="text-2xl font-black tracking-tighter text-slate-900 mb-6">DocBot</div>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
              Empowering businesses with intelligent, document-aware AI assistants.
            </p>
            <div className="flex gap-4">
              {['public', 'share'].map(icon => (
                <div key={icon} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-lg">{icon}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-on-surface">Product</h4>
            <ul className="space-y-4 text-on-surface-variant text-sm">
              {['Features', 'Integrations', 'Pricing', 'Changelog'].map(item => (
                <li key={item}><a href="#" className="hover:text-primary transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-on-surface">Company</h4>
            <ul className="space-y-4 text-on-surface-variant text-sm">
              {['About', 'Blog', 'Careers', 'Contact'].map(item => (
                <li key={item}><a href="#" className="hover:text-primary transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-on-surface">Newsletter</h4>
            <p className="text-on-surface-variant text-sm mb-4">The latest in AI document intelligence.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="bg-surface-container-low border-none rounded-full px-4 py-2 text-sm w-full focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
              <button className="bg-primary text-white px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap">Join</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 mt-20 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-inverse-on-surface uppercase tracking-widest">
          <div>© 2026 DocBot. All rights reserved.</div>
          <div className="flex gap-8">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(item => (
              <a key={item} href="#" className="hover:text-primary transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}