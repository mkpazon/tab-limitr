const DEFAULT_TAB_LIMIT = 10;

let tabLimit = DEFAULT_TAB_LIMIT;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['tabLimit'], (result) => {
    tabLimit = result.tabLimit || DEFAULT_TAB_LIMIT;
  });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.tabLimit) {
    tabLimit = changes.tabLimit.newValue;
    updateAllBadges();
  }
});

chrome.tabs.onCreated.addListener(async (tab) => {
  const tabs = await chrome.tabs.query({ windowId: tab.windowId });
  const tabCount = tabs.length;

  updateBadge(tab.windowId, tabCount);

  if (tabCount > tabLimit) {
    await chrome.tabs.remove(tab.id);
    chrome.action.openPopup();
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  updateBadge(removeInfo.windowId);
});

chrome.tabs.onAttached.addListener(async (tabId, attachInfo) => {
  const tabs = await chrome.tabs.query({ windowId: attachInfo.newWindowId });
  const tabCount = tabs.length;

  updateBadge(attachInfo.newWindowId, tabCount);

  if (tabCount > tabLimit) {
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

  chrome.action.setBadgeText({
    text: `${count}/${tabLimit}`,
    tabId: (await chrome.tabs.query({ windowId, active: true }))[0]?.id
  });

  chrome.action.setBadgeBackgroundColor({
    color: count > tabLimit ? '#ff0000' : count === tabLimit ? '#ff9900' : '#4caf50'
  });
}

async function updateAllBadges() {
  const windows = await chrome.windows.getAll();
  for (const window of windows) {
    updateBadge(window.id);
  }
}

updateAllBadges();
