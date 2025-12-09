// GHL Page Cloner - Content Script
// Mimics Super Cloner's architecture - minimal content script, storage in background

(function() {
  'use strict';

  // Inject script into page (Super Cloner pattern)
  const injectScript = () => {
    if (!document.body) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectScript);
        return;
      }
      setTimeout(injectScript, 10);
      return;
    }
    if (document.querySelector('#ghl-cloner-inject')) return;

    const script = document.createElement('script');
    script.id = 'ghl-cloner-inject';
    script.src = chrome.runtime.getURL('content-scripts/inject.js');
    document.body.appendChild(script);
  };
  injectScript();

  // Callback map for async responses
  const callbackMap = new Map();

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const from = message?.from;
    const type = message?.type;
    const callbackId = `cb_${Date.now()}_${Math.random()}`;
    callbackMap.set(callbackId, sendResponse);

    // Re-detection request from background
    if (type === 'CHECK_NUXT_APP' && from === 'Background') {
      if (!document.body) return true;
      const existing = document.querySelector('#ghl-cloner-inject');
      if (existing) {
        existing.remove();
        const script = document.createElement('script');
        script.id = 'ghl-cloner-inject';
        script.src = chrome.runtime.getURL('content-scripts/inject.js');
        document.body.appendChild(script);
      }
      return true;
    }

    // Messages from Popup - forward to inject script
    if (from === 'Popup') {
      window.postMessage({ ...message, callbackId }, '*');
      return true;
    }
  });

  // Listen for messages from injected script - forward to background (Super Cloner pattern)
  // NO callbacks, NO storage here - just forward to background
  window.addEventListener('message', (event) => {
    const from = event.data?.from;
    const type = event.data?.type;
    const payload = event.data?.payload;

    if (from === 'GHLClonerInject') {
      // Just forward to background - no callback needed (Super Cloner pattern)
      chrome.runtime.sendMessage({ type, payload, from });
    }
  });

  // Listen for responses from injected script
  window.addEventListener('ghlClonerResponse', (event) => {
    const { callbackId, payload } = event.detail;
    const callback = callbackMap.get(callbackId);
    if (callback) {
      callback(payload);
      callbackMap.delete(callbackId);
    }
  });

})();
