
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyAdTHghtC6EapiesS1beHswN5EHJaQ4DEo",
  authDomain: "reefua.firebaseapp.com",
  projectId: "reefua",
  storageBucket: "reefua.firebasestorage.app",
  messagingSenderId: "655785668574",
  appId: "1:655785668574:web:6db232c21f495107af374f"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
// Explicitly connect to the 'us-central1' region for all cloud functions
const functions = getFunctions(app, 'us-central1');

export { app, auth, db, functions };
