// GHL Page Cloner - Popup Script
// Using Supabase Edge Functions

(function() {
  'use strict';

  // Supabase Edge Functions URL and Anon Key
  const SUPABASE_URL = 'https://yayykhctnywepnvalivp.supabase.co/functions/v1';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXlraGN0bnl3ZXBudmFsaXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMzY4MjQsImV4cCI6MjA3OTkxMjgyNH0.L4c1b0Uijq115pqjV5Wb7l33VpTlHAm1PZQciWkrXNQ';

  // State
  let user = null;
  let copiedData = null;
  let currentTabData = null;
  let isOnBuilderPage = false;

  // DOM Elements - License Screen
  const licenseScreen = document.getElementById('licenseScreen');
  const mainScreen = document.getElementById('mainScreen');
  const licenseInput = document.getElementById('licenseInput');
  const activateBtn = document.getElementById('activateBtn');
  const licenseError = document.getElementById('licenseError');

  // DOM Elements - Main Screen
  const statusEl = document.getElementById('status');
  const copyBtn = document.getElementById('copyBtn');
  const pasteBtn = document.getElementById('pasteBtn');
  const copyStatus = document.getElementById('copyStatus');
  const pasteStatus = document.getElementById('pasteStatus');
  const creditsCount = document.getElementById('creditsCount');
  const logoutBtn = document.getElementById('logoutBtn');

  // ============================================
  // API FUNCTIONS (Supabase Edge Functions)
  // ============================================

  async function apiGet(functionName, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${SUPABASE_URL}/${functionName}${queryString ? '?' + queryString : ''}`;
    console.log('[DEBUG] apiGet:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    console.log('[DEBUG] Response status:', response.status);
    const data = await response.json();
    console.log('[DEBUG] Response:', data);
    return data;
  }

  async function apiPost(functionName, data) {
    const url = `${SUPABASE_URL}/${functionName}`;
    console.log('[DEBUG] apiPost:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(data)
    });
    console.log('[DEBUG] Response status:', response.status);
    const result = await response.json();
    console.log('[DEBUG] Response:', result);
    return result;
  }

  // ============================================
  // LICENSE MANAGEMENT
  // ============================================

  async function validateLicense(licenseKey) {
    console.log('[DEBUG] validateLicense called with:', licenseKey);
    try {
      const data = await apiGet('validate-license', { license_key: licenseKey });

      if (data.valid && data.user) {
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Invalid or inactive license key' };
    } catch (error) {
      console.error('[DEBUG] License validation error:', error.message, error);
      return { success: false, error: 'Connection error. Please try again.' };
    }
  }

  async function refreshUserData() {
    if (!user?.license_key) return;

    try {
      const data = await apiGet('check-credits', { license_key: user.license_key });
      if (data.credits !== undefined) {
        user.credits = data.credits;
        user.status = data.status;
        await chrome.storage.local.set({ user });
        updateCreditsDisplay();
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }

  async function useCredit(funnelId, stepId) {
    if (!user?.license_key) return { success: false, error: 'Not logged in' };

    try {
      const data = await apiPost('use-credit', {
        license_key: user.license_key,
        funnel_id: funnelId,
        step_id: stepId
      });

      if (data.success) {
        user.credits = data.remaining_credits;
        await chrome.storage.local.set({ user });
        updateCreditsDisplay();
        return { success: true, remaining_credits: data.remaining_credits };
      }

      return { success: false, error: data.error || 'Failed to use credit' };
    } catch (error) {
      console.error('Use credit error:', error);
      return { success: false, error: 'Connection error' };
    }
  }

  // ============================================
  // UI MANAGEMENT
  // ============================================

  function showLicenseScreen() {
    licenseScreen.style.display = 'block';
    mainScreen.style.display = 'none';
  }

  function showMainScreen() {
    licenseScreen.style.display = 'none';
    mainScreen.style.display = 'block';
    updateCreditsDisplay();
    updateMainUI();
  }

  function updateCreditsDisplay() {
    if (creditsCount) {
      creditsCount.textContent = user?.credits || 0;
    }
  }

  function updateMainUI() {
    const pd = currentTabData?.pageData;

    // Copy section - Handle different detection states
    if (pd) {
      if (pd.funnelId && pd.stepId) {
        // Full data - completely ready
        copyBtn.disabled = false;
        copyStatus.textContent = 'Page ready to copy';
        copyStatus.className = 'status-text success';
      } else if (pd.funnelId) {
        // Has funnel ID but missing step ID - might still work
        copyBtn.disabled = false;
        copyStatus.textContent = 'Funnel detected - ready to copy';
        copyStatus.className = 'status-text success';
      } else if (pd.isGHLPage) {
        // GHL page detected but no specific IDs yet
        // Still allow copy - the data might be in the page
        copyBtn.disabled = false;
        copyStatus.textContent = 'GHL page detected - click to copy';
        copyStatus.className = 'status-text warning';
      } else {
        // Some page data but not recognized as GHL
        copyBtn.disabled = true;
        copyStatus.textContent = 'Page data found but not GHL';
        copyStatus.className = 'status-text';
      }
    } else {
      copyBtn.disabled = true;
      copyStatus.textContent = 'Navigate to a GHL funnel/website';
      copyStatus.className = 'status-text';
    }

    // Paste section
    const hasCredits = (user?.credits || 0) > 0;
    const hasCopiedFunnelId = copiedData?.pageData?.funnelId;

    if (!copiedData) {
      pasteBtn.disabled = true;
      pasteStatus.textContent = 'No page copied yet';
      pasteStatus.className = 'status-text';
    } else if (!hasCopiedFunnelId) {
      pasteBtn.disabled = true;
      pasteStatus.textContent = 'Copied page missing funnel ID';
      pasteStatus.className = 'status-text error';
    } else if (!isOnBuilderPage) {
      pasteBtn.disabled = true;
      pasteStatus.textContent = 'Open GHL page builder to paste';
      pasteStatus.className = 'status-text';
    } else if (!hasCredits) {
      pasteBtn.disabled = true;
      pasteStatus.textContent = 'No credits remaining';
      pasteStatus.className = 'status-text error';
    } else {
      pasteBtn.disabled = false;
      pasteStatus.textContent = 'Ready to paste (uses 1 credit)';
      pasteStatus.className = 'status-text success';
    }
  }

  function showMessage(text, type) {
    statusEl.textContent = text;
    statusEl.className = 'status-message ' + type;
    statusEl.style.display = 'block';

    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 4000);
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================

  async function handleActivate() {
    const licenseKey = licenseInput.value.trim().toUpperCase();

    if (!licenseKey) {
      licenseError.textContent = 'Please enter a license key';
      return;
    }

    activateBtn.disabled = true;
    activateBtn.textContent = 'Validating...';
    licenseError.textContent = '';

    const result = await validateLicense(licenseKey);

    if (result.success) {
      user = { ...result.user, license_key: licenseKey };
      await chrome.storage.local.set({ user });
      showMainScreen();
      await checkCurrentTab();
    } else {
      licenseError.textContent = result.error;
      activateBtn.disabled = false;
      activateBtn.textContent = 'Activate License';
    }
  }

  async function handleLogout() {
    user = null;
    await chrome.storage.local.remove(['user']);
    licenseInput.value = '';
    licenseError.textContent = '';
    showLicenseScreen();
  }

  async function handleCopy() {
    if (!currentTabData?.pageData) {
      showMessage('No page data found', 'error');
      return;
    }

    // Check if we have the required data
    const pd = currentTabData.pageData;
    if (!pd.funnelId && !pd.isGHLPage) {
      showMessage('Could not detect GHL page data', 'error');
      return;
    }

    // If we only have isGHLPage flag but no funnelId, warn user
    if (!pd.funnelId) {
      showMessage('Warning: Could not find funnel ID. Paste may not work.', 'warning');
    }

    copyBtn.disabled = true;
    copyBtn.textContent = 'Copying...';

    try {
      await chrome.storage.local.set({ copiedPageData: currentTabData });
      copiedData = currentTabData;

      copyBtn.textContent = '✓ Copied!';

      if (pd.funnelId) {
        copyStatus.textContent = `Copied funnel: ${pd.funnelId.substring(0, 8)}...`;
      } else {
        copyStatus.textContent = 'Page copied (partial data)';
      }
      copyStatus.className = 'status-text success';

      showMessage('Page copied successfully!', 'success');

      setTimeout(() => {
        copyBtn.textContent = 'Copy This Page';
        copyBtn.disabled = false;
        updateMainUI();
      }, 2000);

    } catch (e) {
      console.error('Copy error:', e);
      showMessage('Failed to copy: ' + e.message, 'error');
      copyBtn.textContent = 'Copy This Page';
      copyBtn.disabled = false;
    }
  }

  async function handlePaste() {
    if (!copiedData) {
      showMessage('No page copied yet', 'error');
      return;
    }

    if (!copiedData.pageData?.funnelId) {
      showMessage('Copied page is missing funnel ID - cannot paste', 'error');
      return;
    }

    if (!isOnBuilderPage) {
      showMessage('Open GHL page builder first', 'error');
      return;
    }

    if ((user?.credits || 0) <= 0) {
      showMessage('No credits remaining. Purchase more to continue.', 'error');
      return;
    }

    pasteBtn.disabled = true;
    pasteBtn.textContent = 'Pasting...';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Send paste command to content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        from: 'Popup',
        type: 'PASTE_PAGE',
        payload: copiedData
      });

      console.log('Paste response:', response);

      if (response?.success) {
        // Deduct credit via Supabase
        const creditResult = await useCredit(
          copiedData.pageData?.funnelId,
          copiedData.pageData?.stepId
        );

        if (!creditResult.success) {
          console.warn('Credit deduction failed:', creditResult.error);
        }

        pasteBtn.textContent = '✓ Pasted!';
        pasteStatus.textContent = 'Page pasted successfully!';
        pasteStatus.className = 'status-text success';
        showMessage('Page pasted! Builder will reload.', 'success');

        // Close popup after short delay
        setTimeout(() => window.close(), 2000);

      } else {
        throw new Error(response?.error || 'Paste failed');
      }

    } catch (e) {
      console.error('Paste error:', e);
      showMessage('Failed to paste: ' + e.message, 'error');
      pasteBtn.textContent = 'Paste to Builder';
      pasteBtn.disabled = false;
      pasteStatus.textContent = 'Paste failed - try again';
      pasteStatus.className = 'status-text error';
    }
  }

  // Format license key input
  function formatLicenseKey(value) {
    let cleaned = value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();

    if (cleaned.startsWith('GHLC') && cleaned.length > 4 && cleaned[4] !== '-') {
      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
    }
    if (cleaned.length > 9 && cleaned[9] !== '-') {
      cleaned = cleaned.slice(0, 9) + '-' + cleaned.slice(9);
    }
    if (cleaned.length > 14 && cleaned[14] !== '-') {
      cleaned = cleaned.slice(0, 14) + '-' + cleaned.slice(14);
    }

    return cleaned.slice(0, 19);
  }

  // ============================================
  // TAB DATA MANAGEMENT
  // ============================================

  async function checkCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      const url = tab.url || '';

      isOnBuilderPage = url.includes('page-builder') ||
                        url.includes('/builder/') ||
                        (url.includes('location/') && url.includes('/funnels/'));

      const storageKey = `tab_${tab.id}`;
      const stored = await chrome.storage.local.get([storageKey, 'lastPageData', 'copiedPageData']);

      console.log('[DEBUG] Storage data:', stored);

      if (stored[storageKey]) {
        currentTabData = stored[storageKey];
        console.log('[DEBUG] Found tab-specific data:', currentTabData);
      } else if (stored.lastPageData) {
        currentTabData = stored.lastPageData;
        console.log('[DEBUG] Using lastPageData:', currentTabData);
      }

      if (stored.copiedPageData) {
        copiedData = stored.copiedPageData;
      }

      updateMainUI();

      // If no data found, try to trigger re-detection
      if (!currentTabData?.pageData) {
        console.log('[DEBUG] No page data found, requesting re-detection');
        try {
          await chrome.tabs.sendMessage(tab.id, {
            from: 'Popup',
            type: 'REDETECT'
          });
          // Check again after a short delay
          setTimeout(async () => {
            const refreshed = await chrome.storage.local.get([storageKey, 'lastPageData']);
            if (refreshed[storageKey]) {
              currentTabData = refreshed[storageKey];
            } else if (refreshed.lastPageData) {
              currentTabData = refreshed.lastPageData;
            }
            updateMainUI();
          }, 1500);
        } catch (e) {
          console.log('[DEBUG] Could not send redetect message:', e.message);
        }
      }
    } catch (e) {
      console.error('Check tab error:', e);
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  async function init() {
    console.log('[DEBUG] GHL Cloner popup initialized');
    console.log('[DEBUG] Using Supabase Edge Functions:', SUPABASE_URL);

    // Set up event listeners
    activateBtn.addEventListener('click', handleActivate);
    logoutBtn.addEventListener('click', handleLogout);
    copyBtn.addEventListener('click', handleCopy);
    pasteBtn.addEventListener('click', handlePaste);

    licenseInput.addEventListener('input', (e) => {
      e.target.value = formatLicenseKey(e.target.value);
    });

    licenseInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleActivate();
    });

    // Load saved user
    const stored = await chrome.storage.local.get(['user']);

    if (stored.user?.license_key) {
      user = stored.user;
      showMainScreen();
      await refreshUserData();
      await checkCurrentTab();
    } else {
      showLicenseScreen();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
