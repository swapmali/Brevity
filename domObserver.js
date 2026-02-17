/**
 * Brevity - DOM Observer
 * Watches for dynamically added description elements using MutationObserver.
 */

const BrevityDOMObserver = {
  _observer: null,
  _scanCallback: null,
  _debouncedScan: null,

  /**
   * Start observing the DOM for changes.
   * @param {Function} scanCallback - called when new content is detected
   */
  start(scanCallback) {
    if (this._observer) {
      this.stop();
    }

    this._scanCallback = scanCallback;
    this._debouncedScan = BrevityUtils.debounce(() => {
      this._scanCallback();
    }, BREVITY_CONFIG.DEBOUNCE_DELAY);

    this._observer = new MutationObserver((mutations) => {
      let hasRelevantChanges = false;

      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              hasRelevantChanges = true;
              break;
            }
          }
        }

        if (hasRelevantChanges) break;

        if (
          mutation.type === 'attributes' &&
          mutation.target.nodeType === Node.ELEMENT_NODE
        ) {
          hasRelevantChanges = true;
        }
      }

      if (hasRelevantChanges) {
        this._debouncedScan();
      }
    });

    this._observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-uia'],
    });
  },

  /**
   * Stop observing.
   */
  stop() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  },

  /**
   * Listen for SPA navigation events (popstate, hashchange).
   * Triggers a fresh scan after navigation.
   */
  listenForNavigation(scanCallback) {
    const debouncedNav = BrevityUtils.debounce(() => {
      scanCallback();
    }, BREVITY_CONFIG.DEBOUNCE_DELAY);

    window.addEventListener('popstate', debouncedNav);
    window.addEventListener('hashchange', debouncedNav);

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      debouncedNav();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      debouncedNav();
    };
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrevityDOMObserver;
}
