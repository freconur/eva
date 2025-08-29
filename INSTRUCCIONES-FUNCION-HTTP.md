# 🚀 Función crearEstudianteDeDocente como Endpoint HTTP

## ✅ Cambios Realizados

He convertido tu función `crearEstudianteDeDocente` de una función `onCall` (callable function) a una función `onRequest` (HTTP function) para que se pueda ejecutar directamente desde una URL.

## 🔗 URL de la Función

```
http://localhost:5001/evaluaciones-ugel/us-central1/crearEstudianteDeDocente
```

## 📋 Pasos para Usar

### 1. Compilar las Funciones
```bash
cd functions
npm run build
```

### 2. Iniciar el Emulador de Firebase
```bash
firebase emulators:start --only functions
```

### 3. Ejecutar la Función

#### Opción A: Desde el Navegador
- Abre el archivo `test-http-function.html` en tu navegador
- Haz clic en el botón "🚀 Ejecutar Función"

#### Opción B: Desde la Terminal (curl)
```bash
curl http://localhost:5001/evaluaciones-ugel/us-central1/crearEstudianteDeDocente
```

#### Opción C: Desde Postman o Insomnia
- Método: `GET`
- URL: `http://localhost:5001/evaluaciones-ugel/us-central1/crearEstudianteDeDocente`

## 🔧 Configuración de la Función

La función está configurada con:
- **Timeout**: 540 segundos (9 minutos)
- **Memoria**: 2GB
- **Máximo de instancias**: 1
- **CORS**: Habilitado para todas las origenes

## 📊 Respuesta de la Función

### Éxito (200)
```json
{
  "success": true,
  "totalDocentes": 25,
  "totalEstudiantes": 25,
  "executionTime": 2.5,
  "message": "Procesamiento iniciado exitosamente"
}
```

### Error (500)
```json
{
  "success": false,
  "error": "Descripción del error"
}
```

## 🚨 Solución de Problemas

### Error: "Function not found"
- Asegúrate de que el emulador esté ejecutándose
- Verifica que las funciones estén compiladas (`npm run build`)

### Error de CORS
- La función ya tiene CORS configurado
- Si persiste, verifica que el paquete `cors` esté instalado

### Error de Timeout
- La función está configurada para 9 minutos máximo
- Para procesos más largos, considera dividir la tarea

## 🌐 Despliegue en Producción

Cuando despliegues a producción, la URL será:
```
https://us-central1-evaluaciones-ugel.cloudfunctions.net/crearEstudianteDeDocente
```

## 📝 Notas Importantes

- La función procesa docentes en lotes para optimizar el rendimiento
- Los resultados se almacenan en la colección `estudiantes-docentes` de cada docente
- La función es asíncrona y no espera a que se complete todo el procesamiento
- Se recomienda monitorear los logs para ver el progreso

## 🔍 Verificar Funcionamiento

1. Abre la consola del emulador de Firebase
2. Ejecuta la función desde el navegador o curl
3. Verifica que aparezcan los logs de procesamiento
4. Revisa la base de datos para confirmar que se crearon los estudiantes
