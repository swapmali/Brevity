/**
 * Brevity - Utility Functions
 * Shared helpers used across content scripts.
 */

const BrevityUtils = {
  /**
   * Normalize text by collapsing whitespace, trimming, and removing
   * non-printable characters.
   */
  normalizeText(text) {
    if (typeof text !== 'string') return '';
    return text
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/[^\x20-\x7E\u00A0-\u024F\u1E00-\u1EFF]/g, '')
      .trim();
  },

  /**
   * Generate a deterministic cache key from description text.
   * Uses a simple but effective DJB2 hash for speed.
   */
  generateCacheKey(text) {
    const normalized = this.normalizeText(text).toLowerCase().slice(0, 500);
    let hash = 5381;
    for (let i = 0; i < normalized.length; i++) {
      hash = ((hash << 5) + hash + normalized.charCodeAt(i)) >>> 0;
    }
    return `brevity_${hash.toString(36)}`;
  },

  /**
   * Debounce a function call. Returns a wrapper that delays invocation
   * until `delay` ms have passed since the last call.
   */
  debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Safely query the DOM. Returns null instead of throwing if the
   * selector is invalid or the parent is not a valid node.
   */
  safeDOMQuery(selector, parent = document) {
    try {
      if (!parent || typeof parent.querySelector !== 'function') return null;
      return parent.querySelector(selector);
    } catch {
      return null;
    }
  },

  /**
   * Safely query all matching elements.
   */
  safeDOMQueryAll(selector, parent = document) {
    try {
      if (!parent || typeof parent.querySelectorAll !== 'function') return [];
      return Array.from(parent.querySelectorAll(selector));
    } catch {
      return [];
    }
  },

  /**
   * Detect which supported site we are currently on.
   * Returns the site config object or null.
   */
  detectCurrentSite() {
    const hostname = window.location.hostname;
    for (const [key, site] of Object.entries(BREVITY_CONFIG.SUPPORTED_SITES)) {
      if (hostname === site.hostname || hostname.endsWith('.' + site.hostname)) {
        return { key, ...site };
      }
    }
    return null;
  },

  /**
   * Extract visible text content from an element, ignoring hidden children.
   */
  extractText(element) {
    if (!element) return '';
    const text = element.innerText || element.textContent || '';
    return this.normalizeText(text);
  },

  /**
   * Check if text is long enough to be worth summarizing.
   */
  isWorthSummarizing(text) {
    return (
      typeof text === 'string' &&
      text.length >= BREVITY_CONFIG.MIN_DESCRIPTION_LENGTH
    );
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrevityUtils;
}
