"use strict";
;
(function (window, document) {
    'use strict';
    const scriptElement = document.currentScript;
    const scriptUrl = (scriptElement === null || scriptElement === void 0 ? void 0 : scriptElement.src) || window.location.href;
    let activeCheckout = null;
    function open(options) {
        var _a;
        if (!options || typeof options !== 'object' || !((_a = options.productId) === null || _a === void 0 ? void 0 : _a.trim())) {
            throw new TypeError('DodoCheckout.open requires a non-empty productId');
        }
        if (activeCheckout)
            throw new Error('A Dodo Checkout is already open');
        const checkoutUrl = new URL(options.checkoutUrl || '/checkout', scriptUrl);
        if (checkoutUrl.protocol !== 'https:' && checkoutUrl.hostname !== 'localhost' && checkoutUrl.hostname !== '127.0.0.1') {
            throw new TypeError('The checkout URL must use HTTPS (except on localhost)');
        }
        checkoutUrl.searchParams.set('productId', options.productId);
        checkoutUrl.searchParams.set('parentOrigin', window.location.origin);
        const checkoutOrigin = checkoutUrl.origin;
        const iframe = document.createElement('iframe');
        iframe.title = 'Dodo Payments secure checkout';
        iframe.referrerPolicy = 'strict-origin';
        iframe.src = checkoutUrl.toString();
        iframe.setAttribute('allow', 'payment');
        iframe.setAttribute('aria-label', 'Dodo Payments secure checkout');
        iframe.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483647;background:transparent';
        let closed = false;
        let loaded = false;
        const loadTimer = window.setTimeout(() => {
            var _a;
            if (!loaded && !closed) {
                (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, { code: 'checkout_load_timeout', message: 'Checkout did not load. Check your connection and try again.' });
                cleanup();
            }
        }, 15000);
        function cleanup() {
            if (closed)
                return;
            closed = true;
            window.clearTimeout(loadTimer);
            window.removeEventListener('message', receiveMessage);
            iframe.removeEventListener('load', markLoaded);
            iframe.removeEventListener('error', handleLoadError);
            iframe.remove();
            activeCheckout = null;
        }
        function close(reason) {
            var _a;
            if (closed)
                return;
            cleanup();
            (_a = options.onClose) === null || _a === void 0 ? void 0 : _a.call(options, { reason });
        }
        function markLoaded() {
            loaded = true;
            window.clearTimeout(loadTimer);
        }
        function handleLoadError() {
            var _a;
            if (closed)
                return;
            (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, { code: 'checkout_load_failed', message: 'Checkout could not be loaded. Please try again.' });
            cleanup();
        }
        function receiveMessage(event) {
            var _a, _b;
            if (closed || event.source !== iframe.contentWindow || event.origin !== checkoutOrigin)
                return;
            const message = event.data;
            if (!message || message.source !== 'dodo-checkout')
                return;
            if (message.type === 'success' && typeof message.sessionId === 'string') {
                (_a = options.onSuccess) === null || _a === void 0 ? void 0 : _a.call(options, { sessionId: message.sessionId });
            }
            else if (message.type === 'error' && typeof message.code === 'string' && typeof message.message === 'string') {
                (_b = options.onError) === null || _b === void 0 ? void 0 : _b.call(options, { code: message.code, message: message.message });
            }
            else if (message.type === 'close' && ['completed', 'dismissed', 'merchant_closed'].includes(message.reason)) {
                close(message.reason);
            }
        }
        iframe.addEventListener('load', markLoaded);
        iframe.addEventListener('error', handleLoadError);
        window.addEventListener('message', receiveMessage);
        document.body.appendChild(iframe);
        const handle = { close: () => close('merchant_closed') };
        activeCheckout = handle;
        return handle;
    }
    window.DodoCheckout = { open };
})(window, document);
