/**
 * Brevity - Constants and Configuration
 * Central configuration for the extension.
 */

const BREVITY_CONFIG = {
  CACHE_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds

  API_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
  API_MODEL: 'gpt-4o-mini',
  API_MAX_TOKENS: 80,
  API_MAX_RETRIES: 3,
  API_RETRY_BASE_DELAY: 2000,

  CSS_CLASS_NAMES: {
    overlay: 'brevity-overlay',
    overlayVisible: 'brevity-overlay--visible',
    processed: 'brevity-processed',
    loading: 'brevity-loading',
  },

  DEBOUNCE_DELAY: 300,
  HOVER_DELAY: 400,

  SUPPORTED_SITES: {
    netflix: {
      hostname: 'www.netflix.com',
      selectors: [
        '.previewModal--detailsMetadata-left .preview-modal-synopsis',
        '.title-info-synopsis',
        '.episodeSynopsis',
        '.synopsis',
        '.preview-modal-synopsis',
        '[data-uia="preview-modal-synopsis"]',
        '.titleCard-synopsis',
        '.about-wrapper .synopsis',
        '.jawBoneCommon .synopsis',
      ],
    },
    youtube: {
      hostname: 'www.youtube.com',
      selectors: [
        '#description-inner #attributed-snippet-text',
        '#description yt-attributed-string > span',
        '#description-text',
        'ytd-text-inline-expander > .ytd-text-inline-expander',
        '#meta-contents #description .content',
        'yt-formatted-string.ytd-video-renderer',
        '#description-inline-expander > yt-attributed-string',
        '#attributed-snippet-text > span',
        '#description .content',
      ],
    },
    imdb: {
      hostname: 'www.imdb.com',
      selectors: [
        '[data-testid="plot-xl"]',
        '[data-testid="plot-l"]',
        '[data-testid="plot-xs_to_m"]',
        '.GenresAndPlot__TextContainerBreakpointXL .GenresAndPlot__Plot',
        '.Storyline__StorylineWrapper .ipc-html-content-inner-div',
        '.plot_summary .summary_text',
        '.inline-canopy__below .plot_summary_wrapper .summary_text',
        '[data-testid="storyline-plot-summary"] div',
      ],
    },
  },

  MAX_DESCRIPTION_LENGTH: 2000,
  MIN_DESCRIPTION_LENGTH: 20,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BREVITY_CONFIG;
}
