/* ==========================================================================
   SoundScape Studio - Unified Storage Wrapper
   Enables dual-compatibility: standard Web (localStorage) & Chrome Extension (chrome.storage)
   ========================================================================== */

const focusStorage = {
  // Get item asynchronously
  async get(key, defaultValue = null) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(key, (result) => {
          if (result && result[key] !== undefined) {
            resolve(result[key]);
          } else {
            resolve(defaultValue);
          }
        });
      } else {
        const value = localStorage.getItem(key);
        if (value !== null) {
          try {
            // Attempt to parse if it's JSON
            resolve(JSON.parse(value));
          } catch (e) {
            resolve(value); // Return raw string if not JSON
          }
        } else {
          resolve(defaultValue);
        }
      }
    });
  },

  // Set item
  async set(key, value) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [key]: value }, () => {
          resolve();
        });
      } else {
        const stringified = typeof value === 'object' ? JSON.stringify(value) : value;
        localStorage.setItem(key, stringified);
        resolve();
      }
    });
  }
};

// Expose to window
window.focusStorage = focusStorage;
