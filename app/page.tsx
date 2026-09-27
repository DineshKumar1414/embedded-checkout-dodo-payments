'use client'

import { useRef, useState } from 'react'
import {
  ArrowUpRight,
  Check,
  CircleAlert,
  LockKeyhole,
  Package,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'

const PRODUCT = {
  id: 'prod_123',
  name: 'Annual Pro plan',
  description: 'Everything you need to move faster.',
  price: 129,
  cadence: '/ year',
}

type EventItem = {
  type: 'success' | 'close' | 'error' | 'open'
  title: string
  detail: string
  time: string
}

function formatTime() {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date())
}

function EventLog({ events }: { events: EventItem[] }) {
  return (
    <section className="event-card" aria-labelledby="events-title">
      <div className="event-card-header">
        <div>
          <p className="eyebrow">Integration events</p>
          <h2 id="events-title">Callback log</h2>
        </div>
        <span className="live-pill"><span /> Live</span>
      </div>
      <div className="event-list">
        {events.length === 0 ? (
          <div className="empty-log"><Sparkles aria-hidden="true" /><p>Your checkout events will appear here.</p></div>
        ) : events.map((event, index) => (
          <div className="event-row" key={`${event.time}-${index}`}>
            <div className={`event-icon ${event.type}`}>
              {event.type === 'success' ? <Check /> : event.type === 'error' ? <CircleAlert /> : event.type === 'close' ? <X /> : <ArrowUpRight />}
            </div>
            <div className="event-copy"><strong>{event.title}</strong><span>{event.detail}</span></div>
            <time>{event.time}</time>
          </div>
        ))}
      </div>
      <div className="code-note"><span className="code-dot">{`>`}</span><code>DodoCheckout.open({'{'} productId: &apos;prod_123&apos; {'}'})</code></div>
    </section>
  )
}

export default function Page() {
  const checkoutRef = useRef<DodoCheckoutHandle | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [events, setEvents] = useState<EventItem[]>([])

  function addEvent(event: EventItem) {
    setEvents((current) => [event, ...current])
  }

  function launch() {
    if (checkoutOpen) return
    if (!window.DodoCheckout) {
      addEvent({ type: 'error', title: 'onError', detail: 'sdk_unavailable · Checkout SDK did not load', time: formatTime() })
      return
    }

    setCheckoutOpen(true)
    addEvent({ type: 'open', title: 'Checkout opened', detail: 'productId · prod_123', time: formatTime() })
    try {
      checkoutRef.current = window.DodoCheckout.open({
        productId: PRODUCT.id,
        checkoutUrl: process.env.NEXT_PUBLIC_CHECKOUT_URL,
        onSuccess: ({ sessionId }) => addEvent({ type: 'success', title: 'onSuccess', detail: `${sessionId} · Payment complete`, time: formatTime() }),
        onError: ({ code, message }) => {
          addEvent({ type: 'error', title: 'onError', detail: `${code} · ${message}`, time: formatTime() })
          if (code.startsWith('checkout_load_')) {
            checkoutRef.current = null
            setCheckoutOpen(false)
          }
        },
        onClose: ({ reason }) => {
          checkoutRef.current = null
          setCheckoutOpen(false)
          addEvent({ type: 'close', title: 'onClose', detail: `reason · ${reason}`, time: formatTime() })
        },
      })
    } catch (error) {
      checkoutRef.current = null
      setCheckoutOpen(false)
      addEvent({ type: 'error', title: 'onError', detail: `checkout_open_failed · ${error instanceof Error ? error.message : 'Could not open checkout'}`, time: formatTime() })
    }
  }
  return <main className="site-shell">
    <nav className="top-nav"><div className="brand"><span className="brand-mark">D</span><span>dodo<span className="brand-accent">.</span> payments</span></div><div className="nav-meta"><span className="status-dot" /> Sandbox mode <span className="nav-divider" /> <span>SDK v1.0</span></div></nav>
    <div className="hero-grid"><section className="hero-copy"><div className="tag"><span className="tag-dot" /> Developer preview</div><h1>Payments that feel<br /><em>like your product.</em></h1><p className="hero-lede">A tiny checkout SDK for teams who care about the moment a customer says yes.</p><div className="trust-row"><div className="avatar-stack"><span>AN</span><span>JR</span><span>MK</span></div><span>Trusted by teams shipping<br />their next big thing</span></div></section><section className="demo-card" aria-labelledby="demo-title"><div className="browser-bar"><div className="browser-dots"><span /><span /><span /></div><div className="browser-url"><LockKeyhole /> demo.yourstore.com/upgrade</div><div /></div><div className="store-preview"><div className="store-nav"><strong>northstar<span className="brand-accent">.</span></strong><span>Product&nbsp;&nbsp;&nbsp; Pricing&nbsp;&nbsp;&nbsp; Journal</span><span className="tiny-avatar">A</span></div><div className="store-content"><div className="product-visual"><div className="visual-glow" /><Package /></div><div className="store-copy"><span className="mini-label">Northstar Pro</span><h2 id="demo-title">Make room<br />for good work.</h2><p>Everything you need to turn ideas into momentum.</p><div className="price"><strong>$129</strong><span>/ year</span></div><button className="buy-button" onClick={launch} disabled={checkoutOpen}>Get Northstar Pro <ArrowUpRight data-icon="inline-end" /></button><small><ShieldCheck /> Secure checkout · cancel anytime</small></div></div></div><div className="demo-caption"><span><span className="pulse" /> Live embed preview</span><span>Click the button to try it</span></div></section></div>
      <small className="demo-simulation-note">Demo only — payments are simulated. No real payment is processed.</small>
    <div className="below-grid"><EventLog events={events} /><section className="principles"><p className="eyebrow">The point of view</p><h2>Small surface.<br />Clear contract.</h2><div className="principle-list"><div><span>01</span><p><strong>One intentional step</strong><br />No account creation. No surprise redirects. Just the details needed to get paid.</p></div><div><span>02</span><p><strong>Truth travels back</strong><br />Every outcome is a callback. The host never has to guess what happened.</p></div><div><span>03</span><p><strong>Safe by default</strong><br />Card data stays inside the checkout boundary, never touching the host page.</p></div></div></section></div>
    <footer><span>© 2026 dodo payments</span><span>Built for the moment that matters <Sparkles /></span></footer>
  </main>
}
