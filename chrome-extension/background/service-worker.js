// GHL Page Cloner - Background Service Worker

console.log('[GHL Cloner] Background service worker started');

// Update badge for a tab
async function updateBadge(tabId, hasData) {
  try {
    if (hasData) {
      await chrome.action.setBadgeText({ text: '✓', tabId });
      await chrome.action.setBadgeBackgroundColor({ color: '#22c55e', tabId });
    } else {
      await chrome.action.setBadgeText({ text: '', tabId });
    }
  } catch (e) {
    // Tab might be closed
  }
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type } = message;
  
  // Return tab ID to content script
  if (type === 'GET_TAB_ID') {
    sendResponse({ tabId: sender.tab?.id });
    return;
  }
  
  // Update badge
  if (type === 'UPDATE_BADGE') {
    const tabId = sender.tab?.id;
    if (tabId) {
      updateBadge(tabId, message.hasData);
    }
    return;
  }
});

// Handle tab removal - clean up storage
chrome.tabs.onRemoved.addListener(async (tabId) => {
  try {
    const storageKey = `tab_${tabId}`;
    await chrome.storage.local.remove([storageKey]);
  } catch (e) {
    // Ignore
  }
});

// Handle tab activation - update badge based on storage
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const storageKey = `tab_${tabId}`;
    const stored = await chrome.storage.local.get([storageKey]);
    updateBadge(tabId, !!stored[storageKey]);
  } catch (e) {
    // Ignore
  }
});
