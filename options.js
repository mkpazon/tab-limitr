const DEFAULT_TAB_LIMIT = 10;

async function loadOptions() {
  const result = await chrome.storage.sync.get(['tabLimit']);
  document.getElementById('tabLimit').value = result.tabLimit || DEFAULT_TAB_LIMIT;
}

async function saveOptions() {
  const tabLimit = parseInt(document.getElementById('tabLimit').value);
  const successMessage = document.getElementById('successMessage');
  const errorMessage = document.getElementById('errorMessage');

  successMessage.style.display = 'none';
  errorMessage.style.display = 'none';

  if (isNaN(tabLimit) || tabLimit < 1 || tabLimit > 100) {
    errorMessage.style.display = 'block';
    return;
  }

  await chrome.storage.sync.set({ tabLimit });

  successMessage.style.display = 'block';
  setTimeout(() => {
    successMessage.style.display = 'none';
  }, 3000);
}

async function resetOptions() {
  document.getElementById('tabLimit').value = DEFAULT_TAB_LIMIT;
  await saveOptions();
}

document.getElementById('saveBtn').onclick = saveOptions;
document.getElementById('resetBtn').onclick = resetOptions;

loadOptions();
