// Background service worker for Opportune extension

console.log('[Opportune] Background script loaded');

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Opportune] Extension installed');
    // Set default API URL
    chrome.storage.local.set({
      opportune_api_url: 'http://localhost:4321',
    });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ status: 'ok' });
  }
  return true;
});
