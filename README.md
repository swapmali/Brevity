# Brevity

**Instant summaries. Zero fluff. Actually funny.**

Brevity is a Chrome Extension that generates witty, brutally honest AI-powered summaries of movie and TV show descriptions. Hover over any description on Netflix, YouTube, IMDb, or Prime Video and get a sharp, funny 1–2 sentence summary that cuts straight through the marketing fluff — like your most sarcastic friend explaining the plot.

---

## Features

- **Hover to Summarize** — hover over any description to get a funny, no-BS summary that actually tells you what the show is about
- **Multi-Site Support** — works on Netflix, YouTube, IMDb, and Prime Video out of the box
- **Smart Caching** — summaries are cached locally for 30 days so repeat visits are instant
- **Zero Duplicate Calls** — deduplicates concurrent API requests automatically
- **Non-Blocking** — never freezes the UI; all API calls run in the background service worker
- **Dynamic Content Detection** — uses MutationObserver to detect descriptions loaded after initial page render (Netflix SPAs, YouTube navigation, etc.)
- **Secure** — API keys are stored in Chrome sync storage and API calls are made exclusively from the background script
- **Lightweight** — vanilla JavaScript, no frameworks, minimal footprint

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Brevity.git
```

### 2. Load the Unpacked Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `Brevity` folder (the one containing `manifest.json`)
5. The extension icon will appear in your toolbar

### 3. Configure Your API Key

Brevity uses the **OpenAI API** (gpt-4o-mini) to generate summaries. Get your key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

**Option A — Config file (recommended for development):**

```bash
cp config.example.js config.js
```

Then open `config.js` and replace the placeholder with your real key:

```javascript
const BREVITY_LOCAL_CONFIG = {
  OPENAI_API_KEY: 'sk-your-real-key-here',
};
```

`config.js` is git-ignored, so your key will never be committed.

**Option B — Popup UI:**

1. Click the **Brevity icon** in the Chrome toolbar
2. Paste your OpenAI API key into the input field
3. Click **Save API Key**

The config file takes priority. If a valid key exists in `config.js`, the popup will show that and disable the input field. If no config file key is found, the extension falls back to whatever is saved in the popup.

The popup also shows how many summaries are cached and lets you clear the cache.

---

## How It Works

1. **Content script** runs on Netflix, YouTube, IMDb, and Prime Video
2. It scans the page for description elements using site-specific CSS selectors
3. A **MutationObserver** watches for dynamically loaded content (SPA navigation, lazy loading)
4. When you **hover** over a description, the text is extracted and a request is sent to the **background service worker**
5. The background script checks the **local cache** first — if a summary exists and is less than 30 days old, it's returned immediately
6. If not cached, the background script calls the **OpenAI API** (gpt-4o-mini) to generate a 1–2 sentence summary
7. The summary is **cached** and sent back to the content script
8. A floating **overlay popup** displays the summary near the description with a smooth fade-in animation

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Content Scripts                 │
│                                                  │
│  constants.js  — Configuration & selectors       │
│  utils.js      — Helper functions                │
│  cache.js      — Chrome storage interface        │
│  overlay.js    — Floating popup UI               │
│  domObserver.js— MutationObserver manager        │
│  content.js    — Main orchestrator               │
│  styles.css    — Popup styling                   │
│                                                  │
│  ┌──────────┐   message    ┌─────────────────┐  │
│  │ content  │ ──────────── │   background.js  │  │
│  │  .js     │   passing    │  Service Worker  │  │
│  └──────────┘              │                  │  │
│                            │  • Cache check   │  │
│                            │  • API calls     │  │
│                            │  • Deduplication │  │
│                            └─────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Message Flow

```
User hovers description
        │
        ▼
content.js extracts text
        │
        ▼
Sends { type: 'GET_SUMMARY', text, cacheKey }
        │
        ▼
background.js receives message
        │
        ├── Cache hit? → Return cached summary
        │
        ├── Duplicate in-flight request? → Await existing promise
        │
        └── Cache miss → Call OpenAI API → Cache result → Return
```

---

## File Structure

```
brevity/
├── manifest.json      # Extension manifest (Manifest V3)
├── background.js      # Service worker: caching, API, deduplication
├── content.js         # Content script: hover detection, overlay display
├── domObserver.js     # MutationObserver for dynamic content
├── overlay.js         # Floating popup creation and positioning
├── api.js             # OpenAI API integration (gpt-4o-mini)
├── cache.js           # chrome.storage.local caching with TTL
├── utils.js           # Helper functions (debounce, hashing, etc.)
├── constants.js       # Configuration and CSS selectors
├── styles.css         # Overlay popup styles
├── popup.html         # Settings popup UI
├── popup.js           # Popup logic (API key, cache stats)
├── config.js          # Local API key (git-ignored)
├── config.example.js  # Config template (tracked)
├── icons/
│   ├── icon16.png     # 16x16 toolbar icon
│   ├── icon48.png     # 48x48 extension page icon
│   └── icon128.png    # 128x128 Chrome Web Store icon
└── README.md          # This file
```

---

## Supported Sites

| Site | Detection Method |
|------|-----------------|
| Netflix | Synopsis elements in preview modals, title info, episode synopses |
| YouTube | Video description text, attributed snippets |
| IMDb | Plot summaries, storyline sections |
| Prime Video | Synopsis elements on detail pages (primevideo.com and amazon.com) |

The selector architecture in `constants.js` makes it straightforward to add new sites — just add a new entry to `SUPPORTED_SITES` with the hostname and an array of CSS selectors.

---

## Performance

- Summaries are cached for 30 days — repeat hovers are instant with zero API calls
- Concurrent requests to the same description are deduplicated
- MutationObserver uses debouncing to avoid excessive DOM scanning
- Hover has a 400ms delay to prevent accidental triggers
- Overlay uses CSS transitions (GPU-accelerated) for smooth animations
- Background service worker handles all network I/O off the main thread

---

## Security

- API keys live in `config.js` (git-ignored) or `chrome.storage.sync` — never in content scripts or tracked source code
- All API calls are made from the background service worker, not from page context
- User-generated text displayed in the overlay is HTML-escaped to prevent XSS
- The extension requests only the minimum required permissions

---

## License

MIT
