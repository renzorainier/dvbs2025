import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for the second account
const firebaseConfig2 = {
  apiKey: "AIzaSyDdqLuF46WIAdiR73y_yQog56n5rj7zlvE",
  authDomain: "points2025-93870.firebaseapp.com",
  projectId: "points2025-93870",
  storageBucket: "points2025-93870.firebasestorage.app",
  messagingSenderId: "1057406491735",
  appId: "1:1057406491735:web:c967e26f0999d95f069712"
};

// Initialize Firebase app for the second account with a different name
const app2 = initializeApp(firebaseConfig2, 'app2');
export const db2 = getFirestore(app2);
