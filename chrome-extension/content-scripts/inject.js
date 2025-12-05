(function() {
  'use strict';

  console.log('[GHL Cloner] Inject script loaded');

  // ============================================
  // GHL CONTENT SIGNATURES
  // ============================================

  const GHL_SIGNATURES = {
    // Script sources that indicate GHL
    scripts: [
      'leadconnectorhq.com',
      'msgsndr.com',
      'highlevel.com',
      'gohighlevel.com',
      'cdn.msgsndr.com',
      'assets.leadconnectorhq.com'
    ],
    // Global variables GHL injects
    globals: [
      'hlPageData',
      'hlFunnelData',
      '__HL_PAGE__',
      '__HL_DATA__',
      'funnelPageData',
      'pageData'
    ]
  };

  // Retry delays for detection (exponential backoff up to 10 seconds)
  const RETRY_DELAYS = [0, 100, 300, 600, 1000, 2000, 4000, 7000, 10000];

  // ============================================
  // HELPERS
  // ============================================

  function sendResponse(callbackId, payload) {
    const event = new CustomEvent('ghlClonerResponse', {
      detail: { callbackId, payload }
    });
    window.dispatchEvent(event);
  }

  function sendMessage(type, payload) {
    try {
      const serializedPayload = JSON.parse(JSON.stringify(payload));
      window.postMessage({ type, payload: serializedPayload, from: 'GHLClonerInject' }, '*');
    } catch (e) {
      console.error('[GHL Cloner] Failed to serialize payload:', e);
      window.postMessage({ type, payload: null, from: 'GHLClonerInject' }, '*');
    }
  }

  function parseBuilderUrl(url) {
    const match = url.match(/location\/([^/]+)\/page-builder\/([^/]+)/);
    if (match) {
      return { locationId: match[1], pageBuilderId: match[2] };
    }
    return null;
  }

  function getRevexService() {
    const app = document.querySelector('#app');
    if (app && app.__vue_app__) {
      return app.__vue_app__.config.globalProperties.revexBackendService;
    }
    return null;
  }

  async function getPageInfo(pageBuilderId) {
    const revex = getRevexService();
    if (!revex) {
      throw new Error('Could not find revex service');
    }

    const response = await revex.get(`https://backend.leadconnectorhq.com/funnels/page/${pageBuilderId}`);
    if (response?.status === 200 && response?.data) {
      return response.data;
    }
    throw new Error('Failed to get page info');
  }

  async function getCurrentUser() {
    if (window.AppUtils?.Utilities?.getCurrentUser) {
      return await window.AppUtils.Utilities.getCurrentUser();
    }
    return null;
  }

  async function cloneFunnelStep(params) {
    const revex = getRevexService();
    if (!revex) {
      throw new Error('Could not find revex service');
    }

    console.log('[GHL Cloner] Calling clone API with:', params);

    const response = await revex.post(
      'https://backend.leadconnectorhq.com/funnels/funnel/clone-funnel-step/',
      params
    );

    console.log('[GHL Cloner] Clone API response:', response);

    if (response?.status === 201) {
      return response.data;
    }
    throw new Error(`Clone API failed with status: ${response?.status}`);
  }

  // ============================================
  // OVERLAY UI
  // ============================================

  function showSuccessOverlay(message) {
    const overlay = document.createElement('div');
    overlay.id = 'ghl-cloner-overlay';
    overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: 'Roboto', 'Arial', sans-serif;
      ">
        <div style="
          background-color: #fff;
          color: rgba(0, 0, 0, 0.8);
          padding: 28px 40px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16d436" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.801 10A10 10 0 1 1 17 3.335"/>
            <path d="m9 11 3 3L22 4"/>
          </svg>
          <span style="font-size: 24px; font-weight: 600;">${message}</span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 2500);
  }

  function showErrorOverlay(message) {
    const overlay = document.createElement('div');
    overlay.id = 'ghl-cloner-overlay';
    overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: 'Roboto', 'Arial', sans-serif;
      ">
        <div style="
          background-color: #fff;
          color: rgba(0, 0, 0, 0.8);
          padding: 28px 40px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span style="font-size: 24px; font-weight: 600;">${message}</span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 3000);
  }

  function showLoadingOverlay(message) {
    const overlay = document.createElement('div');
    overlay.id = 'ghl-cloner-loading';
    overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: 'Roboto', 'Arial', sans-serif;
      ">
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        ">
          <div style="
            width: 50px;
            height: 50px;
            border: 4px solid #e5e7eb;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
          <span style="font-size: 24px; color: #374151;">${message}</span>
        </div>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  // ============================================
  // PASTE HANDLER
  // ============================================

  async function handlePaste(sourceData, callbackId) {
    console.log('[GHL Cloner] Starting paste operation');
    console.log('[GHL Cloner] Source data:', sourceData);

    const loadingOverlay = showLoadingOverlay('Pasting page, please wait...');

    try {
      const sourceFunnelId = sourceData.pageData?.funnelId;
      const sourceStepId = sourceData.pageData?.stepId;

      if (!sourceFunnelId || !sourceStepId) {
        throw new Error('Missing source funnel or step ID');
      }

      const currentUrl = window.location.href;
      const urlInfo = parseBuilderUrl(currentUrl);

      if (!urlInfo) {
        throw new Error('Not on a valid page builder URL');
      }

      console.log('[GHL Cloner] URL info:', urlInfo);

      const targetPageInfo = await getPageInfo(urlInfo.pageBuilderId);
      console.log('[GHL Cloner] Target page info:', targetPageInfo);

      const targetFunnelId = targetPageInfo.funnelId;
      const targetStepId = targetPageInfo.stepId;

      if (!targetFunnelId || !targetStepId) {
        throw new Error('Could not get target funnel/step IDs');
      }

      const currentUser = await getCurrentUser();
      const userId = currentUser?.id;

      if (!userId) {
        throw new Error('Could not get current user ID');
      }

      console.log('[GHL Cloner] User ID:', userId);

      const cloneParams = {
        funnelId: targetFunnelId,
        funnelIdToImport: sourceFunnelId,
        funnels: [targetFunnelId],
        locationId: urlInfo.locationId,
        pageIndexToImport: "0",
        pageIndexToImportInto: "0",
        stepId: sourceStepId,
        stepIdToImportInto: targetStepId,
        userId: userId
      };

      const result = await cloneFunnelStep(cloneParams);

      loadingOverlay.remove();

      if (result?.status === 'ok') {
        showSuccessOverlay('Page cloned successfully!');

        setTimeout(() => {
          const builderIframe = document.querySelector('[name="funnel-builder"]');
          if (builderIframe) {
            builderIframe.src = builderIframe.src;
          } else {
            window.location.reload();
          }
        }, 1500);

        sendResponse(callbackId, { success: true });
      } else {
        throw new Error('Clone API returned non-ok status');
      }

    } catch (error) {
      console.error('[GHL Cloner] Paste error:', error);
      loadingOverlay.remove();
      showErrorOverlay('Failed to paste: ' + error.message);
      sendResponse(callbackId, { success: false, error: error.message });
    }
  }

  // ============================================
  // GHL DETECTION - CONTENT-CENTRIC APPROACH
  // ============================================

  // Method 1: Check for GHL script sources
  function checkScriptSources() {
    const scripts = document.querySelectorAll('script[src]');
    for (const script of scripts) {
      const src = script.src || '';
      if (GHL_SIGNATURES.scripts.some(sig => src.includes(sig))) {
        console.log('[GHL Cloner] Detected GHL via script source:', src);
        return true;
      }
    }
    return false;
  }

  // Method 2: Check for GHL CDN links
  function checkCDNLinks() {
    const elements = document.querySelectorAll('link[href], script[src], img[src]');
    for (const el of elements) {
      const url = el.href || el.src || '';
      if (url.includes('cdn.msgsndr.com') ||
          url.includes('assets.leadconnectorhq.com') ||
          url.includes('cdn.gohighlevel.com') ||
          url.includes('images.leadconnectorhq.com')) {
        console.log('[GHL Cloner] Detected GHL via CDN link:', url);
        return true;
      }
    }
    return false;
  }

  // Method 3: Check for GHL global variables
  function checkGlobalVariables() {
    for (const varName of GHL_SIGNATURES.globals) {
      if (window[varName] && typeof window[varName] === 'object') {
        console.log('[GHL Cloner] Detected GHL via global variable:', varName);
        return { detected: true, data: window[varName] };
      }
    }

    // Check nested Nuxt patterns
    if (window.__NUXT__?.state?.funnelData) {
      console.log('[GHL Cloner] Detected GHL via __NUXT__.state.funnelData');
      return { detected: true, data: window.__NUXT__.state.funnelData };
    }
    if (window.__NUXT__?.data) {
      console.log('[GHL Cloner] Detected GHL via __NUXT__.data');
      return { detected: true, data: window.__NUXT__.data };
    }

    return { detected: false };
  }

  // Method 4: Check DOM data attributes
  function checkDataAttributes() {
    const funnelEl = document.querySelector('[data-funnel-id]');
    const stepEl = document.querySelector('[data-step-id]');
    const pageEl = document.querySelector('[data-page-id]');

    if (funnelEl || stepEl || pageEl) {
      console.log('[GHL Cloner] Detected GHL via data attributes');
      return {
        funnelId: funnelEl?.dataset?.funnelId || funnelEl?.getAttribute('data-funnel-id'),
        stepId: stepEl?.dataset?.stepId || stepEl?.getAttribute('data-step-id') || pageEl?.dataset?.pageId
      };
    }
    return null;
  }

  // Method 5: Deep search window properties
  function deepSearchWindow() {
    const searchKeys = ['funnel', 'step', 'page', 'hl', 'nuxt'];

    try {
      for (const key of Object.keys(window)) {
        const lowerKey = key.toLowerCase();
        if (searchKeys.some(s => lowerKey.includes(s))) {
          try {
            const val = window[key];
            if (val && typeof val === 'object') {
              const found = extractFunnelData(val);
              if (found?.pageData?.funnelId) {
                console.log('[GHL Cloner] Found funnel data in window.' + key);
                return found;
              }
            }
          } catch (e) {
            // Skip inaccessible properties
          }
        }
      }
    } catch (e) {
      console.log('[GHL Cloner] Error searching window:', e.message);
    }
    return null;
  }

  // Method 6: Parse inline scripts for funnel data
  function parseInlineScripts() {
    const scripts = document.querySelectorAll('script:not([src])');

    for (const script of scripts) {
      const content = script.textContent || '';
      if (content.length < 10 || content.length > 500000) continue;

      // Try multiple patterns
      const patterns = [
        { funnel: /"funnelId"\s*:\s*"([^"]+)"/, step: /"stepId"\s*:\s*"([^"]+)"/ },
        { funnel: /funnelId['":\s]+['"]([a-zA-Z0-9]+)['"]/, step: /stepId['":\s]+['"]([a-zA-Z0-9]+)['"]/ },
        { funnel: /funnel_id['":\s]+['"]([a-zA-Z0-9]+)['"]/, step: /step_id['":\s]+['"]([a-zA-Z0-9]+)['"]/ },
        { funnel: /funnelId:\s*['"]([^'"]+)['"]/, step: /stepId:\s*['"]([^'"]+)['"]/ }
      ];

      for (const pattern of patterns) {
        const funnelMatch = content.match(pattern.funnel);
        const stepMatch = content.match(pattern.step);

        if (funnelMatch && stepMatch) {
          console.log('[GHL Cloner] Found funnel data in inline script');
          return {
            pageData: {
              funnelId: funnelMatch[1],
              stepId: stepMatch[1]
            }
          };
        }
      }
    }
    return null;
  }

  // Method 7: Check Nuxt data script tag
  function checkNuxtDataTag() {
    const nuxtDataScript = document.getElementById('__NUXT_DATA__');
    if (nuxtDataScript) {
      try {
        const data = JSON.parse(nuxtDataScript.textContent);
        console.log('[GHL Cloner] Found __NUXT_DATA__ script tag');
        return extractFunnelData(data);
      } catch (e) {
        // JSON parse failed
      }
    }

    // Also try useNuxtApp if available
    try {
      if (typeof useNuxtApp === 'function') {
        const nuxtApp = useNuxtApp();
        if (nuxtApp?.payload?.data) {
          console.log('[GHL Cloner] Found Nuxt payload via useNuxtApp');
          return extractFunnelData(nuxtApp.payload.data);
        }
      }
    } catch (e) {
      // useNuxtApp not available
    }

    return null;
  }

  // Extract funnel data from various structures
  function extractFunnelData(data) {
    if (!data) return null;

    // Direct properties
    if (data.funnelId && data.stepId) {
      return { pageData: { funnelId: data.funnelId, stepId: data.stepId } };
    }

    // Nested in page object
    if (data.page?.funnelId) {
      return { pageData: { funnelId: data.page.funnelId, stepId: data.page.stepId || data.page.id } };
    }

    // Search recursively (limited depth)
    const found = findFunnelData(data, 0);
    if (found) {
      return { pageData: found };
    }

    return null;
  }

  // Recursively search for funnel data
  function findFunnelData(obj, depth) {
    if (depth > 6 || !obj || typeof obj !== 'object') return null;

    // Check if this object has funnelId and stepId
    if (obj.funnelId && obj.stepId) {
      return { funnelId: obj.funnelId, stepId: obj.stepId };
    }

    // Check array items
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = findFunnelData(item, depth + 1);
        if (found) return found;
      }
      return null;
    }

    // Check object properties
    for (const key of Object.keys(obj)) {
      try {
        const val = obj[key];
        if (val && typeof val === 'object') {
          const found = findFunnelData(val, depth + 1);
          if (found) return found;
        }
      } catch (e) {
        // Skip inaccessible properties
      }
    }
    return null;
  }

  // ============================================
  // MAIN DETECTION FUNCTION
  // ============================================

  function checkForPageData() {
    console.log('[GHL Cloner] Checking for page data...');

    // First: Check if this is a GHL page by content signatures
    const isGHLByScript = checkScriptSources();
    const isGHLByCDN = checkCDNLinks();
    const isGHLPage = isGHLByScript || isGHLByCDN;

    console.log('[GHL Cloner] GHL detection - Scripts:', isGHLByScript, 'CDN:', isGHLByCDN);

    // Try to extract specific funnel data

    // Method 1: Nuxt data tag
    const nuxtData = checkNuxtDataTag();
    if (nuxtData?.pageData?.funnelId) {
      console.log('[GHL Cloner] Found data via Nuxt tag');
      return nuxtData;
    }

    // Method 2: Global variables
    const globalData = checkGlobalVariables();
    if (globalData.detected && globalData.data) {
      const extracted = extractFunnelData(globalData.data);
      if (extracted?.pageData?.funnelId) {
        console.log('[GHL Cloner] Found data via globals');
        return extracted;
      }
    }

    // Method 3: DOM data attributes
    const domData = checkDataAttributes();
    if (domData?.funnelId) {
      console.log('[GHL Cloner] Found data via DOM attributes');
      return { pageData: domData };
    }

    // Method 4: Deep window search
    const windowData = deepSearchWindow();
    if (windowData?.pageData?.funnelId) {
      console.log('[GHL Cloner] Found data via window search');
      return windowData;
    }

    // Method 5: Inline script parsing
    const scriptData = parseInlineScripts();
    if (scriptData?.pageData?.funnelId) {
      console.log('[GHL Cloner] Found data via script parsing');
      return scriptData;
    }

    // If we detected GHL but couldn't get specific IDs, still mark as GHL page
    if (isGHLPage) {
      console.log('[GHL Cloner] GHL page detected but no specific funnel data found');
      return {
        pageData: {
          isGHLPage: true,
          url: window.location.href,
          detectionMethod: 'signature-match'
        }
      };
    }

    // Also check URL patterns as fallback
    const url = window.location.href;
    if (url.includes('.myfunnels.com') ||
        url.includes('.leadconnectorhq.com') ||
        url.includes('app.gohighlevel.com')) {
      console.log('[GHL Cloner] GHL detected via URL pattern');
      return {
        pageData: {
          isGHLPage: true,
          url: url,
          detectionMethod: 'url-pattern'
        }
      };
    }

    console.log('[GHL Cloner] No GHL data found on this page');
    return null;
  }

  // ============================================
  // INITIALIZATION WITH RETRIES
  // ============================================

  let detectionAttempt = 0;
  let detectionComplete = false;

  function attemptDetection() {
    if (detectionComplete) return;

    const pageData = checkForPageData();

    if (pageData?.pageData?.funnelId) {
      // Full data found - send immediately
      console.log('[GHL Cloner] Full page data found, sending to content script');
      sendMessage('NUXT_DATA', pageData);
      detectionComplete = true;
      return;
    }

    if (pageData?.pageData?.isGHLPage) {
      // GHL detected but no specific data - continue trying but also send partial
      console.log('[GHL Cloner] GHL page detected, continuing to look for data...');
      sendMessage('NUXT_DATA', pageData);
    }

    // Schedule next attempt
    detectionAttempt++;
    if (detectionAttempt < RETRY_DELAYS.length) {
      const nextDelay = RETRY_DELAYS[detectionAttempt] - (RETRY_DELAYS[detectionAttempt - 1] || 0);
      setTimeout(attemptDetection, nextDelay);
    } else {
      console.log('[GHL Cloner] Detection complete after all retries');
      detectionComplete = true;

      // Final attempt - send whatever we have
      if (pageData) {
        sendMessage('NUXT_DATA', pageData);
      }
    }
  }

  // Start detection
  attemptDetection();

  // ============================================
  // MESSAGE LISTENER
  // ============================================

  window.addEventListener('message', async (event) => {
    if (event.data?.from !== 'GHLClonerContent') return;

    const { type, payload, callbackId } = event.data;
    console.log('[GHL Cloner] Received message:', type);

    switch (type) {
      case 'PASTE_PAGE':
        await handlePaste(payload, callbackId);
        break;

      case 'CHECK_BUILDER':
        const revex = getRevexService();
        const urlInfo = parseBuilderUrl(window.location.href);
        sendResponse(callbackId, {
          isBuilder: !!revex && !!urlInfo,
          urlInfo
        });
        break;

      case 'REDETECT':
        // Force re-detection
        detectionComplete = false;
        detectionAttempt = 0;
        attemptDetection();
        break;
    }
  });

  console.log('[GHL Cloner] Inject script ready');
})();
