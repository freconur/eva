
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
let emulatorsConnected = false;

// --- CONFIGURACIÓN AUTOMÁTICA DE EMULADORES ---
// La aplicación detectará automáticamente si los emuladores están corriendo
// y se conectará a ellos. Si no están corriendo, usará producción.

// Verificar si estamos en el navegador
const isClient = typeof window !== 'undefined';
const isLocalhost = isClient && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

/**
 * Función para detectar si el emulador de Firestore está corriendo
 * Intenta hacer una petición al puerto del emulador
 */
async function checkIfEmulatorIsRunning(): Promise<boolean> {
  if (!isClient || !isLocalhost) {
    return false;
  }

  try {
    // Intentar conectar al emulador de Firestore en localhost:8080
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // Timeout de 1 segundo

    const response = await fetch('http://localhost:8080', {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Si obtenemos cualquier respuesta, el emulador está corriendo
    return true;
  } catch (error) {
    // Si falla la conexión, el emulador no está corriendo
    return false;
  }
}

/**
 * Conectar a los emuladores si están disponibles
 */
async function connectToEmulatorsIfAvailable() {
  if (emulatorsConnected) {
    return;
  }

  const emulatorIsRunning = await checkIfEmulatorIsRunning();

  if (emulatorIsRunning) {
    console.log('🔧 EMULADORES DETECTADOS - Conectando a Firebase Emulators...');

    try {
      // Conecta Firestore al emulador
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('✅ Firestore conectado al emulador (localhost:8080)');

      // Conecta Cloud Functions al emulador
      connectFunctionsEmulator(functions, 'localhost', 5001);
      console.log('✅ Cloud Functions conectadas al emulador (localhost:5001)');

      // Conecta Authentication al emulador
      connectAuthEmulator(auth, 'http://localhost:9099');
      console.log('✅ Authentication conectada al emulador (localhost:9099)');

      emulatorsConnected = true;
      console.log('🎉 Todos los emuladores conectados exitosamente');
    } catch (error) {
      console.warn('⚠️ Error al conectar a los emuladores:', error);
    }
  } else {
    console.log('🌐 PRODUCCIÓN - Usando Firebase en producción (evaluaciones-ugel)');
    console.log('📊 Firestore: producción');
    console.log('⚡ Cloud Functions: producción');
    console.log('🔐 Authentication: producción');
  }
}

// Ejecutar la detección y conexión automática
if (isClient && isLocalhost) {
  connectToEmulatorsIfAvailable();
}


// -------------------------------------------------------------------------

// Exporta las instancias de Firebase para usarlas en tu aplicación
export { db, functions, auth, storage, FUNCTIONS_TIMEOUT };