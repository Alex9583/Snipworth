import { routeMessage } from './router';

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err: unknown) => {
    console.error('[snipworth] setPanelBehavior failed', err);
  });
});

// Sync responses return false; switch to true only when sendResponse will fire async.
chrome.runtime.onMessage.addListener((msg: unknown, _sender, sendResponse) => {
  sendResponse(routeMessage(msg));
  return false;
});
