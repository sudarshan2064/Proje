// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "triviarena-z4gfp",
  "appId": "1:408569242547:web:71cbcf95bd8a5e56de21c6",
  "storageBucket": "triviarena-z4gfp.firebasestorage.app",
  "apiKey": "AIzaSyBfLM3UUwXCnQyTFwcsB_hK8PgrORs40iA",
  "authDomain": "triviarena-z4gfp.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "408569242547"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
