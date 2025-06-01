// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD6SVNfNmtVfhq4vAsGpZoh6pbiwrnaW94",
  authDomain: "alphajxivextended.firebaseapp.com",
  projectId: "alphajxivextended",
  storageBucket: "alphajxivextended.firebasestorage.app",
  messagingSenderId: "233920038624",
  appId: "1:233920038624:web:4bc040668184356115b285"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} else {
  console.error("Firebase SDK not loaded. Check script tags in sidepanel.html.");
} 