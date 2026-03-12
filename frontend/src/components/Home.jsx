import { useState } from 'react';

const FEATURES = [
  { emoji: '🤖', title: 'AI in Finance', desc: 'Breaking down how AI is reshaping accounting, FP&A, tax, and everything in between.' },
  { emoji: '🔴', title: 'Live Demos', desc: 'Real tools, real workflows. We build and test AI agents live so you don\'t have to guess.' },
  { emoji: '🔥', title: 'Hot Takes', desc: 'Unfiltered opinions on the trends, tools, and hype cycles that matter in finance.' },
  { emoji: '👥', title: 'Community Driven', desc: 'Topics chosen by the audience. Your questions shape every episode.' },
  { emoji: '📅', title: 'Weekly Episodes', desc: 'New episodes every week covering the latest at the intersection of AI and finance.' },
  { emoji: '🛠️', title: 'Open Source Tools', desc: 'We share the prompts, agents, and automations we build — everything is open source.' },
];

const EPISODES = [
  { num: 1, title: 'Is Your Accountant Getting Replaced by AI?', date: 'Coming Soon', tags: ['AI Agents', 'Accounting'] },
  { num: 2, title: 'Crypto Accounting Is a Nightmare — Can AI Fix It?', date: 'Coming Soon', tags: ['Crypto', 'Tax'] },
  { num: 3, title: 'We Built an AI CFO in 30 Minutes', date: 'Coming Soon', tags: ['Live Demo', 'FP&A'] },
];

const TOPICS = [
  'AI Agents', 'Crypto Accounting', 'SaaS vs AI', 'Tax Automation', 'ERPs',
  'Agentic Workflows', 'Month-End Close', 'Financial Modeling', 'Claude/GPT',
  'Startup Finance', 'Compliance', 'The Future of Work',
];

export default function Home() {
  const [email, setEmail] = useState('');

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-primary)]">

      {/* ─── HERO ─── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1E2D4A 0%, #2B3A5C 40%, #1E2D4A 100%)' }}>
        {/* Background image overlay */}
        <div className="absolute inset-0 opacity-15">
          <img src="/images/hero-full.png" alt="" className="w-full h-full object-cover" />
        </div>
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1E2D4A]/60 to-[#1E2D4A]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center py-20">
          <h1 className="font-russo text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#F5F2EC] leading-tight mb-6">
            Where Finance Meets AI
            <span className="block text-[#D94E2A]">&mdash; And Things Get Cooked</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#F5F2EC]/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            A weekly show exploring the wild intersection of artificial intelligence and finance.
            Hot takes, live demos, and the tools shaping the future of money.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://www.youtube.com/@financeiscooked"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg
                         bg-[#D94E2A] text-[#F5F2EC] hover:bg-[#c4431f] transition-all duration-200
                         hover:scale-105 hover:shadow-lg hover:shadow-[#D94E2A]/25"
            >
              <span>▶</span> Watch Now
            </a>
            <a
              href="#newsletter"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg
                         border-2 border-[#F0A030] text-[#F0A030] hover:bg-[#F0A030]/10
                         transition-all duration-200 hover:scale-105"
            >
              Join the Community
            </a>
          </div>
        </div>
      </section>

      {/* ─── ABOUT / FEATURES ─── */}
      <section className="py-20 px-6 bg-[var(--bg-primary)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-russo text-3xl sm:text-4xl text-[var(--text-primary)] text-center mb-4">
            What We're Cooking
          </h2>
          <p className="text-[var(--text-secondary)] text-center mb-14 max-w-2xl mx-auto text-lg">
            Finance is getting disrupted faster than ever. We break it all down — no jargon, no fluff.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]
                           hover:border-[var(--accent-primary)] transition-all duration-200 hover:shadow-lg"
              >
                <div className="text-4xl mb-4">{f.emoji}</div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{f.title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOSTS ─── */}
      <section className="py-20 px-6 bg-[var(--bg-surface)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-russo text-3xl sm:text-4xl text-[var(--text-primary)] text-center mb-4">
            Meet the Hosts
          </h2>
          <p className="text-[var(--text-secondary)] text-center mb-14 max-w-xl mx-auto text-lg">
            Two perspectives. One mission: make finance less boring.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Ore */}
            <div className="p-8 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-primary)]
                            hover:border-[#D94E2A] transition-all duration-200">
              <div className="text-6xl mb-4">🧠</div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Ore Phillips</h3>
              <p className="text-[#D94E2A] font-semibold mb-4">The AI & Finance Nerd</p>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Background in fintech and accounting. Obsessed with building AI agents that actually
                work in the real world. Believes every spreadsheet will eventually talk back.
              </p>
            </div>
            {/* Joe */}
            <div className="p-8 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-primary)]
                            hover:border-[#F0A030] transition-all duration-200">
              <div className="text-6xl mb-4">🎙️</div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Joe</h3>
              <p className="text-[#F0A030] font-semibold mb-4">The Skeptic</p>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Keeps things grounded. Asks the hard questions that everyone is thinking but nobody
                says out loud. If the AI hype doesn't hold up, Joe will call it out.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── EPISODES ─── */}
      <section className="py-20 px-6 bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-russo text-3xl sm:text-4xl text-[var(--text-primary)] text-center mb-4">
            Latest from the Show
          </h2>
          <p className="text-[var(--text-secondary)] text-center mb-14 max-w-xl mx-auto text-lg">
            Catch up on recent episodes or binge from the start.
          </p>
          <div className="flex flex-col gap-4">
            {EPISODES.map((ep) => (
              <a
                key={ep.num}
                href="/show"
                className="group flex items-center gap-6 p-6 rounded-2xl border border-[var(--border-default)]
                           bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] transition-all duration-200
                           hover:shadow-lg no-underline"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[#D94E2A]/10 text-[#D94E2A]
                                flex items-center justify-center font-russo text-xl">
                  {ep.num}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[#D94E2A]
                                 transition-colors truncate">
                    {ep.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-[var(--text-muted)]">{ep.date}</span>
                    <div className="flex gap-2">
                      {ep.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-subtle)]
                                                    text-[var(--text-tertiary)]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 text-[var(--text-muted)] group-hover:text-[#D94E2A]
                                transition-colors text-xl">
                  →
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TOPICS ─── */}
      <section className="py-20 px-6 bg-[var(--bg-surface)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-russo text-3xl sm:text-4xl text-[var(--text-primary)] mb-4">
            Topics We Cover
          </h2>
          <p className="text-[var(--text-secondary)] mb-10 max-w-xl mx-auto text-lg">
            If it touches finance and AI, it's on the menu.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {TOPICS.map((topic) => (
              <span
                key={topic}
                className="px-5 py-2.5 rounded-full text-sm font-medium border border-[var(--border-default)]
                           text-[var(--text-primary)] bg-[var(--bg-primary)] hover:border-[#D94E2A]
                           hover:text-[#D94E2A] transition-all duration-200 cursor-default"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER ─── */}
      <section
        id="newsletter"
        className="py-20 px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1E2D4A 0%, #2B3A5C 50%, #1E2D4A 100%)' }}
      >
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="font-russo text-3xl sm:text-4xl text-[#F5F2EC] mb-4">
            Stay in the Kitchen
          </h2>
          <p className="text-[#F5F2EC]/70 mb-10 text-lg leading-relaxed">
            Get weekly updates on episodes, AI tools, and finance takes delivered straight to your inbox.
            No spam — just heat.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-[#F5F2EC]
                         placeholder-white/40 focus:outline-none focus:border-[#F0A030]
                         transition-colors text-base"
            />
            <a
              href={`mailto:financeiscooked@gmail.com?subject=Newsletter%20Signup&body=Sign%20me%20up!%20My%20email:%20${encodeURIComponent(email)}`}
              className="px-8 py-4 rounded-xl font-semibold text-base bg-[#D94E2A] text-[#F5F2EC]
                         hover:bg-[#c4431f] transition-all duration-200 hover:scale-105
                         hover:shadow-lg hover:shadow-[#D94E2A]/25 text-center no-underline"
            >
              Subscribe
            </a>
          </div>
          <p className="text-[#F5F2EC]/40 text-sm mt-4">
            We'll never share your email. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-12 px-6" style={{ background: '#1E2D4A' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-4">
              <img src="/images/logo-tagline.png" alt="financeiscooked" className="h-10" />
            </div>
            <nav className="flex flex-wrap justify-center gap-6">
              <a href="/show" className="text-[#F5F2EC]/60 hover:text-[#F5F2EC] transition-colors text-sm no-underline">
                Episodes
              </a>
              <a href="https://www.youtube.com/@financeiscooked" target="_blank" rel="noopener noreferrer"
                 className="text-[#F5F2EC]/60 hover:text-[#F5F2EC] transition-colors text-sm no-underline">
                YouTube
              </a>
              <a href="#newsletter" className="text-[#F5F2EC]/60 hover:text-[#F5F2EC] transition-colors text-sm no-underline">
                Newsletter
              </a>
              <a href="mailto:financeiscooked@gmail.com"
                 className="text-[#F5F2EC]/60 hover:text-[#F5F2EC] transition-colors text-sm no-underline">
                Contact
              </a>
            </nav>
          </div>
          <div className="border-t border-[#F5F2EC]/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[#F5F2EC]/40 text-sm">
              &copy; {new Date().getFullYear()} financeiscooked. All rights reserved.
            </p>
            <p className="text-[#F5F2EC]/30 text-xs">
              Where finance meets AI — and things get cooked.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
