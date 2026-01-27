const DEFAULT_TAB_LIMIT = 10;

async function loadPopup() {
  const result = await chrome.storage.sync.get(['tabLimit']);
  const tabLimit = result.tabLimit || DEFAULT_TAB_LIMIT;

  const currentWindow = await chrome.windows.getCurrent();
  const tabs = await chrome.tabs.query({ windowId: currentWindow.id });
  const tabCount = tabs.length;

  const statusDiv = document.getElementById('status');
  const tabsListDiv = document.getElementById('tabsList');

  if (tabCount > tabLimit) {
    statusDiv.className = 'status over-limit';
    statusDiv.textContent = `Tab limit reached! Close ${tabCount - tabLimit} tab(s) to open new ones.`;
  } else if (tabCount === tabLimit) {
    statusDiv.className = 'status at-limit';
    statusDiv.textContent = `At limit (${tabCount}/${tabLimit}). Close a tab to open a new one.`;
  } else {
    statusDiv.className = 'status';
    statusDiv.textContent = `${tabCount}/${tabLimit} tabs open.`;
  }

  tabsListDiv.innerHTML = '';

  tabs.sort((a, b) => {
    if (a.active) return -1;
    if (b.active) return 1;
    return b.lastAccessed - a.lastAccessed;
  });

  tabs.forEach(tab => {
    const tabItem = document.createElement('div');
    tabItem.className = 'tab-item';

    const favicon = document.createElement('img');
    favicon.className = 'tab-favicon';
    favicon.src = tab.favIconUrl || 'icons/icon16.png';

    const title = document.createElement('span');
    title.className = 'tab-title';
    title.textContent = tab.title || tab.url;
    title.title = tab.title || tab.url;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = 'Close';
    closeBtn.onclick = async (e) => {
      e.stopPropagation();
      await chrome.tabs.remove(tab.id);
      loadPopup();
    };

    tabItem.appendChild(favicon);
    tabItem.appendChild(title);
    tabItem.appendChild(closeBtn);

    tabItem.onclick = () => {
      chrome.tabs.update(tab.id, { active: true });
    };

    tabsListDiv.appendChild(tabItem);
  });
}

// View elements
const tabsView = document.getElementById('tabsView');
const settingsView = document.getElementById('settingsView');
const tabLimitInput = document.getElementById('tabLimit');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

function showSettings() {
  tabsView.classList.add('hidden');
  settingsView.classList.remove('hidden');
  chrome.storage.sync.get(['tabLimit']).then(result => {
    tabLimitInput.value = result.tabLimit || DEFAULT_TAB_LIMIT;
  });
}

function showTabs() {
  settingsView.classList.add('hidden');
  tabsView.classList.remove('hidden');
  successMessage.classList.add('hidden');
  errorMessage.classList.add('hidden');
  loadPopup();
}

async function saveSettings() {
  const tabLimit = parseInt(tabLimitInput.value);
  successMessage.classList.add('hidden');
  errorMessage.classList.add('hidden');

  if (isNaN(tabLimit) || tabLimit < 1 || tabLimit > 100) {
    errorMessage.classList.remove('hidden');
    return;
  }

  await chrome.storage.sync.set({ tabLimit });
  successMessage.classList.remove('hidden');
  setTimeout(() => successMessage.classList.add('hidden'), 2000);
}

function resetSettings() {
  tabLimitInput.value = DEFAULT_TAB_LIMIT;
  saveSettings();
}

document.getElementById('settingsLink').onclick = showSettings;
document.getElementById('backBtn').onclick = showTabs;
document.getElementById('saveBtn').onclick = saveSettings;
document.getElementById('resetBtn').onclick = resetSettings;

loadPopup();
