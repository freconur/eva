# Crear Subset de Firestore para Pruebas

Este directorio contiene scripts para crear un subset de la base de datos de Firestore con solo las colecciones necesarias para probar la Cloud Function `crearPuntajeEestudiantesProgresiva`.

## 📋 Rutas Incluidas en el Subset

```
/evaluaciones/7aN8fAxS4SQAlm9CTIlX/
├── estudiantes-evaluados/
│   └── 2025/
│       └── 10/                    ← Estudiantes del mes 10
│           ├── {dni1}
│           ├── {dni2}
│           └── ...
└── preguntas-respuestas/          ← Preguntas con puntajes
    ├── {pregunta1}
    ├── {pregunta2}
    └── ...

/usuarios/YSd3Gak0ytNE427UGD5TlhZ146b2  ← Usuario para autenticación
```

## 🚀 Métodos para Crear el Subset

### Método 1: Filtrar Export Completo (Recomendado)

Si ya tienes un export completo de Firestore:

```bash
# 1. Asegúrate de tener Node.js instalado
node --version

# 2. Ejecuta el script de filtrado
node scripts/firestore-subset-filter.js firestore-full-export.json firestore-subset.json
```

### Método 2: Export Directo desde Firebase CLI

```bash
# 1. Instalar Firebase CLI si no lo tienes
npm install -g firebase-tools

# 2. Login en Firebase
firebase login

# 3. Exportar colecciones específicas
firebase firestore:export firestore-subset \
  --collection-ids estudiantes-evaluados,preguntas-respuestas,usuarios
```

### Método 3: Usando gcloud CLI

```bash
# Exportar colecciones específicas
gcloud firestore export gs://[TU-BUCKET]/subset \
  --collection-ids=estudiantes-evaluados,preguntas-respuestas,usuarios
```

### Método 4: Manual desde Firebase Console

1. Ve a **Firebase Console** → **Firestore Database**
2. Selecciona **Import/Export**
3. Exporta las siguientes rutas:
   - `/evaluaciones/7aN8fAxS4SQAlm9CTIlX/estudiantes-evaluados/2025/10`
   - `/evaluaciones/7aN8fAxS4SQAlm9CTIlX/preguntas-respuestas`
   - `/usuarios/YSd3Gak0ytNE427UGD5TlhZ146b2`

## 📦 Importar el Subset al Emulador

Una vez que tengas el subset, impórtalo al emulador:

```bash
# Opción 1: Importar desde archivo JSON
firebase emulators:start --import=./firestore-subset --export-on-exit

# Opción 2: Importar desde directorio de export
firebase emulators:start --import=./firestore-subset-dir --export-on-exit
```

## 🔧 Configuración

Si necesitas cambiar los IDs, edita el archivo `firestore-subset-filter.js`:

```javascript
const CONFIG = {
  evaluacionId: '7aN8fAxS4SQAlm9CTIlX',  // Cambiar aquí
  usuarioId: 'YSd3Gak0ytNE427UGD5TlhZ146b2',  // Cambiar aquí
  mes: '10',  // Cambiar aquí
  ano: '2025'  // Cambiar aquí
};
```

## ✅ Verificar el Subset

Después de importar, verifica que las colecciones estén disponibles:

```bash
# Listar colecciones en el emulador
curl http://localhost:8080/emulator/v1/projects/[PROJECT-ID]/databases/(default)/documents
```

## 📊 Tamaño Esperado

- **Base de datos completa**: ~5.8 GB
- **Subset esperado**: ~10-50 MB (dependiendo del número de estudiantes)
- **Reducción**: ~99%

## 🎯 Propósito del Subset

Este subset contiene **exactamente** los datos necesarios para:

1. ✅ Autenticarte en el frontend
2. ✅ Ejecutar la Cloud Function `crearPuntajeEestudiantesProgresiva`
3. ✅ Calcular puntajes y niveles de estudiantes
4. ✅ Probar el flujo completo sin la base de datos completa

## 🐛 Troubleshooting

### Error: "No se encontraron datos"

Verifica que los IDs en `CONFIG` coincidan con tu base de datos:
- `evaluacionId`
- `usuarioId`
- `mes`
- `ano`

### Error: "Archivo muy grande"

Si el subset sigue siendo muy grande:
1. Reduce el número de estudiantes manualmente
2. Exporta solo una muestra de documentos de `estudiantes-evaluados`

### Error al importar al emulador

Asegúrate de que el formato del export sea compatible:
```bash
firebase emulators:start --import=./firestore-subset --project=[PROJECT-ID]
```

## 📝 Notas

- El subset incluye **solo** los datos necesarios para la Cloud Function
- No incluye otras evaluaciones, usuarios o colecciones
- Ideal para desarrollo local y pruebas
- Reduce significativamente el tiempo de carga del emulador
