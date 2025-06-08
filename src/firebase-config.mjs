import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: "AIzaSyD6SVNfNmtVfhq4vAsGpZoh6pbiwrnaW94",
  authDomain: "alphajxivextended.firebaseapp.com",
  projectId: "alphajxivextended",
  storageBucket: "alphajxivextended.firebasestorage.app",
  messagingSenderId: "233920038624",
  appId: "1:233920038624:web:4bc040668184356115b285"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export { auth, db, provider, signInWithPopup };