import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for the second account
const firebaseConfig4 = {
    apiKey: "AIzaSyBlN6qVKKC2rMiCoOa-5GZuK2RGr3hOk-s",
    authDomain: "dvbs2-ca434.firebaseapp.com",
    projectId: "dvbs2-ca434",
    storageBucket: "dvbs2-ca434.appspot.com",
    messagingSenderId: "198606446381",
    appId: "1:198606446381:web:ef63f2174e0735004c3da4"
};

// Initialize Firebase app for the second account with a different name
const app4 = initializeApp(firebaseConfig4, 'app4');
export const db4 = getFirestore(app4);
