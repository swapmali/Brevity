/**
 * Brevity - Popup Script
 * Handles API key configuration and displays cache stats.
 */

(function () {
  'use strict';

  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const toggleKey = document.getElementById('toggleKey');
  const statusEl = document.getElementById('status');
  const cacheCountEl = document.getElementById('cacheCount');
  const cacheStatusEl = document.getElementById('cacheStatus');
  const clearCacheBtn = document.getElementById('clearCache');

  /**
   * Load existing API key and cache stats on popup open.
   */
  async function init() {
    await loadApiKey();
    await loadCacheStats();
  }

  /**
   * Load saved API key into the input field (masked).
   * Also check if config.js has a key set (file-based config takes priority).
   */
  async function loadApiKey() {
    try {
      const bgResponse = await chrome.runtime.sendMessage({ type: 'GET_KEY_SOURCE' });

      if (bgResponse && bgResponse.source === 'config') {
        apiKeyInput.placeholder = 'Set via config.js';
        apiKeyInput.disabled = true;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Using config.js';
        showStatus('API key loaded from config.js (git-ignored).', 'success');
        return;
      }

      const result = await chrome.storage.sync.get('brevity_api_key');
      const key = result.brevity_api_key;

      if (key) {
        apiKeyInput.value = key;
        showStatus('API key is configured.', 'success');
      } else {
        showStatus('No API key set. Enter your key below or add it to config.js.', 'info');
      }
    } catch (error) {
      showStatus('Could not load settings.', 'error');
    }
  }

  /**
   * Count cached summaries and display stats.
   */
  async function loadCacheStats() {
    try {
      const all = await chrome.storage.local.get(null);
      let count = 0;

      for (const key of Object.keys(all)) {
        if (key.startsWith('brevity_')) {
          count++;
        }
      }

      cacheCountEl.textContent = count;
      cacheStatusEl.textContent = count > 0 ? 'Active' : 'Empty';
    } catch {
      cacheCountEl.textContent = '0';
      cacheStatusEl.textContent = 'Error';
    }
  }

  /**
   * Save the API key to chrome.storage.sync.
   */
  async function saveApiKey() {
    const key = apiKeyInput.value.trim();

    if (!key) {
      showStatus('Please enter an API key.', 'error');
      return;
    }

    if (!key.startsWith('sk-')) {
      showStatus('API key should start with "sk-". Please check your key.', 'error');
      return;
    }

    try {
      await chrome.storage.sync.set({ brevity_api_key: key });
      showStatus('API key saved successfully!', 'success');
    } catch (error) {
      showStatus('Failed to save API key: ' + error.message, 'error');
    }
  }

  /**
   * Clear all cached summaries.
   */
  async function clearCache() {
    try {
      const all = await chrome.storage.local.get(null);
      const keysToRemove = Object.keys(all).filter((k) => k.startsWith('brevity_'));

      if (keysToRemove.length === 0) {
        showStatus('Cache is already empty.', 'info');
        return;
      }

      await chrome.storage.local.remove(keysToRemove);
      showStatus(`Cleared ${keysToRemove.length} cached summaries.`, 'success');
      await loadCacheStats();
    } catch (error) {
      showStatus('Failed to clear cache: ' + error.message, 'error');
    }
  }

  /**
   * Toggle API key visibility.
   */
  function toggleKeyVisibility() {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
  }

  /**
   * Show a status message.
   */
  function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'status ' + type;
  }

  // Event listeners
  saveBtn.addEventListener('click', saveApiKey);
  toggleKey.addEventListener('click', toggleKeyVisibility);
  clearCacheBtn.addEventListener('click', clearCache);

  apiKeyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveApiKey();
  });

  init();
})();
