/******/ (() => { // webpackBootstrap
/*!**************************!*\
  !*** ./src/offscreen.js ***!
  \**************************/
// This URL must point to the public site
var _URL = 'https://alphajxivextended.firebaseapp.com';
var iframe = document.createElement('iframe');
iframe.src = _URL;
document.documentElement.appendChild(iframe);
chrome.runtime.onMessage.addListener(handleChromeMessages);
function handleChromeMessages(message, sender, sendResponse) {
  if (message.target !== 'offscreen') {
    return false;
  }
  if (message.type === 'firebase-auth') {
    // Create a response promise to handle the auth flow
    var responsePromise = new Promise(function (resolve, reject) {
      var timeoutId;
      var _handleIframeMessage = function handleIframeMessage(_ref) {
        var data = _ref.data;
        try {
          if (typeof data === 'string' && data.startsWith('!_{')) {
            return; // Ignore Firebase internal messages
          }
          var parsedData = typeof data === 'string' ? JSON.parse(data) : data;
          globalThis.removeEventListener('message', _handleIframeMessage);
          clearTimeout(timeoutId);
          resolve(parsedData);
        } catch (e) {
          console.error('Error handling iframe message:', e);
          clearTimeout(timeoutId);
          reject(e);
        }
      };
      globalThis.addEventListener('message', _handleIframeMessage);

      // Initialize auth flow with a timeout
      try {
        iframe.contentWindow.postMessage({
          "initAuth": true
        }, new URL(_URL).origin);
      } catch (e) {
        clearTimeout(timeoutId);
        reject(new Error('Failed to initiate auth flow: ' + e.message));
      }
      timeoutId = setTimeout(function () {
        globalThis.removeEventListener('message', _handleIframeMessage);
        reject(new Error('Auth flow timed out'));
      }, 30000);
    });

    // Handle the response
    responsePromise.then(function (authData) {
      console.log('Auth flow completed successfully');
      // Send response back through the message channel
      chrome.runtime.sendMessage({
        type: 'firebase-auth-response',
        auth: authData
      });
      sendResponse({
        success: true
      });
    })["catch"](function (error) {
      console.error('Auth flow failed:', error);
      sendResponse({
        error: error.message
      });
    });
    return true; // Indicates we will send a response asynchronously
  }
  return false;
}
/******/ })()
;
//# sourceMappingURL=offscreen.js.map