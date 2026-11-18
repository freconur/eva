/**
 * =============================================================================
 * Script de Diagnóstico: Verificación de propiedades de nivel en Especialistas UGEL
 * =============================================================================
 *
 * Propósito:
 * Analiza la colección 'usuarios' en Cloud Firestore para identificar cuántos
 * y cuáles especialistas UGEL (rol === 1) tienen:
 *  - 'nivelDeInstitucion'
 *  - 'nivelesInstitucion'
 *  - 'nivel'
 *
 * Evalúa todas las combinaciones posibles:
 *  1. Las 3 propiedades presentes a la vez
 *  2. Combinaciones de 2 propiedades (nivelDe + niveles, nivelDe + nivel, niveles + nivel)
 *  3. Solo una propiedad (solo nivelDeInstitucion, solo nivelesInstitucion, solo nivel)
 *  4. Ninguna de las propiedades
 *
 * Además reporta:
 *  - Valores exactos en la BD y su interpretación pedagógica (0: Inicial, 1: Primaria, 2: Secundaria).
 *  - Si cuando conviven varias propiedades los valores son coherentes o si hay discrepancias.
 *  - Distribución estadística de valores de cada propiedad.
 *  - Exporta el reporte completo en formato JSON a 'reporte-especialistas-niveles.json'.
 *
 * Uso:
 *   node verificar-niveles-especialistas.js
 * =============================================================================
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// 1. Carga de credenciales y conexión a Firestore
const serviceAccountPath = path.resolve(__dirname, 'eva-ugel.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Error: No se encontró el archivo de credenciales 'eva-ugel.json' en la raíz del proyecto.");
  console.error(`   Ruta esperada: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Mapeos de referencia (según el sistema EVA / UGEL)
const NIVELES_MAP = {
  0: 'Inicial',
  1: 'Primaria',
  2: 'Secundaria'
};

const REGIONES_MAP = {
  1: 'Puno',
  2: 'San Román',
  3: 'Chucuito-juli',
  4: 'Yunguyo',
  5: 'El Collao',
  6: 'Putina',
  7: 'Huancané',
  8: 'Sandia',
  9: 'Crucero',
  10: 'Carabaya',
  11: 'Lampa',
  12: 'Melgar',
  13: 'Azángaro',
  14: 'Moho'
};

/**
 * Convierte valores de nivel (array, número, string) a formato legible con texto descriptivo.
 */
function interpretarNivel(val) {
  if (val === undefined) return '(no existe / undefined)';
  if (val === null) return 'null';
  if (Array.isArray(val)) {
    if (val.length === 0) return '[] (array vacío)';
    const nombres = val.map(n => NIVELES_MAP[Number(n)] || `ID:${n}`).join(', ');
    return `[${val.join(', ')}] -> ${nombres}`;
  }
  const nombre = NIVELES_MAP[Number(val)] || `ID:${val}`;
  return `${val} -> ${nombre}`;
}

/**
 * Serializa de forma canónica el valor para agrupaciones estadísticas
 */
function serializarValor(val) {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (Array.isArray(val)) {
    const ordenado = [...val].map(Number).sort((a, b) => a - b);
    return `[${ordenado.join(', ')}]`;
  }
  return String(val);
}

/**
 * Convierte cualquier valor a un array de números ordenado para comparar consistencia
 */
function normalizarNiveles(val) {
  if (val === undefined || val === null) return [];
  if (Array.isArray(val)) return val.map(Number).sort((a, b) => a - b);
  if (!isNaN(Number(val)) && String(val).trim() !== '') return [Number(val)];
  return [];
}

/**
 * Comprueba si dos valores representan los mismos niveles
 */
function sonEquivalentes(valA, valB) {
  const a = normalizarNiveles(valA);
  const b = normalizarNiveles(valB);
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

/**
 * Interpreta una clave serializada de valor para el resumen de frecuencias
 */
function interpretarValorClave(valKey) {
  if (valKey === 'undefined') return '(no definido / undefined)';
  if (valKey === 'null') return 'null';
  try {
    const parsed = JSON.parse(valKey);
    return interpretarNivel(parsed);
  } catch (e) {
    return valKey;
  }
}

async function ejecutarDiagnostico() {
  console.log('\n========================================================================');
  console.log('🔍 INICIANDO DIAGNÓSTICO: PROPIEDADES DE NIVEL EN ESPECIALISTAS UGEL');
  console.log('    (Evaluando: nivelDeInstitucion, nivelesInstitucion y nivel)');
  console.log('========================================================================');

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(`🔌 Conectado al Emulador Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else {
    console.log(`☁️  Conectado a Firebase Firestore Producción (Proyecto: ${serviceAccount.project_id || 'eva-ugel'})`);
  }

  console.log('⏳ Consultando especialistas UGEL (rol === 1) en la colección "usuarios"...\n');

  try {
    const usuariosRef = db.collection('usuarios');

    // Consultamos por diferentes variantes para asegurar cobertura completa:
    // 1. rol numérico 1
    // 2. rol string "1"
    // 3. perfil.rol numérico 1
    // 4. perfil.rol string "1"
    const [snapRolNum, snapRolStr, snapPerfilNum, snapPerfilStr] = await Promise.all([
      usuariosRef.where('rol', '==', 1).get(),
      usuariosRef.where('rol', '==', '1').get(),
      usuariosRef.where('perfil.rol', '==', 1).get(),
      usuariosRef.where('perfil.rol', '==', '1').get()
    ]);

    // Consolidamos en un Map por ID para evitar duplicados
    const mapaDocs = new Map();
    snapRolNum.docs.forEach(d => mapaDocs.set(d.id, d));
    snapRolStr.docs.forEach(d => mapaDocs.set(d.id, d));
    snapPerfilNum.docs.forEach(d => mapaDocs.set(d.id, d));
    snapPerfilStr.docs.forEach(d => mapaDocs.set(d.id, d));

    const totalEspecialistas = mapaDocs.size;
    console.log(`✅ Total de Especialistas UGEL encontrados: ${totalEspecialistas}\n`);

    if (totalEspecialistas === 0) {
      console.log('⚠️  No se encontraron usuarios con rol === 1 en la base de datos.');
      return;
    }

    // Clasificación de usuarios por combinaciones de las 3 propiedades
    const conTres = [];
    const conNivelDeYNiveles = [];
    const conNivelDeYNivel = [];
    const conNivelesYNivel = [];
    const soloNivelDe = [];
    const soloNiveles = [];
    const soloNivel = [];
    const conNinguna = [];

    // Frecuencia de valores individuales
    const conteoValoresNivelDe = {};
    const conteoValoresNiveles = {};
    const conteoValoresNivel = {};

    mapaDocs.forEach((doc) => {
      const data = doc.data();
      const dni = data.dni || doc.id;
      const nombreCompleto = `${data.nombres || ''} ${data.apellidos || ''}`.trim() || '(Sin nombre)';
      const regionNombre = REGIONES_MAP[Number(data.region)] || (data.region !== undefined ? `Región ${data.region}` : 'Sin región');

      // Evaluamos presencia de propiedades
      const tieneNivelDe = Object.prototype.hasOwnProperty.call(data, 'nivelDeInstitucion') && data.nivelDeInstitucion !== undefined;
      const tieneNiveles = Object.prototype.hasOwnProperty.call(data, 'nivelesInstitucion') && data.nivelesInstitucion !== undefined;
      const tieneNivel = Object.prototype.hasOwnProperty.call(data, 'nivel') && data.nivel !== undefined;

      const valorNivelDe = data.nivelDeInstitucion;
      const valorNiveles = data.nivelesInstitucion;
      const valorNivel = data.nivel;

      // Registrar frecuencia de valores
      if (tieneNivelDe) {
        const key = serializarValor(valorNivelDe);
        conteoValoresNivelDe[key] = (conteoValoresNivelDe[key] || 0) + 1;
      }
      if (tieneNiveles) {
        const key = serializarValor(valorNiveles);
        conteoValoresNiveles[key] = (conteoValoresNiveles[key] || 0) + 1;
      }
      if (tieneNivel) {
        const key = serializarValor(valorNivel);
        conteoValoresNivel[key] = (conteoValoresNivel[key] || 0) + 1;
      }

      // Validar coincidencia de valores cuando conviven 2 o más propiedades
      let coinciden = null;
      const presentes = [];
      if (tieneNivelDe) presentes.push({ prop: 'nivelDeInstitucion', val: valorNivelDe });
      if (tieneNiveles) presentes.push({ prop: 'nivelesInstitucion', val: valorNiveles });
      if (tieneNivel) presentes.push({ prop: 'nivel', val: valorNivel });

      if (presentes.length >= 2) {
        coinciden = presentes.every(p => sonEquivalentes(p.val, presentes[0].val));
      }

      const infoUsuario = {
        dni,
        nombre: nombreCompleto,
        region: regionNombre,
        tieneNivelDeInstitucion: tieneNivelDe,
        tieneNivelesInstitucion: tieneNiveles,
        tieneNivel,
        nivelDeInstitucion: valorNivelDe,
        nivelesInstitucion: valorNiveles,
        nivel: valorNivel,
        interpretacionNivelDe: interpretarNivel(valorNivelDe),
        interpretacionNiveles: interpretarNivel(valorNiveles),
        interpretacionNivel: interpretarNivel(valorNivel),
        coinciden
      };

      // Clasificación exhaustiva
      if (tieneNivelDe && tieneNiveles && tieneNivel) {
        conTres.push(infoUsuario);
      } else if (tieneNivelDe && tieneNiveles && !tieneNivel) {
        conNivelDeYNiveles.push(infoUsuario);
      } else if (tieneNivelDe && !tieneNiveles && tieneNivel) {
        conNivelDeYNivel.push(infoUsuario);
      } else if (!tieneNivelDe && tieneNiveles && tieneNivel) {
        conNivelesYNivel.push(infoUsuario);
      } else if (tieneNivelDe && !tieneNiveles && !tieneNivel) {
        soloNivelDe.push(infoUsuario);
      } else if (!tieneNivelDe && tieneNiveles && !tieneNivel) {
        soloNiveles.push(infoUsuario);
      } else if (!tieneNivelDe && !tieneNiveles && tieneNivel) {
        soloNivel.push(infoUsuario);
      } else {
        conNinguna.push(infoUsuario);
      }
    });

    // =========================================================================
    // 1. RESUMEN EJECUTIVO
    // =========================================================================
    const totalConNivelDe = conTres.length + conNivelDeYNiveles.length + conNivelDeYNivel.length + soloNivelDe.length;
    const totalConNiveles = conTres.length + conNivelDeYNiveles.length + conNivelesYNivel.length + soloNiveles.length;
    const totalConNivel = conTres.length + conNivelDeYNivel.length + conNivelesYNivel.length + soloNivel.length;
    const totalConVarias = conTres.length + conNivelDeYNiveles.length + conNivelDeYNivel.length + conNivelesYNivel.length;
    const totalConSoloUna = soloNivelDe.length + soloNiveles.length + soloNivel.length;

    console.log('┌────────────────────────────────────────────────────────────────────────┐');
    console.log('│                         RESUMEN GENERAL                                │');
    console.log('├──────────────────────────────────────────────────────┬─────────┬───────┤');
    console.log('│ Métrica                                              │ Total   │ %     │');
    console.log('├──────────────────────────────────────────────────────┼─────────┼───────┤');
    console.log(`│ Total Especialistas UGEL analizados                  │ ${String(totalEspecialistas).padEnd(7)} │ 100%  │`);
    console.log('├──────────────────────────────────────────────────────┼─────────┼───────┤');
    console.log(`│ • Poseen 'nivelDeInstitucion' (en total)             │ ${String(totalConNivelDe).padEnd(7)} │ ${(totalConNivelDe / totalEspecialistas * 100).toFixed(1)}% │`);
    console.log(`│ • Poseen 'nivelesInstitucion' (en total)             │ ${String(totalConNiveles).padEnd(7)} │ ${(totalConNiveles / totalEspecialistas * 100).toFixed(1)}% │`);
    console.log(`│ • Poseen 'nivel' (en total)                          │ ${String(totalConNivel).padEnd(7)} │ ${(totalConNivel / totalEspecialistas * 100).toFixed(1)}% │`);
    console.log('├──────────────────────────────────────────────────────┼─────────┼───────┤');
    console.log(`│ A. Con las 3 propiedades a la vez                    │ ${String(conTres.length).padEnd(7)} │ ${(conTres.length / totalEspecialistas * 100).toFixed(1)}% │`);
    console.log(`│ B. Con 2 propiedades (nivelDe + niveles)             │ ${String(conNivelDeYNiveles.length).padEnd(7)} │ ${(conNivelDeYNiveles.length / totalEspecialistas * 100).toFixed(1)}% │`);
    console.log(`│ C. Con 2 propiedades (nivelDe + nivel)               │ ${String(conNivelDeYNivel.length).padEnd(7)} │ ${(conNivelDeYNivel.length / totalEspecialistas * 100).toFixed(1)}% │`);
    console.log(`│ D. Con 2 propiedades (niveles + nivel)               │ ${String(conNivelesYNivel.length).padEnd(7)} │ ${(conNivelesYNivel.length / totalEspecialistas * 100).toFixed(1)}% │`);
    console.log('├──────────────────────────────────────────────────────┼─────────┼───────┤');
    console.log(`│ E. SOLO 'nivelDeInstitucion'                         │ ${String(soloNivelDe.length).padEnd(7)} │ ${(soloNivelDe.length / totalEspecialistas * 100).toFixed(1)}% │`);
    console.log(`│ F. SOLO 'nivelesInstitucion'                         │ ${String(soloNiveles.length).padEnd(7)} │ ${(soloNiveles.length / totalEspecialistas * 100).toFixed(1)}% │`);
    console.log(`│ G. SOLO 'nivel'                                      │ ${String(soloNivel.length).padEnd(7)} │ ${(soloNivel.length / totalEspecialistas * 100).toFixed(1)}% │`);
    console.log('├──────────────────────────────────────────────────────┼─────────┼───────┤');
    console.log(`│ H. NINGUNA propiedad de nivel                        │ ${String(conNinguna.length).padEnd(7)} │ ${(conNinguna.length / totalEspecialistas * 100).toFixed(1)}% │`);
    console.log('└──────────────────────────────────────────────────────┴─────────┴───────┘\n');

    // =========================================================================
    // 2. VALORES ENCONTRADOS EN CADA PROPIEDAD
    // =========================================================================
    console.log('📊 DISTRIBUCIÓN DE VALORES ENCONTRADOS EN CADA CAMPO:');
    console.log('────────────────────────────────────────────────────────────────────────');

    console.log("1. Valores en 'nivelDeInstitucion':");
    if (Object.keys(conteoValoresNivelDe).length === 0) {
      console.log('   (Ningún especialista tiene esta propiedad)');
    } else {
      for (const [val, cant] of Object.entries(conteoValoresNivelDe)) {
        console.log(`   • ${val.padEnd(16)} : ${cant} especialistas (${interpretarValorClave(val)})`);
      }
    }

    console.log("\n2. Valores en 'nivelesInstitucion':");
    if (Object.keys(conteoValoresNiveles).length === 0) {
      console.log('   (Ningún especialista tiene esta propiedad)');
    } else {
      for (const [val, cant] of Object.entries(conteoValoresNiveles)) {
        console.log(`   • ${val.padEnd(16)} : ${cant} especialistas (${interpretarValorClave(val)})`);
      }
    }

    console.log("\n3. Valores en 'nivel':");
    if (Object.keys(conteoValoresNivel).length === 0) {
      console.log('   (Ningún especialista tiene esta propiedad)');
    } else {
      for (const [val, cant] of Object.entries(conteoValoresNivel)) {
        console.log(`   • ${val.padEnd(16)} : ${cant} especialistas (${interpretarValorClave(val)})`);
      }
    }

    // =========================================================================
    // 3. DETALLE DE CASOS
    // =========================================================================

    // CASO A: LAS 3 PROPIEDADES
    if (conTres.length > 0) {
      console.log('\n========================================================================');
      console.log(`🟣 CASO A: ESPECIALISTAS CON LAS 3 PROPIEDADES (${conTres.length})`);
      console.log('========================================================================');
      conTres.forEach((u, i) => {
        const estado = u.coinciden ? '✅ COINCIDEN' : '⚠️ DISCREPANCIA';
        console.log(`${i + 1}. [DNI: ${u.dni}] ${u.nombre} (${u.region}) - ${estado}`);
        console.log(`   - nivelDeInstitucion : ${JSON.stringify(u.nivelDeInstitucion)} -> ${u.interpretacionNivelDe}`);
        console.log(`   - nivelesInstitucion : ${JSON.stringify(u.nivelesInstitucion)} -> ${u.interpretacionNiveles}`);
        console.log(`   - nivel              : ${JSON.stringify(u.nivel)} -> ${u.interpretacionNivel}`);
      });
    }

    // CASO B: nivelDeInstitucion + nivelesInstitucion
    if (conNivelDeYNiveles.length > 0) {
      console.log('\n========================================================================');
      console.log(`🔵 CASO B: ESPECIALISTAS CON 'nivelDeInstitucion' Y 'nivelesInstitucion' (${conNivelDeYNiveles.length})`);
      console.log('========================================================================');
      conNivelDeYNiveles.forEach((u, i) => {
        const estado = u.coinciden ? '✅ COINCIDEN' : '⚠️ DISCREPANCIA';
        console.log(`${i + 1}. [DNI: ${u.dni}] ${u.nombre} (${u.region}) - ${estado}`);
        console.log(`   - nivelDeInstitucion : ${JSON.stringify(u.nivelDeInstitucion)} -> ${u.interpretacionNivelDe}`);
        console.log(`   - nivelesInstitucion : ${JSON.stringify(u.nivelesInstitucion)} -> ${u.interpretacionNiveles}`);
      });
    }

    // CASO C: nivelDeInstitucion + nivel
    if (conNivelDeYNivel.length > 0) {
      console.log('\n========================================================================');
      console.log(`🔵 CASO C: ESPECIALISTAS CON 'nivelDeInstitucion' Y 'nivel' (${conNivelDeYNivel.length})`);
      console.log('========================================================================');
      conNivelDeYNivel.forEach((u, i) => {
        const estado = u.coinciden ? '✅ COINCIDEN' : '⚠️ DISCREPANCIA';
        console.log(`${i + 1}. [DNI: ${u.dni}] ${u.nombre} (${u.region}) - ${estado}`);
        console.log(`   - nivelDeInstitucion : ${JSON.stringify(u.nivelDeInstitucion)} -> ${u.interpretacionNivelDe}`);
        console.log(`   - nivel              : ${JSON.stringify(u.nivel)} -> ${u.interpretacionNivel}`);
      });
    }

    // CASO D: nivelesInstitucion + nivel
    if (conNivelesYNivel.length > 0) {
      console.log('\n========================================================================');
      console.log(`🔵 CASO D: ESPECIALISTAS CON 'nivelesInstitucion' Y 'nivel' (${conNivelesYNivel.length})`);
      console.log('========================================================================');
      conNivelesYNivel.forEach((u, i) => {
        const estado = u.coinciden ? '✅ COINCIDEN' : '⚠️ DISCREPANCIA';
        console.log(`${i + 1}. [DNI: ${u.dni}] ${u.nombre} (${u.region}) - ${estado}`);
        console.log(`   - nivelesInstitucion : ${JSON.stringify(u.nivelesInstitucion)} -> ${u.interpretacionNiveles}`);
        console.log(`   - nivel              : ${JSON.stringify(u.nivel)} -> ${u.interpretacionNivel}`);
      });
    }

    // CASO E: SOLO nivelDeInstitucion
    if (soloNivelDe.length > 0) {
      console.log('\n========================================================================');
      console.log(`🟢 CASO E: ESPECIALISTAS CON SOLO 'nivelDeInstitucion' (${soloNivelDe.length})`);
      console.log('========================================================================');
      soloNivelDe.forEach((u, i) => {
        console.log(`${i + 1}. [DNI: ${u.dni}] ${u.nombre} (${u.region})`);
        console.log(`   - nivelDeInstitucion : ${JSON.stringify(u.nivelDeInstitucion)} -> ${u.interpretacionNivelDe}`);
      });
    }

    // CASO F: SOLO nivelesInstitucion
    if (soloNiveles.length > 0) {
      console.log('\n========================================================================');
      console.log(`🟡 CASO F: ESPECIALISTAS CON SOLO 'nivelesInstitucion' (${soloNiveles.length})`);
      console.log('========================================================================');
      soloNiveles.forEach((u, i) => {
        console.log(`${i + 1}. [DNI: ${u.dni}] ${u.nombre} (${u.region})`);
        console.log(`   - nivelesInstitucion : ${JSON.stringify(u.nivelesInstitucion)} -> ${u.interpretacionNiveles}`);
      });
    }

    // CASO G: SOLO nivel
    if (soloNivel.length > 0) {
      console.log('\n========================================================================');
      console.log(`🟠 CASO G: ESPECIALISTAS CON SOLO 'nivel' (${soloNivel.length})`);
      console.log('========================================================================');
      soloNivel.forEach((u, i) => {
        console.log(`${i + 1}. [DNI: ${u.dni}] ${u.nombre} (${u.region})`);
        console.log(`   - nivel              : ${JSON.stringify(u.nivel)} -> ${u.interpretacionNivel}`);
      });
    }

    // CASO H: NINGUNA PROPIEDAD
    console.log('\n========================================================================');
    console.log(`🔴 CASO H: ESPECIALISTAS SIN NINGUNA PROPIEDAD DE NIVEL (${conNinguna.length})`);
    console.log('========================================================================');
    if (conNinguna.length === 0) {
      console.log('Todos los especialistas tienen al menos una propiedad de nivel configurada.');
    } else {
      conNinguna.forEach((u, i) => {
        console.log(`${i + 1}. [DNI: ${u.dni}] ${u.nombre} (${u.region})`);
      });
    }

    // =========================================================================
    // 4. GUARDAR REPORTE EN ARCHIVO JSON
    // =========================================================================
    const rutaReporteJson = path.resolve(__dirname, 'reporte-especialistas-niveles.json');
    const reporteCompleto = {
      fechaGeneracion: new Date().toISOString(),
      totalEspecialistas,
      totalesGeneralesPorPropiedad: {
        conNivelDeInstitucion: totalConNivelDe,
        conNivelesInstitucion: totalConNiveles,
        conNivel: totalConNivel,
        conVariasPropiedades: totalConVarias,
        conSoloUnaPropiedad: totalConSoloUna,
        sinNingunaPropiedad: conNinguna.length
      },
      combinaciones: {
        conLasTres: conTres.length,
        conNivelDeYNiveles: conNivelDeYNiveles.length,
        conNivelDeYNivel: conNivelDeYNivel.length,
        conNivelesYNivel: conNivelesYNivel.length,
        soloNivelDeInstitucion: soloNivelDe.length,
        soloNivelesInstitucion: soloNiveles.length,
        soloNivel: soloNivel.length,
        ningunaPropiedad: conNinguna.length
      },
      distribucionValores: {
        nivelDeInstitucion: conteoValoresNivelDe,
        nivelesInstitucion: conteoValoresNiveles,
        nivel: conteoValoresNivel
      },
      detalles: {
        conLasTres: conTres,
        conNivelDeYNiveles,
        conNivelDeYNivel,
        conNivelesYNivel,
        soloNivelDe,
        soloNiveles,
        soloNivel,
        conNinguna
      }
    };

    fs.writeFileSync(rutaReporteJson, JSON.stringify(reporteCompleto, null, 2), 'utf-8');
    console.log('\n========================================================================');
    console.log(`💾 Reporte completo guardado exitosamente en:`);
    console.log(`   ${rutaReporteJson}`);
    console.log('========================================================================\n');

  } catch (error) {
    console.error('❌ Error durante la ejecución del diagnóstico:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecución
ejecutarDiagnostico();
