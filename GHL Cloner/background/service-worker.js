// GHL Page Cloner - Background Service Worker
// Mimics Super Cloner's architecture - storage handled here, not in content script

let lastPageData = null;
let copiedPageData = null;

// Update badge for a tab (Super Cloner pattern - with tab validation)
async function updateBadge(hasData, tabId) {
  if (!tabId) {
    if (hasData) {
      chrome.action.setBadgeText({ text: '✓' });
      chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
    return;
  }

  try {
    await chrome.tabs.get(tabId);
    if (hasData) {
      chrome.action.setBadgeText({ text: '✓', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#22c55e', tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  } catch (e) {
    // Tab doesn't exist
  }
}

// Clean up old tab data (Super Cloner pattern)
async function cleanupOldTabData() {
  try {
    const stored = await chrome.storage.local.get(null);
    const tabKeys = Object.keys(stored).filter(k => k.startsWith('tab_'));
    if (tabKeys.length === 0) return;

    const tabs = await chrome.tabs.query({});
    const activeTabIds = new Set(tabs.map(t => `tab_${t.id}`));
    const keysToRemove = tabKeys.filter(k => !activeTabIds.has(k));

    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
    }
  } catch (e) {
    // Ignore
  }
}

// Run cleanup on start and periodically
cleanupOldTabData();
setInterval(cleanupOldTabData, 5 * 60 * 1000);

// Update badge for active tab
async function updateBadgeForActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    const storageKey = `tab_${tab.id}`;
    const stored = await chrome.storage.local.get([storageKey]);
    const hasData = !!stored[storageKey];
    updateBadge(hasData, tab.id);
  } catch (e) {
    // Ignore
  }
}

// Message handler (Super Cloner pattern)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const type = message.type;
  const from = message.from;
  const payload = message.payload;

  // Forward popup messages to content script
  if (from === 'Popup') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, { type, payload, from }, (response) => {
          sendResponse(response);
        });
      }
    });
    return true;
  }

  // Handle NUXT_DATA from inject script (via content script)
  // This is where storage happens - NOT in content script (Super Cloner pattern)
  if (from === 'GHLClonerInject' && type === 'NUXT_DATA') {
    lastPageData = payload;

    if (payload) {
      const tabId = sender.tab?.id;
      if (tabId) {
        chrome.storage.local.set({ [`tab_${tabId}`]: payload, lastPageData: payload }, () => {
          updateBadge(true, tabId);
        });
      }
    } else {
      const tabId = sender.tab?.id;
      if (tabId) {
        chrome.storage.local.remove(`tab_${tabId}`, () => {
          updateBadge(false, tabId);
        });
      }
    }
    return false;
  }

  // Get stored page info for popup
  if (from === 'POPUP_GET_INFO') {
    sendResponse({ data: copiedPageData });
    return true;
  }

  // Store copied page info
  if (from === 'POPUP_COPY_INFO') {
    copiedPageData = payload;
    return false;
  }

  // Return tab ID to content script (legacy support)
  if (type === 'GET_TAB_ID') {
    sendResponse({ tabId: sender.tab?.id || 0 });
    return false;
  }

  // Update badge (legacy support)
  if (type === 'UPDATE_BADGE') {
    const tabId = sender.tab?.id || message.tabId;
    updateBadge(message.hasData, tabId);
    return false;
  }

  return false;
});

// Handle tab removal - clean up storage (Super Cloner pattern)
chrome.tabs.onRemoved.addListener((tabId) => {
  if (!tabId) return;
  const storageKey = `tab_${tabId}`;
  chrome.storage.local.remove(storageKey, () => {
    if (!chrome.runtime.lastError) {
      updateBadgeForActiveTab();
    }
  });
});

// Handle tab activation - update badge (Super Cloner pattern)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!activeInfo?.tabId) return;

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab) return;

    const storageKey = `tab_${activeInfo.tabId}`;
    chrome.storage.local.get([storageKey], (stored) => {
      if (chrome.runtime.lastError) return;

      const hasData = !!stored[storageKey];
      updateBadge(hasData, activeInfo.tabId);

      // Trigger re-detection in content script
      chrome.tabs.sendMessage(activeInfo.tabId, { type: 'CHECK_NUXT_APP', from: 'Background' }, () => {
        // Just access lastError to clear it
        chrome.runtime.lastError;
      });
    });
  } catch (e) {
    // Tab doesn't exist
  }
});

// Handle tab updates (Super Cloner pattern - with retries)
const updateTimeouts = new Map();

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const storageKey = `tab_${tabId}`;

  if (changeInfo.status === 'complete') {
    try {
      if (!tab) return;

      const checkBadge = () => {
        chrome.storage.local.get([storageKey], (stored) => {
          if (chrome.runtime.lastError) return;
          const hasData = !!stored[storageKey];
          updateBadge(hasData, tabId);
        });
      };

      // Clear existing timeouts for this tab
      const existing = updateTimeouts.get(tabId);
      if (existing) {
        existing.forEach(t => clearTimeout(t));
      }

      // Check immediately and with delays (Super Cloner pattern)
      checkBadge();
      const timeouts = [
        setTimeout(checkBadge, 150),
        setTimeout(checkBadge, 400),
        setTimeout(checkBadge, 700),
        setTimeout(checkBadge, 1100)
      ];
      updateTimeouts.set(tabId, timeouts);

      // Cleanup after all checks
      setTimeout(() => {
        updateTimeouts.delete(tabId);
      }, 1200);
    } catch (e) {
      // Ignore
    }
  }
});
