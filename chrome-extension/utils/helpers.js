// GHL Page Cloner - Utility Functions

/**
 * Storage Manager - Handles Chrome storage operations
 */
export class StorageManager {
  static async get(keys) {
    return chrome.storage.local.get(keys);
  }

  static async set(data) {
    return chrome.storage.local.set(data);
  }

  static async remove(keys) {
    return chrome.storage.local.remove(keys);
  }

  static async clear() {
    return chrome.storage.local.clear();
  }

  static async getPageData() {
    const result = await this.get('copiedPageData');
    return result.copiedPageData || null;
  }

  static async setPageData(data) {
    return this.set({ 
      copiedPageData: data,
      lastCopyTime: Date.now()
    });
  }

  static async clearPageData() {
    return this.remove(['copiedPageData', 'lastCopyTime']);
  }
}

/**
 * Message Broker - Handles inter-script communication
 */
export class MessageBroker {
  static async sendToBackground(action, data = {}) {
    return chrome.runtime.sendMessage({ action, data });
  }

  static async sendToTab(tabId, action, data = {}) {
    return chrome.tabs.sendMessage(tabId, { action, data });
  }

  static async sendToActiveTab(action, data = {}) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active tab');
    return this.sendToTab(tab.id, action, data);
  }

  static onMessage(callback) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const result = callback(message, sender);
      if (result instanceof Promise) {
        result.then(sendResponse);
        return true;
      }
      sendResponse(result);
    });
  }
}

/**
 * DOM Utils - Helper functions for DOM manipulation
 */
export class DOMUtils {
  static waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const el = document.querySelector(selector);
        if (el) {
          obs.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  static waitForDOMStable(timeout = 5000, debounce = 500) {
    return new Promise((resolve) => {
      let timer;
      let timeoutTimer;

      const observer = new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          observer.disconnect();
          clearTimeout(timeoutTimer);
          resolve();
        }, debounce);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });

      timeoutTimer = setTimeout(() => {
        observer.disconnect();
        resolve();
      }, timeout);

      // Initial trigger
      timer = setTimeout(() => {
        observer.disconnect();
        clearTimeout(timeoutTimer);
        resolve();
      }, debounce);
    });
  }

  static getComputedStyles(element, properties) {
    const computed = window.getComputedStyle(element);
    const styles = {};
    for (const prop of properties) {
      styles[prop] = computed.getPropertyValue(prop);
    }
    return styles;
  }

  static getAllStyles(element) {
    const computed = window.getComputedStyle(element);
    const styles = {};
    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      styles[prop] = computed.getPropertyValue(prop);
    }
    return styles;
  }
}

/**
 * Data Transformer - Converts between data formats
 */
export class DataTransformer {
  static toGHLFormat(extractedData) {
    // Transform our extracted format to GHL's internal format
    // This is a placeholder - actual implementation needs reverse engineering
    return {
      version: '2.0',
      type: 'page',
      data: extractedData
    };
  }

  static fromGHLFormat(ghlData) {
    // Transform GHL's internal format to our format
    return ghlData.data || ghlData;
  }

  static sanitizeHTML(html) {
    // Remove potentially dangerous elements
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove scripts
    temp.querySelectorAll('script').forEach(el => el.remove());
    
    // Remove event handlers
    temp.querySelectorAll('*').forEach(el => {
      for (const attr of [...el.attributes]) {
        if (attr.name.startsWith('on')) {
          el.removeAttribute(attr.name);
        }
      }
    });
    
    return temp.innerHTML;
  }

  static countElements(data) {
    let count = 0;
    
    if (data?.content?.sections) {
      for (const section of data.content.sections) {
        count++; // Count section
        if (section.rows) {
          for (const row of section.rows) {
            if (row.columns) {
              for (const col of row.columns) {
                if (col.elements) {
                  count += col.elements.length;
                }
              }
            }
          }
        }
      }
    }
    
    return count;
  }
}

/**
 * Logger - Consistent logging utility
 */
export class Logger {
  static prefix = '[GHL Cloner]';
  
  static log(...args) {
    console.log(this.prefix, ...args);
  }

  static warn(...args) {
    console.warn(this.prefix, ...args);
  }

  static error(...args) {
    console.error(this.prefix, ...args);
  }

  static debug(...args) {
    if (process?.env?.NODE_ENV === 'development') {
      console.debug(this.prefix, ...args);
    }
  }
}

/**
 * URL Utils - URL parsing and matching
 */
export class URLUtils {
  static isGHLDomain(url) {
    const ghlDomains = [
      'gohighlevel.com',
      'highlevel.com',
      'msgsndr.com',
      'leadconnectorhq.com'
    ];
    
    try {
      const urlObj = new URL(url);
      return ghlDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  }

  static isBuilderUrl(url) {
    const builderPatterns = [
      /\/builder\//i,
      /\/funnels\/.*\/builder/i,
      /\/websites\/.*\/builder/i,
      /\/funnel\/.*\/edit/i,
      /\/website\/.*\/edit/i
    ];
    
    return builderPatterns.some(pattern => pattern.test(url));
  }

  static extractPageId(url) {
    const uuidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;
    const match = url.match(uuidPattern);
    return match ? match[0] : null;
  }
}
