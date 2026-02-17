/**
 * Brevity - Background Service Worker
 * Handles summary requests, caching, and API calls securely.
 */

importScripts('constants.js', 'config.js', 'cache.js', 'api.js');

/**
 * Track in-flight requests to prevent duplicate concurrent API calls.
 * Maps cacheKey -> Promise<summary>
 */
const pendingRequests = new Map();

/**
 * Handle messages from content scripts.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SUMMARY') {
    handleSummaryRequest(message)
      .then(sendResponse)
      .catch((error) => {
        console.error('[Brevity] Background error:', error.message);
        sendResponse({ error: error.message });
      });

    return true;
  }

  if (message.type === 'GET_KEY_SOURCE') {
    const hasConfigKey =
      typeof BREVITY_LOCAL_CONFIG !== 'undefined' &&
      BREVITY_LOCAL_CONFIG.OPENAI_API_KEY &&
      BREVITY_LOCAL_CONFIG.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY_HERE';

    sendResponse({ source: hasConfigKey ? 'config' : 'storage' });
    return false;
  }
});

/**
 * Process a summary request:
 * 1. Check cache
 * 2. Deduplicate concurrent requests
 * 3. Call API if needed
 * 4. Store in cache
 */
async function handleSummaryRequest({ text, cacheKey }) {
  const cached = await BrevityCache.getSummary(cacheKey);
  if (cached) {
    return { summary: cached, source: 'cache' };
  }

  if (pendingRequests.has(cacheKey)) {
    const summary = await pendingRequests.get(cacheKey);
    return { summary, source: 'deduplicated' };
  }

  const requestPromise = (async () => {
    try {
      const summary = await BrevityAPI.generateSummary(text);
      await BrevityCache.setSummary(cacheKey, summary);
      return summary;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, requestPromise);

  const summary = await requestPromise;
  return { summary, source: 'api' };
}

/**
 * Prune expired cache entries when the extension starts
 * and periodically via alarms.
 */
chrome.runtime.onInstalled.addListener(() => {
  BrevityCache.pruneExpired();

  chrome.alarms.create('brevity-cache-prune', {
    periodInMinutes: 1440, // once per day
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'brevity-cache-prune') {
    BrevityCache.pruneExpired();
  }
});
