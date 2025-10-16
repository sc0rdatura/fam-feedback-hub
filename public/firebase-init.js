// =================================================================
//  IMPORTS (MUST BE AT THE TOP)
// =================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// =================================================================
//  FIREBASE CONFIGURATION
// =================================================================
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD3qzW_831SB46SZrNNCE6kE9ralEDK29M",
  authDomain: "fam-feedback-portal.firebaseapp.com",
  projectId: "fam-feedback-portal",
  storageBucket: "fam-feedback-portal.appspot.com", // Corrected this to the standard format
  messagingSenderId: "699810545681",
  appId: "1:699810545681:web:d17b51d322f8d5dfaef1b0"
};

// =================================================================
//  INITIALIZATION & EXPORTS
// =================================================================
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services for other files to use
export const db = getFirestore(app);
export const auth = getAuth(app);