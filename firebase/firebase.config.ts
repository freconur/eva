
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
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

const db = getFirestore(app); // Instancia de Firestore
const functions = getFunctions(app); // Instancia de Cloud Functions
const auth = getAuth(app);
const storage = getStorage(app); // Instancia de Storage

// CONFIGURAR TIMEOUT PERSONALIZADO PARA CLOUD FUNCTIONS
// Esto debe coincidir con el timeout de la Cloud Function (540 segundos)
// Agregamos 30 segundos extra como margen de seguridad
const FUNCTIONS_TIMEOUT = 570000; // 570 segundos = 9.5 minutos

// Variable para controlar que los emuladores solo se conecten una vez
/* let emulatorsConnected = false;

// --- CONFIGURACIÓN PARA CONECTAR A LOS EMULADORES (¡SOLO EN DESARROLLO!) ---
// Es CRÍTICO que esta parte del código solo se ejecute cuando estés desarrollando localmente.
// Una forma común es verificar el entorno (process.env.NODE_ENV) o el hostname.

// Verificar si estamos en el navegador y en desarrollo
const isClient = typeof window !== 'undefined';
const isDevelopment = process.env.NODE_ENV === 'development';
const isLocalhost = isClient && window.location.hostname === 'localhost';

if ((isDevelopment || isLocalhost) && !emulatorsConnected && isClient) {
  console.log('--- CONECTANDO LA APLICACIÓN A LOS EMULADORES DE FIREBASE ---');

  try {
    // Conecta Firestore al emulador
    // El puerto por defecto para Firestore es 8080 (no está en tu salida, pero es el estándar)
    connectFirestoreEmulator(db, 'localhost', 8080);

    // Conecta Cloud Functions al emulador
    // Tu salida indica 'Functions | 127.0.0.1:5001', así que usamos 5001
    connectFunctionsEmulator(functions, 'localhost', 5001);

    // Conecta Authentication al emulador (si lo usas)
    // El puerto por defecto para Auth es 9099 (no está en tu salida, pero es el estándar)
    connectAuthEmulator(auth, 'http://localhost:9099');

    emulatorsConnected = true;
    console.log('Emuladores conectados exitosamente');
    
  } catch (error) {
    console.warn('Los emuladores ya están conectados o hay un error:', error);
  }
} */
// -------------------------------------------------------------------------

// Exporta las instancias de Firebase para usarlas en tu aplicación
export { db, functions, auth, storage, FUNCTIONS_TIMEOUT };