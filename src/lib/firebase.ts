
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyAdTHghtC6EapiesS1beHswN5EHJaQ4DEo",
  authDomain: "reefua.firebaseapp.com",
  projectId: "reefua",
  storageBucket: "reefua.appspot.com",
  messagingSenderId: "655785668574",
  appId: "1:655785668574:web:6db232c21f495107af374f"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

export { app, auth, db, functions };
