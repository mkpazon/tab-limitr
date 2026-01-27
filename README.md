# Chrome Tab Limitr

A Chrome extension to limit the number of tabs open per window.

## Features

- Set a custom tab limit per window via the options page
- Visual badge showing current tab count (e.g., "8/10")
- Badge color changes based on status (green/orange/red)
- New tabs are blocked when limit is reached (close a tab to open new ones)
- Popup shows all tabs with option to close any
- Tabs sorted by activity (active tab first, then by last accessed)
- Per-window limits (each window tracked separately)
- Pinned tabs count toward the limit

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-tab-limiter` folder
5. The extension is now installed!

## Usage

- Click the extension icon to see current tab count and manage tabs
- Right-click the extension icon and select "Options" to set your tab limit
- The badge will show green when under limit, orange at limit, and red when over

## Configuration

Default tab limit is 10. You can change this in the options page (1-100 tabs).
