const DEFAULT_TAB_LIMIT = 10;
const MAX_BLOCKED_TABS = 10;
const SKIP_URLS = new Set(['chrome://newtab/', 'about:blank', '']);

let tabLimit = DEFAULT_TAB_LIMIT;
const retryAllowedUrls = new Set();

// Load saved tab limit on service worker startup (not just on install)
chrome.storage.sync.get(['tabLimit']).then((result) => {
  tabLimit = result.tabLimit || DEFAULT_TAB_LIMIT;
  updateAllBadges();
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.tabLimit) {
    tabLimit = changes.tabLimit.newValue;
    updateAllBadges();
  }
});

chrome.tabs.onCreated.addListener(async (tab) => {
  const url = tab.pendingUrl || tab.url;

  if (retryAllowedUrls.has(url)) {
    retryAllowedUrls.delete(url);
    return;
  }

  const [tabs, { tabLimit: currentLimit }] = await Promise.all([
    chrome.tabs.query({ windowId: tab.windowId }),
    chrome.storage.sync.get(['tabLimit'])
  ]);
  const tabCount = tabs.length;
  const limit = currentLimit || DEFAULT_TAB_LIMIT;

  updateBadge(tab.windowId, tabCount);

  if (tabCount > limit) {
    await storeBlockedTab(url, tab.title, tab.favIconUrl);
    await chrome.tabs.remove(tab.id);
    chrome.action.openPopup();
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  updateBadge(removeInfo.windowId);
});

chrome.tabs.onAttached.addListener(async (tabId, attachInfo) => {
  const [tabs, { tabLimit: currentLimit }] = await Promise.all([
    chrome.tabs.query({ windowId: attachInfo.newWindowId }),
    chrome.storage.sync.get(['tabLimit'])
  ]);
  const tabCount = tabs.length;
  const limit = currentLimit || DEFAULT_TAB_LIMIT;

  updateBadge(attachInfo.newWindowId, tabCount);

  if (tabCount > limit) {
    try {
      const fullTab = await chrome.tabs.get(tabId);
      const url = fullTab.pendingUrl || fullTab.url;
      await storeBlockedTab(url, fullTab.title, fullTab.favIconUrl);
    } catch (e) { /* tab may already be gone */ }
    await chrome.tabs.remove(tabId);
    chrome.action.openPopup();
  }
});

chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
  updateBadge(detachInfo.oldWindowId);
});

async function updateBadge(windowId, count = null) {
  if (count === null) {
    const tabs = await chrome.tabs.query({ windowId });
    count = tabs.length;
  }

  const activeTab = (await chrome.tabs.query({ windowId, active: true }))[0];
  if (!activeTab) return;

  chrome.action.setBadgeText({
    text: `${count}/${tabLimit}`,
    tabId: activeTab.id
  });

  chrome.action.setBadgeBackgroundColor({
    color: count > tabLimit ? '#ff0000' : count === tabLimit ? '#ff9900' : '#4caf50',
    tabId: activeTab.id
  });
}

async function updateAllBadges() {
  const windows = await chrome.windows.getAll();
  for (const window of windows) {
    updateBadge(window.id);
  }
}

updateAllBadges();

async function storeBlockedTab(url, title, favIconUrl) {
  if (!url || SKIP_URLS.has(url)) return;

  const { blockedTabs = [] } = await chrome.storage.session.get(['blockedTabs']);
  const filtered = blockedTabs.filter(t => t.url !== url);
  filtered.unshift({ url, title: title || url, favIconUrl, timestamp: Date.now() });
  await chrome.storage.session.set({ blockedTabs: filtered.slice(0, MAX_BLOCKED_TABS) });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'retryTab') {
    retryAllowedUrls.add(message.url);
    setTimeout(() => retryAllowedUrls.delete(message.url), 5000);
    chrome.storage.session.get(['blockedTabs']).then(({ blockedTabs = [] }) => {
      const updated = blockedTabs.filter(t => t.url !== message.url);
      chrome.storage.session.set({ blockedTabs: updated }).then(() => {
        chrome.tabs.create({ url: message.url });
        sendResponse({ ok: true });
      });
    });
    return true;
  } else if (message.type === 'removeBlockedTab') {
    chrome.storage.session.get(['blockedTabs']).then(({ blockedTabs = [] }) => {
      const updated = blockedTabs.filter(t => t.timestamp !== message.timestamp);
      chrome.storage.session.set({ blockedTabs: updated }).then(() => sendResponse({ ok: true }));
    });
    return true; // keep message channel open for async response
  }
});
