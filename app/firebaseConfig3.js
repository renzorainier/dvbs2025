import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for the second account
const firebaseConfig3 = {
  apiKey: "AIzaSyCGcUZWDk5fQLy-ESsnSrfUsC1FfsSl5jY",
  authDomain: "sched-35c30.firebaseapp.com",
  projectId: "sched-35c30",
  storageBucket: "sched-35c30.appspot.com",
  messagingSenderId: "190264231373",
  appId: "1:190264231373:web:eb2b5f1bd7a3df51e7f084"
};

// Initialize Firebase app for the second account with a different name
const app3 = initializeApp(firebaseConfig3, 'app3');
export const db3 = getFirestore(app3);
