chrome.runtime.onInstalled.addListener(() => {
  console.log('Tab Saver Pro installed successfully');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getCurrentTab') {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      sendResponse(tab);
    });
    return true;
  }
});