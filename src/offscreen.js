// This URL must point to the public site
    const _URL = 'https://alphajxivextended.firebaseapp.com';
    const iframe = document.createElement('iframe');
    iframe.src = _URL;
    document.documentElement.appendChild(iframe);
    chrome.runtime.onMessage.addListener(handleChromeMessages);

    function handleChromeMessages(message, sender, sendResponse) {
      if (message.target !== 'offscreen') {
        return false;
      }

      if (message.type === 'firebase-auth') {
        // Create a response promise to handle the auth flow
        const responsePromise = new Promise((resolve, reject) => {
          let timeoutId;

          const handleIframeMessage = ({data}) => {
            try {
              if (typeof data === 'string' && data.startsWith('!_{')) {
                return; // Ignore Firebase internal messages
              }
              
              const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
              globalThis.removeEventListener('message', handleIframeMessage);
              clearTimeout(timeoutId);
              resolve(parsedData);
            } catch (e) {
              console.error('Error handling iframe message:', e);
              clearTimeout(timeoutId);
              reject(e);
            }
          };

          globalThis.addEventListener('message', handleIframeMessage);
          
          // Initialize auth flow with a timeout
          try {
            iframe.contentWindow.postMessage({"initAuth": true}, new URL(_URL).origin);
          } catch (e) {
            clearTimeout(timeoutId);
            reject(new Error('Failed to initiate auth flow: ' + e.message));
          }

          timeoutId = setTimeout(() => {
            globalThis.removeEventListener('message', handleIframeMessage);
            reject(new Error('Auth flow timed out'));
          }, 30000);
        });

        // Handle the response
        responsePromise
          .then(authData => {
            console.log('Auth flow completed successfully');
            // Send response back through the message channel
            chrome.runtime.sendMessage({
              type: 'firebase-auth-response',
              auth: authData
            });
            sendResponse({ success: true });
          })
          .catch(error => {
            console.error('Auth flow failed:', error);
            sendResponse({ error: error.message });
          });

        return true; // Indicates we will send a response asynchronously
      }

      return false;
    }
