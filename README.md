# goblock Chrome Extension

The simplest possible Chrome extension to block distracting websites with path-level control. Block specific pages (like `reddit.com/r/worldnews`) without blocking the entire domain.

![./static/overview.png]

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `goblock` folder
5. The extension icon should appear in your toolbar

## Usage

1. **Block a site**: Click the extension icon, enter a URL (e.g., `reddit.com/r/worldnews`), and click "Block"
2. **View blocked sites**: All blocked sites are listed in the popup
3. **Pause blocking**: Click "Pause" to temporarily allow a site
4. **Resume blocking**: Click "Resume" to re-enable a paused block
5. **Unblock**: Click "Unblock" to permanently remove a block

## How It Works

The extension uses Chrome's `declarativeNetRequest` API to block requests before they're made. This means:
- Blocks happen instantly
- No page loads, no redirects
- Works for both HTTP and HTTPS
- Path-level blocking is supported

## Notes

- Blocks are stored in Chrome's sync storage (syncs across devices if you're signed in)
- The extension only blocks main frames and subframes (not images, scripts, etc.)
- Path-level blocking works by matching URL patterns

## License

MIT

