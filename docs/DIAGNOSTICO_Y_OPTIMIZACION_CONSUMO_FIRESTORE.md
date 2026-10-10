# Diagnóstico y Plan de Optimización de Consumo en Cloud Firestore (UGEL - EVA)

Este documento detalla el análisis arquitectónico, desglose matemático, costos reales y el plan de optimización a futuro para las operaciones de **escritura** y **lectura** en Firebase Cloud Firestore durante el proceso de evaluación de estudiantes.

---

## 📌 1. Contexto y Métricas Reales (Octubre)

Durante el inicio de las evaluaciones de estudiantes en octubre, se registraron las siguientes métricas de consumo en la consola de Firebase:
* **Escrituras acumuladas:** ~6.3 Millones
* **Lecturas acumuladas:** ~7.9 Millones

### 💵 Análisis de Costos Reales (Plan Blaze de Google Cloud)
A pesar de que las cifras en "millones" puedan parecer alarmantes, la tarifa estándar de Firestore es por cada 100,000 operaciones:
* **Costo de Escrituras:** \$0.18 USD por 100,000 escrituras (\$1.80 por Millón).
  $$\text{Costo Escrituras} = 6.3 \times \$1.80 = \mathbf{\$11.34\text{ USD}}$$
* **Costo de Lecturas:** \$0.06 USD por 100,000 lecturas (\$0.60 por Millón).
  $$\text{Costo Lecturas} = 7.9 \times \$0.60 = \mathbf{\$4.74\text{ USD}}$$
* **Total aproximado en base de datos:** **~\$16.08 USD** (aprox. **S/. 60 a S/. 75 Soles**).

> **Conclusión Financiera:** No representa un sobrecosto crítico inmediato, pero si la plataforma escala a 500,000 o 1,000,000 de evaluaciones sin optimizar, el consumo alcanzaría entre 30M y 60M de escrituras.

---

## 🔍 2. Causa Raíz de las 6.3 Millones de Escrituras

Cada vez que un profesor hace clic en **«Guardar evaluación»** en `EvaluarEstudianteForm.tsx`, el sistema ejecuta la siguiente cadena:

### Fórmula Exacta de Escrituras por Alumno:
$$\text{Total de Escrituras} = \mathbf{5 + (3 \times N_{\text{preguntas}})}$$

Para una evaluación estándar de **20 preguntas**:
$$5 + (3 \times 20) = \mathbf{65\text{ escrituras por cada estudiante}}$$

### Desglose por Operación:
1. **Frontend (`useAgregarEvaluaciones.tsx`):**
   * `setDoc` en `/usuarios/{dniDocente}/estudiantes-docentes/{dniEstudiante}` (**1 escritura**).
2. **Backend (`aggregateStudentEvaluationRealtime.ts` - `batch.commit()`):**
   * **1 escritura:** Documento individual del estudiante en `/evaluaciones/{id}/estudiantes-evaluados/{año}/{mes}/{dni}`.
   * **1 escritura:** Consolidado acumulado del Docente en `.../consolidados_realtime_profesores/{dniDocente}`.
   * **1 escritura:** Consolidado acumulado del Director en `.../consolidados_realtime_directores/{dniDirector}`.
   * **1 escritura:** Consolidado acumulado de la UGEL/Región en `.../consolidados_realtime_regiones_{año}_{mes}/{regionId}`.
   * **$3 \times N$ escrituras:** Contadores fragmentados (*shards*) por cada una de las preguntas:
     * 1 escritura por pregunta para el acumulado Global (`items/{qId}/shards/shard_{id}`).
     * 1 escritura por pregunta para el acumulado por UGEL (`items/{qId}/regiones/{regionId}/shards/shard_{id}`).
     * 1 escritura por pregunta para el acumulado por Distrito (`items/{qId}/.../distritos/{distritoId}/shards/shard_{id}`).

### Validación Matemática:
$$100,000\text{ evaluaciones registradas} \times 63\text{ escrituras promedio} \approx \mathbf{6.3\text{ Millones de Escrituras}}$$

---

## 🔍 3. Causa Raíz de las 7.9 Millones de Lecturas

Las lecturas se concentran en cuatro puntos críticos:

1. **Listener en Tiempo Real del Formulario del Docente (`onSnapshot`):**
   * En `components/evaluar/EvaluarEstudianteForm.tsx` (Líneas 81-100), se mantiene un listener activo sobre los estudiantes evaluados del docente.
   * Cada vez que el docente guarda a un alumno nuevo, el listener vuelve a consultar la lista acumulada:
     $$1 + 2 + 3 + \dots + 30 = \mathbf{465\text{ lecturas por aula}}$$
     (En vez de solo 30 lecturas).
2. **Lecturas de Validación en la Cloud Function:**
   * En cada invocación de `aggregateStudentEvaluationRealtime`, la función realiza lecturas previas (`studentSnap`, `dirUserSnap`, `docenteSnap`, `directorSnap`) $\to$ **350,000 a 400,000 lecturas** para 100k alumnos.
3. **Consultas sin Consolidar en Reportes de Directores (`getReporteDirector.ts`):**
   * La función consulta los documentos individuales de los estudiantes mediante `where in` de docentes.
   * Un director con 500 alumnos consume 500 lecturas cada vez que entra o recarga el reporte.
4. **Descargas Masivas a Excel (`traerTodosEstudiantesEvaluados.ts`):**
   * Lee la totalidad de documentos de la colección de estudiantes (decenas de miles de lecturas por descarga).

---

## 🚀 4. Plan de Optimización para Futura Implementación

### Fase 1: Reducción Masiva de Escrituras (Reducción Estimada: ~92%)
* **Problema actual:** Se escriben 3 documentos *shards* por separado para cada una de las preguntas ($3 \times 20 = 60$ escrituras).
* **Solución propuesta:**
  * En lugar de shards individuales por pregunta en colecciones anidadas, almacenar el mapa acumulativo de respuestas de las 20 preguntas agrupadas dentro de:
    1. El documento del Director (`consolidados_realtime_directores`).
    2. El documento de la Región (`consolidados_realtime_regiones`).
  * Solo utilizar shards deterministas (1 a 3 shards) a nivel de documento global si el tráfico simultáneo en el mismo segundo lo requiere.
* **Impacto:**
  * De **65 escrituras** por alumno a solo **4 o 5 escrituras**.
  * 100,000 evaluaciones pasarán de **6.3 Millones a menos de 500,000 escrituras**.

### Fase 2: Optimización del Formulario de Evaluación (Reducción Estimada: ~80% de lecturas del docente)
* **Archivo:** `components/evaluar/EvaluarEstudianteForm.tsx`
* **Solución propuesta:**
  * Reemplazar el listener `onSnapshot` por una consulta inicial única (`getDocs`) al cargar el formulario.
  * Al guardar exitosamente una evaluación, agregar el estudiante al estado local de React (`setEstudiantesEvaluadosRealtime(prev => [nuevo, ...prev])`) sin volver a consultar Firestore.

### Fase 3: Conexión de Reportes a los Consolidados Existentes
* **Archivos:** `functions/src/getReporteDirector.ts` y componentes de visualización.
* **Solución propuesta:**
  * Ya existen los documentos en `consolidados_realtime_directores/{dniDirector}` con `totalEstudiantes`, `sumaPuntajes`, `niveles` y `preguntas`.
  * Modificar `getReporteDirector` para que lea **únicamente ese documento consolidado** (1 lectura) para renderizar métricas y gráficos, en lugar de descargar a los 500 estudiantes de la institución educativa.

### Fase 4: Caché en Memoria dentro de Cloud Functions
* **Archivo:** `functions/src/aggregateStudentEvaluationRealtime.ts`
* **Solución propuesta:**
  * Implementar una caché en memoria de corta duración (LRU cache o mapa global de instancia) para los perfiles de director (`usuarios/${dniDirector}`) y docentes, evitando releer los mismos datos estáticos de usuario en cada ejecución si el contenedor de Cloud Functions se mantiene caliente.

---

## 📋 Resumen de Ahorro Proyectado

| Métrica | Consumo Actual (100k alumnos) | Consumo Optimizado | Reducción |
| :--- | :---: | :---: | :---: |
| **Escrituras** | ~6,300,000 | ~450,000 | **-92.8%** |
| **Lecturas** | ~7,900,000 | ~1,200,000 | **-84.8%** |
| **Costo Aprox.** | \$16.00 USD | \$1.50 USD | **-90.6%** |
