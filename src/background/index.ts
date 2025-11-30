// Background service worker for context menu handling

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'add-context-memo',
    title: 'Add ContextMemo',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab?.id && info.selectionText) {
    // Get selection coordinates
    chrome.tabs.sendMessage(tab.id, {
      type: 'OPEN_FLOATING_INPUT',
      selectionText: info.selectionText,
    });
  }
});

