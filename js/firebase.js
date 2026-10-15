import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: 'AIzaSyAZQXwUrVRVLD5oHuoPDM_8iXNUxLlfpJ0',
    authDomain: 'eureka-shop-dd9fd.firebaseapp.com',
    projectId: 'eureka-shop-dd9fd',
    storageBucket: 'eureka-shop-dd9fd.firebasestorage.app',
    messagingSenderId: '747085142882',
    appId: '1:747085142882:web:5c6bc2585eade061d2aa3b',
    measurementId: 'G-SMB3YJ2TPH'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
