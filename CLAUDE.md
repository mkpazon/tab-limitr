# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tab Limitr is a Chrome extension (Manifest V3) that limits the number of open tabs per window. When the limit is reached, new tab creation is blocked until the user closes existing tabs.

## Development

No build step, bundler, or package manager. Load the extension directly in Chrome:
1. Go to `chrome://extensions/`, enable Developer mode
2. Click "Load unpacked" and select this directory
3. After code changes, click the refresh button on the extension card

There are no tests or linting configured.

## Architecture

- **background.js** — Service worker. Enforces the tab limit by listening to `chrome.tabs.onCreated` and `onAttached` events; removes tabs that exceed the limit and opens the popup. Manages badge text/color per window (green/orange/red). Reads limit from `chrome.storage.sync`.
- **popup.js / popup.html** — Extension popup with two views: a tab list (sorted by activity, with close buttons) and an inline settings panel. Both views are in a single HTML file, toggled via a `.hidden` class.
- **options.js / options.html** — Standalone options page (opened via right-click → Options). Duplicates the settings UI from the popup.

### Key patterns

- `DEFAULT_TAB_LIMIT` (10) is duplicated as a constant in all three JS files.
- Tab limit is stored in `chrome.storage.sync` under the key `tabLimit` (integer, 1–100).
- Badge is set per-tab (`tabId`) on the active tab of each window, not per-window globally.
- Tab enforcement fires on both `onCreated` and `onAttached` (drag between windows) — both re-read `tabLimit` from storage to avoid stale in-memory values.
