
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDli98HId_qZcJq0yez2nr4ueS12aeFQw0",
  authDomain: "evaluaciones-ugel.firebaseapp.com",
  projectId: "evaluaciones-ugel",
  storageBucket: "evaluaciones-ugel.firebasestorage.app",
  messagingSenderId: "694050305562",
  appId: "1:694050305562:web:d5b98183620099729103a3",
  measurementId: "G-Y3MVL3NVRC"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const functions = getFunctions(app);       // Producción — sin emulador
const auth = getAuth(app);
const storage = getStorage(app);

// Timeout personalizado para Cloud Functions largas (ej. consolidación masiva)
// 570s = 9.5 min — margen sobre el máximo de 540s de GCP
const FUNCTIONS_TIMEOUT = 570000;

export { db, functions, auth, storage, FUNCTIONS_TIMEOUT };