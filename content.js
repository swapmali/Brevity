/**
 * Brevity - Content Script
 * Main orchestrator that runs on supported websites.
 * Detects descriptions, requests summaries, and displays overlays.
 */

(function () {
  'use strict';

  const PROCESSED = BREVITY_CONFIG.CSS_CLASS_NAMES.processed;

  let currentSite = null;
  let hoverTimer = null;

  /**
   * Initialize the extension on the current page.
   */
  function init() {
    currentSite = BrevityUtils.detectCurrentSite();
    if (!currentSite) return;

    scanAndAttach();

    BrevityDOMObserver.start(scanAndAttach);
    BrevityDOMObserver.listenForNavigation(scanAndAttach);
  }

  /**
   * Scan the page for description elements and attach hover listeners.
   */
  function scanAndAttach() {
    if (!currentSite) return;

    for (const selector of currentSite.selectors) {
      const elements = BrevityUtils.safeDOMQueryAll(selector);

      for (const el of elements) {
        if (el.classList.contains(PROCESSED)) continue;

        const text = BrevityUtils.extractText(el);
        if (!BrevityUtils.isWorthSummarizing(text)) continue;

        el.classList.add(PROCESSED);
        attachHoverListeners(el);
      }
    }
  }

  /**
   * Attach mouseenter/mouseleave handlers to a description element.
   */
  function attachHoverListeners(element) {
    element.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimer);
      BrevityOverlay.cancelHide();

      hoverTimer = setTimeout(() => {
        handleHover(element);
      }, BREVITY_CONFIG.HOVER_DELAY);
    });

    element.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
      BrevityOverlay.scheduleHide();
    });
  }

  /**
   * Handle the hover event: extract text, request summary, show overlay.
   */
  async function handleHover(element) {
    const text = BrevityUtils.extractText(element);
    if (!BrevityUtils.isWorthSummarizing(text)) return;

    const cacheKey = BrevityUtils.generateCacheKey(text);

    BrevityOverlay.show(element, '', true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_SUMMARY',
        text,
        cacheKey,
      });

      if (response && response.summary) {
        BrevityOverlay.update(response.summary);
      } else if (response && response.error) {
        BrevityOverlay.showError(response.error);
      } else {
        BrevityOverlay.showError('Could not generate summary.');
      }
    } catch (error) {
      console.warn('[Brevity] Message error:', error.message);
      BrevityOverlay.showError('Extension error. Try again.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
