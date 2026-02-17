/**
 * Brevity - Overlay UI
 * Creates and manages the floating summary popup overlay.
 */

const BrevityOverlay = {
  _activeOverlay: null,
  _hideTimeout: null,

  /**
   * Show a summary overlay near the target element.
   */
  show(targetElement, summary, isLoading = false) {
    this.hide();

    const overlay = document.createElement('div');
    overlay.className = BREVITY_CONFIG.CSS_CLASS_NAMES.overlay;

    if (isLoading) {
      overlay.classList.add(BREVITY_CONFIG.CSS_CLASS_NAMES.loading);
      overlay.innerHTML = `
        <div class="brevity-header">
          <span class="brevity-logo">B</span>
          <span class="brevity-title">Brevity</span>
        </div>
        <div class="brevity-body">
          <span class="brevity-spinner"></span>
          <span class="brevity-loading-text">Summarizing...</span>
        </div>
      `;
    } else {
      overlay.innerHTML = `
        <div class="brevity-header">
          <span class="brevity-logo">B</span>
          <span class="brevity-title">Brevity</span>
        </div>
        <div class="brevity-body">
          <p class="brevity-summary-text">${this._escapeHTML(summary)}</p>
        </div>
      `;
    }

    document.body.appendChild(overlay);
    this._positionOverlay(overlay, targetElement);

    requestAnimationFrame(() => {
      overlay.classList.add(BREVITY_CONFIG.CSS_CLASS_NAMES.overlayVisible);
    });

    overlay.addEventListener('mouseenter', () => {
      clearTimeout(this._hideTimeout);
    });

    overlay.addEventListener('mouseleave', () => {
      this._scheduleHide();
    });

    this._activeOverlay = overlay;
  },

  /**
   * Update the content of the currently visible overlay (e.g. loading -> result).
   */
  update(summary) {
    if (!this._activeOverlay) return;

    this._activeOverlay.classList.remove(BREVITY_CONFIG.CSS_CLASS_NAMES.loading);

    const body = this._activeOverlay.querySelector('.brevity-body');
    if (body) {
      body.innerHTML = `<p class="brevity-summary-text">${this._escapeHTML(summary)}</p>`;
    }
  },

  /**
   * Show an error state in the overlay.
   */
  showError(message) {
    if (!this._activeOverlay) return;

    this._activeOverlay.classList.remove(BREVITY_CONFIG.CSS_CLASS_NAMES.loading);

    const body = this._activeOverlay.querySelector('.brevity-body');
    if (body) {
      body.innerHTML = `<p class="brevity-error-text">${this._escapeHTML(message)}</p>`;
    }
  },

  /**
   * Hide and remove the active overlay.
   */
  hide() {
    clearTimeout(this._hideTimeout);

    if (this._activeOverlay) {
      this._activeOverlay.classList.remove(
        BREVITY_CONFIG.CSS_CLASS_NAMES.overlayVisible
      );

      const overlay = this._activeOverlay;
      this._activeOverlay = null;

      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 200);
    }
  },

  /**
   * Schedule the overlay to hide after a short delay.
   */
  _scheduleHide() {
    clearTimeout(this._hideTimeout);
    this._hideTimeout = setTimeout(() => this.hide(), 300);
  },

  /**
   * Start the hide timer. Called from content.js on mouseleave.
   */
  scheduleHide() {
    this._scheduleHide();
  },

  /**
   * Cancel any pending hide. Called when re-entering the target or overlay.
   */
  cancelHide() {
    clearTimeout(this._hideTimeout);
  },

  /**
   * Check if an overlay is currently visible.
   */
  isVisible() {
    return this._activeOverlay !== null;
  },

  /**
   * Position the overlay near the target element.
   */
  _positionOverlay(overlay, targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    let top = rect.bottom + scrollTop + 8;
    let left = rect.left + scrollLeft;

    overlay.style.position = 'absolute';
    overlay.style.top = `${top}px`;
    overlay.style.left = `${left}px`;

    requestAnimationFrame(() => {
      const overlayRect = overlay.getBoundingClientRect();

      if (overlayRect.right > window.innerWidth - 16) {
        left = window.innerWidth - overlayRect.width - 16 + scrollLeft;
        overlay.style.left = `${Math.max(16, left)}px`;
      }

      if (overlayRect.bottom > window.innerHeight - 16) {
        top = rect.top + scrollTop - overlayRect.height - 8;
        if (top < scrollTop + 16) {
          top = rect.bottom + scrollTop + 8;
        }
        overlay.style.top = `${top}px`;
      }
    });
  },

  /**
   * Escape HTML to prevent XSS.
   */
  _escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrevityOverlay;
}
