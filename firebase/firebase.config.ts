
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
 * Función genérica para detectar si un puerto específico está activo en localhost
 */
async function isPortActive(port: number): Promise<boolean> {
  if (!isClient || !isLocalhost) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    
    // Usamos mode: 'no-cors' para evitar problemas de CORS en la detección
    await fetch(`http://localhost:${port}`, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Conectar a los emuladores si están disponibles
 */
async function connectToEmulatorsIfAvailable() {
  if (emulatorsConnected) return;

  const firestoreRunning = await isPortActive(8080);
  const functionsRunning = await isPortActive(5001);
  const authRunning = await isPortActive(9099);

  if (firestoreRunning || functionsRunning || authRunning) {
    console.log('🔧 EMULADORES DETECTADOS - Conectando a los servicios locales disponibles...');

    try {
      if (firestoreRunning) {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('✅ Firestore conectado al emulador (localhost:8080)');
      }

      // Comentado para usar siempre Cloud Functions en producción
      /*
      if (functionsRunning) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
        console.log('✅ Cloud Functions conectadas al emulador (localhost:5001)');
      }
      */
      console.log('🌐 Cloud Functions - Configurado para PRODUCCIÓN (nube de Firebase)');

      if (authRunning) {
        connectAuthEmulator(auth, 'http://localhost:9099');
        console.log('✅ Authentication conectada al emulador (localhost:9099)');
      }

      emulatorsConnected = true;
      console.log('🎉 Conexión a emuladores completada');
    } catch (error) {
      console.warn('⚠️ Error al conectar a los emuladores:', error);
    }
  } else {
    console.log('🌐 PRODUCCIÓN - Usando Firebase en producción (evaluaciones-ugel)');
  }
}

// Ejecutar la detección y conexión automática
if (isClient && isLocalhost) {
  connectToEmulatorsIfAvailable();
}


// -------------------------------------------------------------------------

// Exporta las instancias de Firebase para usarlas en tu aplicación
export { db, functions, auth, storage, FUNCTIONS_TIMEOUT };