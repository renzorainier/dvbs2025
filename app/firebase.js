import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCXreYlJwBRd27iqM4yGdPDd-jweh1ZjJg",
    authDomain: "dvbs-f6778.firebaseapp.com",
    projectId: "dvbs-f6778",
    storageBucket: "dvbs-f6778.appspot.com",
    messagingSenderId: "970229367594",
    appId: "1:970229367594:web:3b65a45ad74ba0f951d453",
    };
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);



// dvbs2
// apiKey: "AIzaSyBlN6qVKKC2rMiCoOa-5GZuK2RGr3hOk-s",
// authDomain: "dvbs2-ca434.firebaseapp.com",
// projectId: "dvbs2-ca434",
// storageBucket: "dvbs2-ca434.appspot.com",
// messagingSenderId: "198606446381",
// appId: "1:198606446381:web:ef63f2174e0735004c3da4"


//firebase config 1 (original)
// apiKey: "AIzaSyCXreYlJwBRd27iqM4yGdPDd-jweh1ZjJg",
// authDomain: "dvbs-f6778.firebaseapp.com",
// projectId: "dvbs-f6778",
// storageBucket: "dvbs-f6778.appspot.com",
// messagingSenderId: "970229367594",
// appId: "1:970229367594:web:3b65a45ad74ba0f951d453",