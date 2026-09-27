type DodoCheckoutSuccess = { sessionId: string }
type DodoCheckoutClose = { reason: 'completed' | 'dismissed' | 'merchant_closed' }
type DodoCheckoutError = { code: string; message: string }

type DodoCheckoutOptions = {
  productId: string
  checkoutUrl?: string
  onSuccess?: (result: DodoCheckoutSuccess) => void
  onClose?: (result: DodoCheckoutClose) => void
  onError?: (error: DodoCheckoutError) => void
}

type DodoCheckoutHandle = { close: () => void }
type CheckoutMessage =
  | { source: 'dodo-checkout'; type: 'success'; sessionId: string }
  | { source: 'dodo-checkout'; type: 'close'; reason: DodoCheckoutClose['reason'] }
  | { source: 'dodo-checkout'; type: 'error'; code: string; message: string }

interface Window {
  DodoCheckout: { open: (options: DodoCheckoutOptions) => DodoCheckoutHandle }
}

;(function (window: Window, document: Document) {
  'use strict'

  const scriptElement = document.currentScript as HTMLScriptElement | null
  const scriptUrl = scriptElement?.src || window.location.href
  let activeCheckout: DodoCheckoutHandle | null = null

  function open(options: DodoCheckoutOptions): DodoCheckoutHandle {
    if (!options || typeof options !== 'object' || !options.productId?.trim()) {
      throw new TypeError('DodoCheckout.open requires a non-empty productId')
    }
    if (activeCheckout) throw new Error('A Dodo Checkout is already open')

    const checkoutUrl = new URL(options.checkoutUrl || '/checkout', scriptUrl)
    if (checkoutUrl.protocol !== 'https:' && checkoutUrl.hostname !== 'localhost' && checkoutUrl.hostname !== '127.0.0.1') {
      throw new TypeError('The checkout URL must use HTTPS (except on localhost)')
    }
    checkoutUrl.searchParams.set('productId', options.productId)
    checkoutUrl.searchParams.set('parentOrigin', window.location.origin)

    const checkoutOrigin = checkoutUrl.origin
    const iframe = document.createElement('iframe')
    iframe.title = 'Dodo Payments secure checkout'
    iframe.referrerPolicy = 'strict-origin'
    iframe.src = checkoutUrl.toString()
    iframe.setAttribute('allow', 'payment')
    iframe.setAttribute('aria-label', 'Dodo Payments secure checkout')
    iframe.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483647;background:transparent'

    let closed = false
    let loaded = false
    const loadTimer = window.setTimeout(() => {
      if (!loaded && !closed) {
        options.onError?.({ code: 'checkout_load_timeout', message: 'Checkout did not load. Check your connection and try again.' })
        cleanup()
      }
    }, 15000)

    function cleanup() {
      if (closed) return
      closed = true
      window.clearTimeout(loadTimer)
      window.removeEventListener('message', receiveMessage)
      iframe.removeEventListener('load', markLoaded)
      iframe.removeEventListener('error', handleLoadError)
      iframe.remove()
      activeCheckout = null
    }

    function close(reason: DodoCheckoutClose['reason']) {
      if (closed) return
      cleanup()
      options.onClose?.({ reason })
    }

    function markLoaded() {
      loaded = true
      window.clearTimeout(loadTimer)
    }

    function handleLoadError() {
      if (closed) return
      options.onError?.({ code: 'checkout_load_failed', message: 'Checkout could not be loaded. Please try again.' })
      cleanup()
    }

    function receiveMessage(event: MessageEvent<CheckoutMessage>) {
      if (closed || event.source !== iframe.contentWindow || event.origin !== checkoutOrigin) return
      const message = event.data
      if (!message || message.source !== 'dodo-checkout') return

      if (message.type === 'success' && typeof message.sessionId === 'string') {
        options.onSuccess?.({ sessionId: message.sessionId })
      } else if (message.type === 'error' && typeof message.code === 'string' && typeof message.message === 'string') {
        options.onError?.({ code: message.code, message: message.message })
      } else if (message.type === 'close' && ['completed', 'dismissed', 'merchant_closed'].includes(message.reason)) {
        close(message.reason)
      }
    }

    iframe.addEventListener('load', markLoaded)
    iframe.addEventListener('error', handleLoadError)
    window.addEventListener('message', receiveMessage)
    document.body.appendChild(iframe)

    const handle: DodoCheckoutHandle = { close: () => close('merchant_closed') }
    activeCheckout = handle
    return handle
  }

  window.DodoCheckout = { open }
})(window, document)
