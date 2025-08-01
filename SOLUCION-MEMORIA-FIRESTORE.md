# 🔧 Solución para problemas de memoria en Firestore Emulator

## 📊 Diagnóstico del problema

- **Base de datos**: 1.7GB de datos exportados
- **Memoria inicial disponible**: 2.8GB (insuficiente)
- **Memoria después de optimización**: 14GB (suficiente)
- **Error**: `java.lang.OutOfMemoryError: Java heap space`

## 🚀 Soluciones implementadas

### Opción 1: Carga completa optimizada (RECOMENDADA)

Ejecuta el script optimizado para cargar toda la base de datos:

```bash
./start-emulator-optimized.sh
```

**Configuración:**
- Java Heap: 16GB máximo, 4GB inicial
- Node.js: 8GB
- Garbage Collector: G1GC optimizado
- Carga completa: 1.7GB de datos

### Opción 2: Carga parcial para pruebas

Si la opción 1 aún falla, usa carga parcial:

```bash
./start-emulator-partial.sh
```

**Configuración:**
- Java Heap: 8GB máximo, 2GB inicial
- Node.js: 4GB
- Datos: Solo primeros 100 archivos (~200MB)

### Opción 3: Configuración manual

Si prefieres usar tus comandos originales con la nueva configuración:

```bash
# Liberar memoria primero
pkill -f msedge  # Cierra Edge si está abierto
sudo sync && sudo sysctl vm.drop_caches=3

# Configuración optimizada
export JAVA_TOOL_OPTIONS="-Xmx16G -Xms4G -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
export NODE_OPTIONS="--max-old-space-size=8192"

# Ejecutar emulador
firebase emulators:start --import=./eva-ugel-emulator-firestore/2025-07-26T18:11:07_9471/ --export-on-exit
```

## ⚠️ Antes de ejecutar cualquier script

1. **Cierra aplicaciones innecesarias** (especialmente navegadores)
2. **Verifica memoria disponible**: `free -h`
3. **Asegúrate de tener al menos 12GB libres**

## 🔍 Monitoreo durante la ejecución

Para monitorear el uso de memoria mientras se ejecuta:

```bash
# En otra terminal
watch -n 5 'free -h && echo "---" && ps aux --sort=-%mem | head -5'
```

## 🆘 Si aún tienes problemas

### Reducir aún más la base de datos:
```bash
# Crear subset más pequeño (primeros 50 archivos)
./start-emulator-partial.sh
# Edita el script y cambia head -100 por head -50
```

### Verificar configuración de sistema:
```bash
# Verificar límites del sistema
ulimit -a
# Verificar memoria swap
swapon --show
```

### Última opción - Usar base de datos vacía:
```bash
# Ejecutar sin importar datos
firebase emulators:start --only=firestore
```

## 📈 Optimizaciones implementadas

1. **Gestión de memoria Java**: Uso de G1GC para mejor manejo de heap grande
2. **Configuración específica de Firestore**: `singleProjectMode` activado
3. **Limpieza de memoria del sistema**: Scripts automáticos de liberación
4. **Carga gradual**: Opción de subset para pruebas

## ✅ Verificación de éxito

El emulador se ha iniciado correctamente cuando veas:

```
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! It is now safe to connect your app. │
└─────────────────────────────────────────────────────────────┘

┌──────────┬────────────────┬─────────────────────────────────┐
│ Emulator │ Host:Port      │ View in Emulator UI             │
├──────────┼────────────────┼─────────────────────────────────┤
│ Firestore│ 127.0.0.1:8080│ http://127.0.0.1:4000/firestore │
└──────────┴────────────────┴─────────────────────────────────┘
```

## 🏃‍♂️ Próximos pasos

Una vez que el emulador esté funcionando:

1. Accede a la UI en: http://127.0.0.1:4000
2. Verifica que los datos se hayan importado correctamente
3. Conecta tu aplicación usando: `export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` 