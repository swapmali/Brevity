/**
 * Brevity - Cache Layer
 * Manages summary caching using chrome.storage.local with TTL expiration.
 */

const BrevityCache = {
  /**
   * Retrieve a cached summary. Returns null if not found or expired.
   */
  async getSummary(cacheKey) {
    try {
      const result = await chrome.storage.local.get(cacheKey);
      const entry = result[cacheKey];

      if (!entry || !entry.summary || !entry.timestamp) {
        return null;
      }

      const age = Date.now() - entry.timestamp;
      if (age > BREVITY_CONFIG.CACHE_DURATION) {
        await chrome.storage.local.remove(cacheKey);
        return null;
      }

      return entry.summary;
    } catch (error) {
      console.warn('[Brevity] Cache read error:', error.message);
      return null;
    }
  },

  /**
   * Store a summary in cache with a timestamp.
   */
  async setSummary(cacheKey, summary) {
    try {
      await chrome.storage.local.set({
        [cacheKey]: {
          summary,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      console.warn('[Brevity] Cache write error:', error.message);
    }
  },

  /**
   * Remove expired entries to keep storage lean.
   * Called periodically from the background script.
   */
  async pruneExpired() {
    try {
      const all = await chrome.storage.local.get(null);
      const keysToRemove = [];
      const now = Date.now();

      for (const [key, value] of Object.entries(all)) {
        if (
          key.startsWith('brevity_') &&
          value &&
          value.timestamp &&
          now - value.timestamp > BREVITY_CONFIG.CACHE_DURATION
        ) {
          keysToRemove.push(key);
        }
      }

      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
      }

      return keysToRemove.length;
    } catch (error) {
      console.warn('[Brevity] Cache prune error:', error.message);
      return 0;
    }
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrevityCache;
}
