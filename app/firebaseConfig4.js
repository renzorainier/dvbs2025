
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for the second account
const firebaseConfig4 = {
  apiKey: "AIzaSyDqENaxstw-IqA1iftH_pgk4_Icus0rEow",
  authDomain: "dvbs2025backup1.firebaseapp.com",
  projectId: "dvbs2025backup1",
  storageBucket: "dvbs2025backup1.firebasestorage.app",
  messagingSenderId: "250166408302",
  appId: "1:250166408302:web:65db2ffc20f9f13e47627f"
};

// Initialize Firebase app for the second account with a different name
const app4 = initializeApp(firebaseConfig4, 'app4');
export const db4 = getFirestore(app4);
