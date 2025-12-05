// GHL Page Cloner - Content Script
// Runs on all pages to detect GHL and inject our script

(function() {
  'use strict';

  console.log('[GHL Cloner] Content script loaded on:', window.location.href);

  let injected = false;
  let currentTabId = null;

  // Inject our script into the page context
  function injectScript() {
    if (injected || document.querySelector('#ghl-cloner-inject')) {
      console.log('[GHL Cloner] Inject script already present');
      return;
    }

    const script = document.createElement('script');
    script.id = 'ghl-cloner-inject';
    script.src = chrome.runtime.getURL('content-scripts/inject.js');
    (document.head || document.documentElement).appendChild(script);
    injected = true;
    console.log('[GHL Cloner] Injected script into page');
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectScript);
  } else {
    injectScript();
  }

  // Callback map for async responses
  const callbackMap = new Map();

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[GHL Cloner Content] Received from popup:', message);

    if (message.from === 'Popup' && message.type === 'PASTE_PAGE') {
      const callbackId = `cb_${Date.now()}_${Math.random()}`;
      callbackMap.set(callbackId, sendResponse);

      // Forward to injected script
      window.postMessage({
        type: 'PASTE_PAGE',
        payload: message.payload,
        from: 'GHLClonerContent',
        callbackId
      }, '*');

      return true; // Keep channel open for async response
    }

    // Handle re-detection request from popup
    if (message.from === 'Popup' && message.type === 'REDETECT') {
      window.postMessage({
        type: 'REDETECT',
        from: 'GHLClonerContent'
      }, '*');
      sendResponse({ success: true });
      return false;
    }
  });

  // Listen for messages from injected script
  window.addEventListener('message', async (event) => {
    if (event.data?.from !== 'GHLClonerInject') return;

    const { type, payload } = event.data;
    console.log('[GHL Cloner Content] From inject script:', type, payload);

    // Store NUXT_DATA in chrome.storage
    if (type === 'NUXT_DATA' && payload) {
      try {
        // Get current tab ID
        const tabId = await getTabId();
        currentTabId = tabId;
        const storageKey = `tab_${tabId}`;

        // Store both tab-specific and general
        await chrome.storage.local.set({
          [storageKey]: payload,
          lastPageData: payload
        });

        console.log('[GHL Cloner Content] Stored page data for tab:', tabId, payload);

        // Update badge based on what we found
        const hasFullData = !!payload?.pageData?.funnelId;
        const isGHLPage = payload?.pageData?.isGHLPage;

        chrome.runtime.sendMessage({
          type: 'UPDATE_BADGE',
          hasData: hasFullData,
          isGHLPage: isGHLPage,
          tabId: tabId
        });
      } catch (e) {
        console.error('[GHL Cloner Content] Failed to store data:', e);
      }
    }
  });

  // Get current tab ID
  async function getTabId() {
    if (currentTabId) return currentTabId;

    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_TAB_ID' }, (response) => {
        currentTabId = response?.tabId || 0;
        resolve(currentTabId);
      });
    });
  }

  // Listen for responses from injected script
  window.addEventListener('ghlClonerResponse', (event) => {
    const { callbackId, payload } = event.detail;
    console.log('[GHL Cloner Content] Response for callback:', callbackId, payload);
    const callback = callbackMap.get(callbackId);
    if (callback) {
      callback(payload);
      callbackMap.delete(callbackId);
    }
  });

  // MutationObserver to detect dynamically loaded content
  let mutationTimeout = null;

  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      // Debounce: wait for mutations to settle
      if (mutationTimeout) clearTimeout(mutationTimeout);

      mutationTimeout = setTimeout(() => {
        // Check if any scripts were added
        let scriptsAdded = false;
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeName === 'SCRIPT') {
              scriptsAdded = true;
              break;
            }
          }
          if (scriptsAdded) break;
        }

        // If scripts were added, trigger re-detection
        if (scriptsAdded) {
          console.log('[GHL Cloner] New scripts detected, triggering re-detection');
          window.postMessage({
            type: 'REDETECT',
            from: 'GHLClonerContent'
          }, '*');
        }
      }, 500);
    });

    // Only observe if body exists
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      console.log('[GHL Cloner] MutationObserver set up');
    } else {
      // Wait for body
      document.addEventListener('DOMContentLoaded', () => {
        if (document.body) {
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
          console.log('[GHL Cloner] MutationObserver set up after DOMContentLoaded');
        }
      });
    }
  }

  // Set up observer after a short delay to let initial page load complete
  setTimeout(setupMutationObserver, 1000);

})();
