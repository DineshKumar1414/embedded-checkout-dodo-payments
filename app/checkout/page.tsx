'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronRight, CircleAlert, CreditCard, LockKeyhole, Mail, ShieldCheck, X, Zap } from 'lucide-react'

type CheckoutEvent =
  | { source: 'dodo-checkout'; type: 'success'; sessionId: string }
  | { source: 'dodo-checkout'; type: 'close'; reason: 'completed' | 'dismissed' }
  | { source: 'dodo-checkout'; type: 'error'; code: string; message: string }

const products: Record<string, { name: string; description: string; price: number }> = {
  prod_123: { name: 'Annual Pro plan', description: 'Everything you need to move faster.', price: 129 },
}

function getParentOrigin() {
  const requestedOrigin = new URLSearchParams(window.location.search).get('parentOrigin')
  if (!requestedOrigin) return null
  try {
    const origin = new URL(requestedOrigin).origin
    if (origin !== requestedOrigin || (window.location.protocol === 'https:' && !origin.startsWith('https://'))) return null
    if (document.referrer && new URL(document.referrer).origin !== origin) return null
    return origin
  } catch {
    return null
  }
}

export default function CheckoutPage() {
  const [product] = useState(() => {
    if (typeof window === 'undefined') return products.prod_123
    const productId = new URLSearchParams(window.location.search).get('productId') || 'prod_123'
    return products[productId] || products.prod_123
  })
  const [email, setEmail] = useState('alex@northstar.design')
  const [card, setCard] = useState('4242 4242 4242 4242')
  const [expiry, setExpiry] = useState('12 / 30')
  const [cvc, setCvc] = useState('123')
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [retryUsed, setRetryUsed] = useState(false)
  const [parentOrigin, setParentOrigin] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<'invalid' | 'declined' | 'temporary' | null>(null)

  useEffect(() => {
    setParentOrigin(getParentOrigin())
  }, [])

  function send(event: CheckoutEvent) {
    if (parentOrigin && window.parent !== window) window.parent.postMessage(event, parentOrigin)
  }

  function close() {
    if (status !== 'processing') send({ source: 'dodo-checkout', type: 'close', reason: status === 'success' ? 'completed' : 'dismissed' })
  }

  function pay() {
    const digits = card.replaceAll(' ', '')
    const valid = /\S+@\S+\.\S+/.test(email) && /^\d{16}$/.test(digits) && /^\d{2}\s?\/\s?\d{2}$/.test(expiry) && /^\d{3,4}$/.test(cvc)
    if (status === 'processing') return
    if (!valid) {
      const message = 'Enter a valid email, card number, expiry date, and security code.'
      setPaymentError('invalid')
      setStatus('error')
      send({ source: 'dodo-checkout', type: 'error', code: 'invalid_payment_details', message })
      return
    }

    setPaymentError(null)
    setStatus('processing')
    window.setTimeout(() => {
      if (digits === '4000000000000002') {
        setPaymentError('declined')
        setStatus('error')
        send({ source: 'dodo-checkout', type: 'error', code: 'card_declined', message: 'That card was declined. Try another card.' })
      } else if (digits === '4000000000000341' && !retryUsed) {
        setRetryUsed(true)
        setPaymentError('temporary')
        setStatus('error')
        send({ source: 'dodo-checkout', type: 'error', code: 'payment_failed', message: 'Payment failed once. Please retry.' })
      } else {
        setPaymentError(null)
        setStatus('success')
        send({ source: 'dodo-checkout', type: 'success', sessionId: 'session_8f2k1' })
      }
    }, 900)
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  return (
    <div className="modal-backdrop checkout-route" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title" aria-describedby="checkout-description">
        <div className="checkout-topbar"><div className="checkout-brand"><span className="brand-mark small">D</span><span>dodo<span className="brand-accent">.</span></span></div><button className="icon-button" onClick={close} aria-label="Close checkout"><X /></button></div>
        {status === 'success' ? (
          <div className="success-state"><div className="success-mark"><Check /></div><p className="eyebrow">Payment confirmed</p><h2>Welcome to Pro.</h2><p>Your account is ready. A receipt is heading to <strong>{email}</strong>.</p><button className="pay-button" onClick={close}>Done <Check data-icon="inline-end" /></button><span className="secure-line"><ShieldCheck /> Secured by Dodo Payments</span></div>
        ) : <>
          <div className="checkout-heading"><div className="product-icon"><Zap /></div><div><p className="eyebrow">Complete purchase</p><h2 id="checkout-title">{product.name}</h2><p id="checkout-description">{product.description}</p></div></div>
          <div className="order-line"><span>Total due today</span><strong>${product.price}<small>/ year</small></strong></div>
          {status === 'error' && <div className="payment-error" role="alert"><CircleAlert /><div><strong>{paymentError === 'invalid' ? 'Check your payment details' : 'Payment didn&apos;t go through'}</strong><span>{paymentError === 'invalid' ? 'Enter a valid email, card number, expiry date, and security code.' : paymentError === 'temporary' ? 'A temporary processing issue occurred. Retry this card to continue.' : 'That card was declined. Try a different card.'}</span></div></div>}
          <div className="form-stack">
            <label>Email address<div className="input-wrap"><Mail /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required /></div></label>
            <label>Card details<div className="input-wrap"><CreditCard /><input value={card} onChange={(event) => setCard(event.target.value)} inputMode="numeric" autoComplete="cc-number" aria-label="Card number" /></div></label>
            <div className="input-grid"><label>Expiry<div className="input-wrap"><input value={expiry} onChange={(event) => setExpiry(event.target.value)} placeholder="MM / YY" aria-label="Expiry date" inputMode="numeric" autoComplete="cc-exp" /></div></label><label>CVC<div className="input-wrap"><input value={cvc} onChange={(event) => setCvc(event.target.value)} placeholder="123" aria-label="CVC" inputMode="numeric" autoComplete="cc-csc" /></div></label></div>
          </div>
          <button className="pay-button" onClick={pay} disabled={status === 'processing'}>{status === 'processing' ? <><span className="spinner" /> Authorizing...</> : <>{status === 'error' ? 'Try payment again' : `Pay $${product.price}`} <ChevronRight data-icon="inline-end" /></>}</button>
          <div className="modal-footer"><span><LockKeyhole /> Your payment is encrypted and secure</span><span className="card-brands">VISA&nbsp;&nbsp;•••</span></div>
        </>}
      </div>
    </div>
  )
}
