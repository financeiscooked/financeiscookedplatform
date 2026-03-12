import { useState, useEffect, useRef } from 'react';

/* ------------------------------------------------------------------ */
/*  Fade-in on scroll observer                                         */
/* ------------------------------------------------------------------ */
function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.style.opacity = 1; el.style.transform = 'translateY(0)'; obs.unobserve(el); } },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, style: { opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.6s ease, transform 0.6s ease' } };
}

function FadeIn({ children, className = '', as: Tag = 'div', style: extra = {} }) {
  const { ref, style } = useFadeIn();
  return <Tag ref={ref} className={className} style={{ ...style, ...extra }}>{children}</Tag>;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const FEATURES = [
  { icon: '🛠️', title: 'We Build Live', desc: 'Every episode features a real build — websites, automations, reports, tools. No slides. No theory. We build it live and you follow along.' },
  { icon: '📊', title: 'Real Practitioner Perspective', desc: "We're not pundits — we run firms and use AI in real finance workflows every day. If it doesn't work in practice, we'll tell you." },
  { icon: '💡', title: 'Zero Code Required', desc: "Joe built his entire firm website without writing a single line of code. You don't need to be a developer — you just need the right tools." },
  { icon: '🔥', title: 'Hot Takes on What Matters', desc: 'AI headlines fly every day. We cut through the noise and tell you what actually matters for finance and accounting professionals.' },
  { icon: '🔓', title: '100% Open Source', desc: 'Everything we build on the show is shared — you can download it, repurpose it, and make it yours. No gatekeeping.' },
  { icon: '⚡', title: 'Catch the AI Bug', desc: "Once you start building with AI, you can't stop. We'll show you how to get started and help you get better every week." },
];

const SEGMENTS = [
  { icon: '🛠️', title: 'App of the Show', desc: 'We build something real — live on the show. Websites, tools, automations. You watch, you learn, you build along.' },
  { icon: '⚡', title: 'Quick Updates', desc: 'The AI news that matters for finance pros. Funding rounds, product launches, industry moves — no fluff, just signal.' },
  { icon: '🔥', title: 'Take of the Show', desc: 'Ore and Joe each bring a hot take. Bold predictions, contrarian views, and honest opinions on where finance is headed.' },
  { icon: '🤖', title: 'One Thing I Did with AI', desc: 'A real AI use case from the week — something we actually did in our own work that saved time or delivered better results.' },
  { icon: '🎬', title: 'Open Source Everything', desc: 'Every tool, template, and project we build on the show gets shared. Download it, fork it, make it yours.' },
  { icon: '🔮', title: "What's Coming", desc: 'A preview of next week plus future episodes. Apps by friends, deep dives, guest builds, and more.' },
];

const BUILDS = [
  { icon: '🌐', title: 'FinanceIsCooked.com', desc: 'The website you\'re looking at right now — built entirely with AI, no code written by hand.', stack: ['HTML / CSS / JS', 'Netlify', 'Claude Code'], links: [{ label: 'Live Site', url: 'https://financeiscooked.com' }, { label: 'GitHub', url: 'https://github.com/financeiscooked/financeiscookedwebsite', outline: true }] },
  { icon: '🎛️', title: 'Show Manager', desc: 'A live soundboard web app with 16 buttons, custom audio uploads, and broadcast-studio vibes — built for the show.', stack: ['React', 'Vite', 'Tailwind CSS', 'Netlify', 'Claude Code'], links: [{ label: 'Live Site', url: 'https://ficsoundboard.netlify.app' }, { label: 'GitHub', url: 'https://github.com/financeiscooked/financeiscooked-soundboard', outline: true }] },
  { icon: '🧪', title: 'Website Demo', desc: 'An alternate website prototype we built live on the show — a playground for experimenting with AI-generated design.', stack: ['HTML / CSS / JS', 'Netlify', 'Claude Code'], links: [{ label: 'Live Site', url: 'https://flourishing-concha-cee7cb.netlify.app' }] },
];

const TOPICS = [
  'Financial Modeling with AI', 'Automated Reconciliations', 'AI-Powered Auditing',
  'Prompt Engineering for Finance', 'No-Code Automation', 'Cash Flow Forecasting',
  'AI Agents for Accounting', 'Data Analysis & Visualization', 'Risk Assessment with AI',
  'Tax Automation', 'Claude & ChatGPT for Finance', 'Excel + AI Workflows',
  'ERP Integration', 'Regulatory Compliance AI', 'Career Development', 'Building AI Tools',
];

const PLATFORMS = [
  { icon: '▶️', label: 'YouTube', url: 'https://www.youtube.com/@financeiscooked' },
  { icon: '🎵', label: 'Spotify — Coming Soon', url: '#', soon: true },
  { icon: '🎙️', label: 'Apple Podcasts — Coming Soon', url: '#', soon: true },
  { icon: '💼', label: 'LinkedIn — Coming Soon', url: '#', soon: true },
];

/* ------------------------------------------------------------------ */
/*  Styles (matching original styles.css)                              */
/* ------------------------------------------------------------------ */
const S = {
  bg: '#F5F2EC', surface: '#FFFFFF', primary: '#D94E2A', primaryDark: '#B8401F',
  primaryLight: '#FDEAE4', navy: '#1E2D4A', navyLight: '#2B3A5C', amber: '#F0A030',
  amberLight: '#FFF3DC', text: '#1A1D26', textMuted: '#5A5F6B', textLight: '#8A8F9A',
  border: '#E2DED6', accentBg: '#EBE7DF', darkBg: '#1E2D4A', darkSurface: '#2B3A5C',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function Home() {
  const [email, setEmail] = useState('');

  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: S.bg, color: S.text, fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── HERO ── */}
      <header style={{ padding: '100px 0 80px', background: S.darkBg, color: '#fff', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div style={{ maxWidth: 600 }}>
              <div style={{
                display: 'inline-block', padding: '8px 20px', background: 'rgba(240,160,48,0.15)',
                color: S.amber, border: '1px solid rgba(240,160,48,0.3)', borderRadius: 24,
                fontSize: '0.85rem', fontWeight: 600, marginBottom: 32, letterSpacing: '0.02em',
              }}>
                Hosted by Ore & Joe — New episodes weekly
              </div>
              <h1 style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 24 }}>
                Finance is <span style={{ color: S.primary }}>Cooked</span>
              </h1>
              <p style={{ fontSize: '1.15rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', marginBottom: 40 }}>
                AI is changing everything in finance — and it's moving fast. Every week, we build real things, break down what matters, and share the hottest takes so you stay ahead. No fluff, no theory — just two finance pros cooking with AI live.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
                <a href="https://youtu.be/YWj1NiRtlMc" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', padding: '12px 28px', borderRadius: 24, fontSize: '0.95rem', fontWeight: 600, background: S.primary, color: '#fff', textDecoration: 'none', transition: 'all 0.2s' }}>
                  Watch Episode 1
                </a>
                <a href="https://www.youtube.com/channel/UCoPOUK-XcrxaMQc_siSwVZA?sub_confirmation=1" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', padding: '12px 28px', borderRadius: 24, fontSize: '0.95rem', fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none', transition: 'all 0.2s' }}>
                  Subscribe on YouTube
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img src="/images/hero-full.png" alt="Finance is Cooked" style={{ maxWidth: '100%', height: 'auto', borderRadius: 16, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))' }} />
            </div>
          </div>
        </div>
      </header>

      {/* ── ABOUT / FEATURES ── */}
      <section style={{ padding: '100px 0', background: S.surface }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: 64 }}>
            <img src="/images/logo-chefs.png" alt="Finance is Cooked" style={{ width: 220, height: 'auto', margin: '0 auto 24px', borderRadius: 12 }} />
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16, color: S.text }}>Why Watch Finance is Cooked?</h2>
            <p style={{ fontSize: '1.15rem', color: S.textMuted, maxWidth: 560, margin: '0 auto' }}>AI is transforming finance fast. You can either get cooked — or become one of the chefs. We're here to make sure you're cooking.</p>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {FEATURES.map(f => (
              <FadeIn key={f.title} style={{ padding: 36, borderRadius: 16, border: `1px solid ${S.border}`, background: S.bg, transition: 'all 0.3s ease' }}>
                <div style={{ fontSize: '2rem', marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 10, color: S.text }}>{f.title}</h3>
                <p style={{ fontSize: '0.95rem', color: S.textMuted, lineHeight: 1.6 }}>{f.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOSTS ── */}
      <section style={{ padding: '100px 0', background: S.bg }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16, color: S.text }}>Meet Your Hosts</h2>
            <p style={{ fontSize: '1.15rem', color: S.textMuted, maxWidth: 560, margin: '0 auto' }}>Two finance & accounting professionals who caught the AI bug — and now they can't shut up about it.</p>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <FadeIn style={{ padding: 40, borderRadius: 16, border: `1px solid ${S.border}`, background: S.surface, textAlign: 'center', transition: 'all 0.3s' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🧑‍🍳</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 6, color: S.text }}>Ore Phillips</h3>
              <div style={{ fontSize: '0.85rem', color: S.primary, fontWeight: 600, marginBottom: 16 }}>Co-Host</div>
              <p style={{ fontSize: '0.95rem', color: S.textMuted, lineHeight: 1.7 }}>Finance strategist obsessed with where AI meets finance. Thinks the future is conversational, every finance professional can be a builder, and the intersection of AI and crypto is where things get really interesting. Sees around corners — then builds what he sees.</p>
            </FadeIn>
            <FadeIn style={{ padding: 40, borderRadius: 16, border: `1px solid ${S.border}`, background: S.surface, textAlign: 'center', transition: 'all 0.3s' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>👨‍🍳</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 6, color: S.text }}>Joe</h3>
              <div style={{ fontSize: '0.85rem', color: S.primary, fontWeight: 600, marginBottom: 16 }}>Co-Host &middot; Founder, Chain Bridge Accounting</div>
              <p style={{ fontSize: '0.95rem', color: S.textMuted, lineHeight: 1.7 }}>CPA who founded his own accounting firm in 2025 and built the entire website without writing a single line of code. Uses AI to deliver client work that used to take hours in minutes. Skeptical of hype, obsessed with what actually works, and proof that you don't need to be a developer to build with AI.</p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── EPISODES ── */}
      <section style={{ padding: '100px 0', background: S.bg }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16, color: S.text }}>Latest Episodes</h2>
            <p style={{ fontSize: '1.15rem', color: S.textMuted, maxWidth: 560, margin: '0 auto' }}>New episodes drop weekly. Season 1 coming soon.</p>
          </FadeIn>
          {/* Featured Episode */}
          <FadeIn style={{ padding: 36, borderRadius: 16, background: `linear-gradient(135deg, ${S.darkBg} 0%, ${S.navyLight} 100%)`, color: '#fff', marginBottom: 48 }}>
            <span style={{ display: 'inline-block', padding: '4px 12px', background: S.primary, color: '#fff', borderRadius: 24, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Now Live</span>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: S.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>EP 1 — PILOT</div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 12, lineHeight: 1.3 }}>Finance Is Cooked: The Pilot</h3>
            <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 20 }}>The one that starts it all. Ore and Joe build a real website from scratch — live, no code — break down the week's biggest AI headlines shaking up finance, and drop their hottest takes on where the industry is headed. This is the show.</p>
            <a href="https://youtu.be/YWj1NiRtlMc" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', padding: '12px 28px', borderRadius: 24, fontSize: '0.95rem', fontWeight: 600, background: S.primary, color: '#fff', textDecoration: 'none' }}>
              Watch Episode 1
            </a>
          </FadeIn>
          {/* Segments */}
          <h3 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, marginBottom: 32, color: S.text }}>Every Episode Includes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {SEGMENTS.map(s => (
              <FadeIn key={s.title} style={{ padding: 28, borderRadius: 12, border: `1px solid ${S.border}`, background: S.surface, transition: 'all 0.3s' }}>
                <span style={{ fontSize: '1.6rem', display: 'block', marginBottom: 12 }}>{s.icon}</span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 8, color: S.text }}>{s.title}</h4>
                <p style={{ fontSize: '0.9rem', color: S.textMuted, lineHeight: 1.6 }}>{s.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── BUILDS ── */}
      <section style={{ padding: '100px 0', background: S.surface }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16, color: S.text }}>What We've Built with AI</h2>
            <p style={{ fontSize: '1.15rem', color: S.textMuted, maxWidth: 560, margin: '0 auto' }}>Everything we build is open source. Grab the code, remix it, make it yours.</p>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {BUILDS.map(b => (
              <FadeIn key={b.title} style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: 16, padding: 32, transition: 'all 0.3s' }}>
                <div style={{ fontSize: '2rem', marginBottom: 16 }}>{b.icon}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: S.navy, marginBottom: 8 }}>{b.title}</h3>
                <p style={{ fontSize: '0.95rem', color: S.textMuted, lineHeight: 1.6, marginBottom: 16 }}>{b.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {b.stack.map(t => (
                    <span key={t} style={{ padding: '4px 12px', background: S.amberLight, color: S.navy, borderRadius: 24, fontSize: '0.8rem', fontWeight: 600 }}>{t}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {b.links.map(l => (
                    <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                      style={{
                        padding: '8px 20px', fontSize: '0.85rem', borderRadius: 8, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s',
                        ...(l.outline
                          ? { background: 'transparent', border: `1.5px solid ${S.navy}`, color: S.navy }
                          : { background: S.primary, color: '#fff', border: 'none' }),
                      }}>
                      {l.label}
                    </a>
                  ))}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOPICS ── */}
      <section style={{ padding: '100px 0', background: S.surface }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16, color: S.text }}>What We Cover</h2>
            <p style={{ fontSize: '1.15rem', color: S.textMuted, maxWidth: 560, margin: '0 auto' }}>Deep dives into the AI tools and skills that matter most for finance professionals.</p>
          </FadeIn>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {TOPICS.map(t => (
              <FadeIn key={t} as="span" style={{ padding: '12px 24px', background: S.bg, border: `1px solid ${S.border}`, borderRadius: 24, fontSize: '0.95rem', fontWeight: 500, color: S.text, cursor: 'default', transition: 'all 0.2s' }}>
                {t}
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section style={{ padding: '100px 0', background: `linear-gradient(135deg, ${S.darkBg} 0%, #2A1A14 50%, ${S.primaryDark} 100%)`, color: '#fff' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>Stay in the loop</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', marginBottom: 32 }}>Newsletter coming soon. Drop your email and we'll reach out when it's live.</p>
          <div style={{ display: 'flex', gap: 12, maxWidth: 480, margin: '0 auto' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{ flex: 1, padding: '14px 20px', borderRadius: 24, border: `1px solid ${S.darkSurface}`, background: S.darkSurface, color: '#fff', fontSize: '1rem', outline: 'none' }}
            />
            <a
              href={`mailto:financeiscooked@gmail.com?subject=${encodeURIComponent('Newsletter Sign-Up')}&body=${encodeURIComponent('Hey! I want to be notified when the newsletter launches.\n\nMy email: ' + email)}`}
              style={{ padding: '14px 28px', borderRadius: 24, fontWeight: 600, fontSize: '0.95rem', background: S.primary, color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Notify Me
            </a>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: 16 }}>We'll only email you when the newsletter launches.</p>
        </div>
      </section>

      {/* ── PLATFORMS ── */}
      <section style={{ padding: '100px 0', background: S.bg }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px' }}>
          <FadeIn style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16, color: S.text }}>Watch & Subscribe</h2>
            <p style={{ fontSize: '1.15rem', color: S.textMuted, maxWidth: 560, margin: '0 auto' }}>We're live on YouTube. More platforms coming soon.</p>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {PLATFORMS.map(p => (
              <FadeIn key={p.label} as="a" href={p.url} target={p.soon ? undefined : '_blank'} rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderRadius: 12,
                  border: `1px solid ${S.border}`, background: S.surface, fontWeight: 600, fontSize: '0.95rem',
                  color: S.text, textDecoration: 'none', transition: 'all 0.2s',
                  ...(p.soon ? { opacity: 0.6 } : {}),
                }}>
                <span style={{ fontSize: '1.4rem' }}>{p.icon}</span>
                <span>{p.label}</span>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: S.darkBg, color: 'rgba(255,255,255,0.7)', padding: '64px 0 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
            <div>
              <img src="/images/logo-tagline.png" alt="Finance is Cooked" style={{ width: 160, height: 'auto', borderRadius: 8 }} />
              <p style={{ marginTop: 16, fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 280 }}>Helping finance and accounting professionals learn AI and build the skills that matter.</p>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Show</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="https://www.youtube.com/@financeiscooked" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Episodes</a>
                <a href="https://www.youtube.com/@financeiscooked" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Subscribe</a>
              </div>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Community</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Coming Soon</span>
              </div>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>More</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="mailto:financeiscooked@gmail.com" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Contact</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${S.darkSurface}`, paddingTop: 24, textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
            &copy; {new Date().getFullYear()} Finance is Cooked. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
