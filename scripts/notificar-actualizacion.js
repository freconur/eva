#!/usr/bin/env node

/**
 * Script CLI para emitir una notificación de actualización a los usuarios desde la terminal.
 * Uso:
 *   node scripts/notificar-actualizacion.js [version] [mensaje] [--forzar]
 * Ejemplo:
 *   node scripts/notificar-actualizacion.js 0.1.1 "Mejoras en módulo de evaluaciones"
 */

const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

// 1. Obtener versión por defecto de package.json
const packageJsonPath = path.resolve(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 2. Argumentos de la línea de comandos
const args = process.argv.slice(2);
let version = pkg.version;
let mensaje = 'Hemos desplegado mejoras y optimizaciones en la plataforma. Te sugerimos guardar tu trabajo pendiente y actualizar la aplicación.';
let forzar = false;

args.forEach((arg) => {
  if (arg === '--forzar' || arg === '-f') {
    forzar = true;
  } else if (/^\d+\.\d+\.\d+/.test(arg)) {
    version = arg;
  } else if (!arg.startsWith('-')) {
    mensaje = arg;
  }
});

// 3. Inicializar Firebase Admin
const keyPath = path.resolve(__dirname, '../eva-ugel.json');
if (!fs.existsSync(keyPath)) {
  console.error('❌ Error: No se encontró el archivo de credenciales eva-ugel.json en la raíz del proyecto.');
  process.exit(1);
}

const serviceAccount = require(keyPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function emitirActualizacion() {
  console.log(`\n📢 Emitiendo notificación de actualización a los usuarios...`);
  console.log(`-----------------------------------------------------`);
  console.log(`📌 Versión a notificar: v${version}`);
  console.log(`💬 Mensaje:             ${mensaje}`);
  console.log(`🔒 Forzar recarga:      ${forzar ? 'SÍ' : 'NO (el usuario puede posponer)'}`);
  console.log(`-----------------------------------------------------\n`);

  try {
    const docData = {
      version: version.trim(),
      titulo: 'Nueva actualización disponible',
      mensaje: mensaje.trim(),
      activo: true,
      forzarActualizacion: forzar,
      fechaLanzamiento: new Date().toLocaleString('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      actualizadoPor: 'Terminal CLI (Admin)',
      buildTimestamp: Date.now(),
    };

    // Actualizar documento que escuchan los clientes en tiempo real
    await db.collection('configuracion').doc('version').set(docData, { merge: true });

    // Guardar en historial
    await db.collection('configuracion').doc('version').collection('historial').add({
      ...docData,
      createdAt: new Date().toISOString(),
      origen: 'CLI',
    });

    console.log(`✅ ¡ÉXITO! La versión v${version} fue notificada exitosamente en Firestore.`);
    console.log(`🚀 Todos los usuarios con la pestaña abierta recibirán el aviso inmediatamente.\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al actualizar Firestore:', error);
    process.exit(1);
  }
}

emitirActualizacion();
