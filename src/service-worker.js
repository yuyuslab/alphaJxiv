// src/service-worker.js (Final Corrected Version)

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

// --- 1. Global State Management ---
const state = {
  activeTabId: null,
  activeTabUrl: null,
  isJxivPage: false,
  paperTitle: null,
  comments: [],
  auth: null
};

let firestoreUnsubscribe = null;
let authFlowPromise = null;

// --- 2. Core Logic & Firebase Initialization ---

const firebaseConfig = {
  apiKey: "AIzaSyD6SVNfNmtVfhq4vAsGpZoh6pbiwrnaW94",
  authDomain: "alphajxivextended.firebaseapp.com",
  projectId: "alphajxivextended",
  storageBucket: "alphajxivextended.firebasestorage.app",
  messagingSenderId: "233920038624",
  appId: "1:233920038624:web:4bc040668184356115b285"
};

function getDb() {
  if (getApps().length === 0) {
    initializeApp(firebaseConfig);
  }
  return getFirestore(getApp());
}


function pushStateToUI() {
  chrome.runtime.sendMessage({ type: 'STATE_UPDATE', data: state }).catch(e => {
    // This error is expected if the side panel is not open, so we can ignore it.
  });
}

// **MODIFIED**: This function now returns a Promise that resolves after the first data load.
function resetFirestoreListener() {
    return new Promise((resolve) => {
        if (firestoreUnsubscribe) {
            firestoreUnsubscribe();
            firestoreUnsubscribe = null;
        }

        if (state.isJxivPage && state.activeTabUrl) {
            try {
                const db = getDb();
                const commentsQuery = query(collection(db, "comments"), where("pageUrl", "==", state.activeTabUrl), orderBy("timestamp", "desc"));
                
                let isFirstLoad = true;

                firestoreUnsubscribe = onSnapshot(commentsQuery, (snapshot) => {
                    state.comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp?.toDate().toLocaleString() }));
                    pushStateToUI(); // The listener now pushes its own updates.
                    if (isFirstLoad) {
                        isFirstLoad = false;
                        resolve();
                    }
                }, (error) => {
                    console.error("Firestore error:", error);
                    state.comments = [];
                    pushStateToUI();
                    if (isFirstLoad) {
                       isFirstLoad = false;
                       resolve();
                    }
                });
            } catch (error) {
                console.error("Failed to initialize Firestore listener:", error);
                resolve();
            }
        } else {
            state.comments = [];
            resolve();
        }
    });
}

const jxivPattern = /^https:\/\/jxiv\.jst\.go\.jp\/index\.php\/jxiv\/preprint\/view\/\d+/;

// **MODIFIED**: This function now actively requests the title and lets the listener push its own state.
async function handleTabUpdate(tabId, url) {
  state.activeTabId = tabId;
  state.activeTabUrl = url;

  if (url && jxivPattern.test(url)) {
    state.isJxivPage = true;
    state.paperTitle = "Loading title...";
    pushStateToUI(); // Immediately push the "loading" state for the title

    await chrome.sidePanel.setOptions({ tabId, path: 'sidepanel.html', enabled: true });

    // Actively request the title from the content script
    chrome.tabs.sendMessage(tabId, { type: 'GET_TITLE' }, (response) => {
        if (!chrome.runtime.lastError && response && response.title) {
            state.paperTitle = response.title;
            pushStateToUI(); // Push a second update once the real title arrives
        }
    });

  } else {
    state.isJxivPage = false;
    state.paperTitle = null;
    await chrome.sidePanel.setOptions({ tabId, enabled: false });
  }
  
  // This will set up the listener which pushes comment updates independently.
  await resetFirestoreListener();
}

// --- 3. Browser Event Listeners ---
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (tab && tab.url) handleTabUpdate(tab.id, tab.url);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url) {
    handleTabUpdate(tab.id, changeInfo.url);
  }
});

chrome.windows.onFocusChanged.addListener(windowId => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0] && tabs[0].url) handleTabUpdate(tabs[0].id, tabs[0].url);
    });
  }
});

// --- 4. Message Listener ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_INITIAL_STATE') {
    sendResponse({data: state});
    return true;
  }

  if (message.type === 'PAGE_TITLE') {
    if (sender.tab && sender.tab.id === state.activeTabId) {
        state.paperTitle = message.title;
        pushStateToUI();
    }
    return;
  }
  
  if (message.type === 'ADD_COMMENT') {
    if (state.activeTabUrl && state.isJxivPage && state.auth) {
      try {
        const db = getDb();
        addDoc(collection(db, "comments"), { 
            text: message.text, 
            pageUrl: state.activeTabUrl, 
            timestamp: serverTimestamp(),
            author: state.auth.email
          })
          .then(() => sendResponse({ success: true }))
          .catch(error => sendResponse({ success: false, error: error.message }));
      } catch(error) {
        console.error("Error adding document: ", error);
        sendResponse({ success: false, error: "Failed to post comment to Firestore." });
      }
    } else if (!state.auth) {
        sendResponse({ success: false, error: "You must be logged in to comment." });
    } else {
        sendResponse({ success: false, error: "Not on a valid Jxiv page." });
    }
    return true;
  }

  if (message.type === 'REQUEST_AUTH_STATE') {
    if (state.auth) {
        sendResponse({ success: true, auth: state.auth });
    } else {
        firebaseAuth()
          .then(auth => {
            state.auth = auth;
            handleTabUpdate(state.activeTabId, state.activeTabUrl);
            sendResponse({ success: true, auth: auth });
          })
          .catch(error => {
            handleTabUpdate(state.activeTabId, state.activeTabUrl);
            sendResponse({ success: false, error: error.message })
          });
    }
    return true;
  }
  return false;
});

// --- 5. Initial Setup & Auth Helpers ---
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';
async function hasDocument() {
  const matchedClients = await clients.matchAll();
  return matchedClients.some(
    (c) => c.url === chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)
  );
}

async function setupOffscreenDocument(path) {
  if (await hasDocument()) return;
  await chrome.offscreen.createDocument({
      url: path,
      reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
      justification: 'authentication'
  }).catch(console.error);
}

async function closeOffscreenDocument() {
  if (!(await hasDocument())) return;
  await chrome.offscreen.closeDocument();
}

function getAuth() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
        reject(new Error('Auth request timed out'));
        chrome.runtime.onMessage.removeListener(listener);
    }, 29000);
    const listener = (message) => {
      if (message.type === 'firebase-auth-response') {
        clearTimeout(timeout);
        chrome.runtime.onMessage.removeListener(listener);
        if (message.error) {
            reject(new Error(message.error));
        } else {
            const userProfile = message.auth && message.auth.user ? message.auth.user : message.auth;

            if (userProfile && userProfile.email) {
                const serializableUser = {
                    email: userProfile.email,
                    uid: userProfile.uid,
                    displayName: userProfile.displayName
                };
                resolve(serializableUser);
            } else {
                reject(new Error("Received malformed user data from authentication flow."));
            }
        }
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    chrome.runtime.sendMessage({ type: 'firebase-auth', target: 'offscreen' }).catch(err => {
        clearTimeout(timeout);
        chrome.runtime.onMessage.removeListener(listener);
        reject(err);
    });
  });
}

async function firebaseAuth() {
  if (authFlowPromise) {
    return authFlowPromise;
  }
  authFlowPromise = (async () => {
    try {
      await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);
      const auth = await getAuth();
      state.auth = auth;
      return auth;
    } finally {
      await closeOffscreenDocument();
      authFlowPromise = null;
    }
  })();
  return authFlowPromise;
}