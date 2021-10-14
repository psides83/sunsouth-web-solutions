import firebase from "firebase"

const firebaseConfig = {
    apiKey: "AIzaSyDUy78LQ8QvxBMgtgoFdV8n8_nAtnt6cxg",
    authDomain: "sunsouth-web-solutions.firebaseapp.com",
    projectId: "sunsouth-web-solutions",
    storageBucket: "sunsouth-web-solutions.appspot.com",
    messagingSenderId: "1018985632055",
    appId: "1:1018985632055:web:3baf835ac30f5eb15a4ab2",
    measurementId: "G-7YNF2784T4"
  };

  const firebaseApp = firebase.initializeApp(firebaseConfig);
  const db = firebaseApp.firestore();
  const auth = firebase.auth();

  export { db, auth };