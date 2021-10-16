// Import the functions you need from the SDKs you need
// import React, { useEffect, useState } from 'react';
// import { useStateValue } from './StateProvider';
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDUy78LQ8QvxBMgtgoFdV8n8_nAtnt6cxg",
  authDomain: "sunsouth-web-solutions.firebaseapp.com",
  projectId: "sunsouth-web-solutions",
  storageBucket: "sunsouth-web-solutions.appspot.com",
  messagingSenderId: "1018985632055",
  appId: "1:1018985632055:web:3baf835ac30f5eb15a4ab2",
  measurementId: "G-7YNF2784T4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Authentication
const auth = getAuth(app);

// Firestore
const db = getFirestore(app);

// Analytics
// const analytics = getAnalytics(app);


export { app, auth, db };