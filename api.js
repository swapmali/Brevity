/**
 * Brevity - API Layer (OpenAI)
 * Handles LLM API calls for summary generation.
 * Runs exclusively in the background service worker for security.
 */

const BrevityAPI = {
  _apiKey: null,

  /**
   * Load the API key. Checks in order:
   * 1. Local config file (config.js — git-ignored)
   * 2. Chrome storage (set via the popup UI)
   */
  async _getApiKey() {
    if (this._apiKey) return this._apiKey;

    if (
      typeof BREVITY_LOCAL_CONFIG !== 'undefined' &&
      BREVITY_LOCAL_CONFIG.OPENAI_API_KEY &&
      BREVITY_LOCAL_CONFIG.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY_HERE'
    ) {
      this._apiKey = BREVITY_LOCAL_CONFIG.OPENAI_API_KEY;
      return this._apiKey;
    }

    const result = await chrome.storage.sync.get('brevity_api_key');
    this._apiKey = result.brevity_api_key || null;
    return this._apiKey;
  },

  /**
   * Sleep helper for retry backoff.
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /**
   * Generate a concise 1-2 sentence summary of the given description text.
   * Uses OpenAI gpt-4o-mini with automatic retry on 429.
   * Returns clean text or throws on failure.
   */
  async generateSummary(text) {
    const apiKey = await this._getApiKey();

    if (!apiKey) {
      throw new Error(
        'API key not configured. Add your OpenAI API key in config.js or the popup.'
      );
    }

    const truncated = text.slice(0, BREVITY_CONFIG.MAX_DESCRIPTION_LENGTH);
    const maxRetries = BREVITY_CONFIG.API_MAX_RETRIES;
    const baseDelay = BREVITY_CONFIG.API_RETRY_BASE_DELAY;

    const body = JSON.stringify({
      model: BREVITY_CONFIG.API_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a witty, sharp, and hilarious movie/TV summarizer. Given a description, respond with exactly 1-2 sentences that nail the core premise — but make it genuinely funny. Use dry humor, sarcasm, clever wordplay, or absurd honesty. Think of how a brutally honest friend would describe the plot. No spoilers, no quotation marks, no filler. Be punchy, be savage, be memorable.',
        },
        {
          role: 'user',
          content: `Give me the funniest, most on-point summary of this:\n\n${truncated}`,
        },
      ],
      max_tokens: BREVITY_CONFIG.API_MAX_TOKENS,
      temperature: 0.9,
    });

    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(BREVITY_CONFIG.API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body,
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : baseDelay * Math.pow(2, attempt);

          console.warn(
            `[Brevity] Rate limited (429). Retry ${attempt + 1}/${maxRetries} in ${delay}ms`
          );

          if (attempt < maxRetries) {
            await this._sleep(delay);
            continue;
          }
        }

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          throw new Error(
            `API request failed (${response.status}): ${errorBody.slice(0, 200)}`
          );
        }

        const data = await response.json();
        const summary =
          data?.choices?.[0]?.message?.content?.trim() || '';

        if (!summary) {
          throw new Error('API returned an empty summary.');
        }

        return summary;
      } catch (error) {
        lastError = error;

        if (
          attempt < maxRetries &&
          (error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError'))
        ) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.warn(
            `[Brevity] Network error. Retry ${attempt + 1}/${maxRetries} in ${delay}ms`
          );
          await this._sleep(delay);
          continue;
        }

        throw error;
      }
    }

    throw lastError || new Error('Summary generation failed after retries.');
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrevityAPI;
}
