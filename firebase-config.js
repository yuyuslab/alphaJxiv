// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBBPvX77st1c3VCWKSERM0mBP9bd7PJDtg",
    authDomain: "alphajxiv.firebaseapp.com",
    projectId: "alphajxiv",
    storageBucket: "alphajxiv.firebasestorage.app",
    messagingSenderId: "770693092408",
    appId: "1:770693092408:web:0905b3cc0b76a0a42dc2cd",
    measurementId: "G-3KV0JCR0DY"
  };

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} else {
  console.error("Firebase SDK not loaded. Check script tags in sidepanel.html.");
} 