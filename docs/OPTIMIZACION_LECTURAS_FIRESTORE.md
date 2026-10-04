# Plan de Optimización de Lecturas en Cloud Firestore (UGEL - EVA)

Este documento contiene el diagnóstico técnico exhaustivo, la matriz de prioridades y el plan de acción paso a paso para reducir drásticamente el consumo de lecturas en Firestore dentro del proyecto.

---

## 📊 Matriz de Prioridad e Impacto

| Fase | Tipo de Problema | Impacto Estimado | Dificultad | Estado |
| :--- | :--- | :--- | :--- | :---: |
| **Fase 1** | Listeners huérfanos (`onSnapshot` sin `unsubscribe`) | 40% - 50% de lecturas en sesiones largas | Baja | ✅ Completada |
| **Fase 2** | Consultas N+1 (bucles de consultas anidadas) | Miles de lecturas por cada consulta | Media | ⏳ Pendiente |
| **Fase 3** | Doble listener en el mismo componente | 50% de lecturas en evaluación y reportes | Media | ⏳ Pendiente |
| **Fase 4** | Falta de caché en tablas maestras (`grados`, `categorias`) | Cientos de lecturas por navegación | Baja | ⏳ Pendiente |
| **Fase 5** | Lecturas de colecciones completas para `console.log` | Cientos de lecturas inmediatas | Muy Baja | ✅ Completada |
| **Fase 6** | Funciones inestables en Hooks (re-renders continuos) | Reducción de llamadas innecesarias | Media | ⏳ Pendiente |

---

## 🛠️ Fase 1: Fugas de Listeners (`onSnapshot` Huérfanos)

> **Problema:** Un `onSnapshot` que no retorna su función de limpieza (`unsubscribe`) se mantiene abierto en la memoria del navegador para siempre. Si el usuario navega entre vistas o guarda datos, se acumulan nuevos listeners leyendo los mismos documentos una y otra vez en segundo plano.

### Tareas:
- [x] **1.1 `useUsuario.ts` - `getUsersDirectores` (Líneas 62-79)**
  - **Ubicación:** `features/hooks/useUsuario.ts`
  - **Problema:** Ejecuta `onSnapshot` sin retornar `unsubscribe`. En la línea 109 (`updateDirector`) vuelve a invocar `getUsersDirectores()`, duplicando el listener.
  - **Solución:** Retornar la función `unsubscribe` para que los componentes puedan limpiarlo en el `return () => unsubscribe()` de su `useEffect`, o almacenar la referencia en un `useRef` para cancelar el listener previo antes de crear uno nuevo.

- [x] **1.2 `useUsuario.ts` - `getAllEspecialistas` (Líneas 596-606)**
  - **Ubicación:** `features/hooks/useUsuario.ts`
  - **Problema:** Escucha toda la colección `usuarios` donde `rol == 1` sin función de limpieza. En la línea 612 se vuelve a ejecutar tras cada actualización.
  - **Solución:** Retornar el `unsubscribe` o guardar la suscripción activa.

- [x] **1.3 `useDirectores.tsx` - `getDocentesByDniDirector` (Líneas 33-57)**
  - **Ubicación:** `features/hooks/useDirectores.tsx`
  - **Problema:** Abre un `onSnapshot` para los docentes del director sin función de cancelación.
  - **Solución:** Retornar `unsubscribe`.

- [x] **1.4 `UseEvaluacionEspecialistas.tsx` - `getDataEvaluacion` (Líneas 556-570)**
  - **Ubicación:** `features/hooks/UseEvaluacionEspecialistas.tsx`
  - **Problema:** Lanza dos `onSnapshot` simultáneos (uno al documento y otro a toda la colección `/evaluaciones-especialista`) sin retornar limpieza.
  - **Solución:** Si los datos solo se necesitan una vez al cargar la vista, cambiar a `getDoc` y `getDocs`, o retornar una función combinada de limpieza.

- [x] **1.5 `UseEvaluacionEspecialistas.tsx` - `getHistorialEspecialista` (Líneas 1464-1477)**
  - **Ubicación:** `features/hooks/UseEvaluacionEspecialistas.tsx`
  - **Problema:** Envuelve `onSnapshot` en un `new Promise((resolve) => ...)`. La promesa resuelve la primera vez, pero el listener queda activo permanentemente consumiendo lecturas ante cada cambio.
  - **Solución:** Reemplazar el `onSnapshot` por un simple `getDocs(q)`.

- [x] **1.6 `useOptions.tsx` - `getCaracteristicaCurricular` (Líneas 15-29)**
  - **Ubicación:** `features/hooks/useOptions.tsx`
  - **Problema:** No cancela la suscripción previa ni retorna el `unsubscribe`.
  - **Solución:** Guardar en `useRef` la función `unsubscribe` y limpiarla, además de retornarla.

- [x] **1.7 `useEspecialistasRegionales.tsx` - `getEspecialistasRegionales` y `getEspecialistasUgel` (Líneas 58-82)**
  - **Ubicación:** `features/hooks/useEspecialistasRegionales.tsx`
  - **Problema:** Ambos escuchan la colección `usuarios` sin retorno de `unsubscribe`.
  - **Solución:** Retornar las funciones de limpieza correspondientes.

- [x] **1.8 `useTituloDeCabecera.tsx` - `getEvaluacionEscalaLikert` (Línea 202)**
  - **Ubicación:** `features/hooks/useTituloDeCabecera.tsx`
  - **Problema:** `onSnapshot` sobre el documento sin retornar la función de cancelación.
  - **Solución:** Retornar `unsubscribe`.

---

## 🔄 Fase 2: Eliminación de Consultas N+1 (Bucles de Lecturas)

> **Problema:** Ocurre cuando se consulta una lista de elementos (ej. 30 docentes) y luego, dentro de un `.map()` o `.forEach()`, se hace una consulta adicional a Firestore por cada uno de ellos.

### Tareas:
- [ ] **2.1 `useDirectores.tsx` - Subcolección `estudiantes-docentes` en bucle (Líneas 43-53)**
  - **Ubicación:** `features/hooks/useDirectores.tsx`
  - **Problema:** Para cada docente traído por el director, ejecuta `getDocs(collection(db, 'usuarios', docenteDni, 'estudiantes-docentes'))`. Con 40 docentes son 41 consultas automáticas, y cada vez que cambia un docente se repiten las 41.
  - **Solución:** Guardar un contador agregado en el documento del docente (`totalEstudiantes`, `estudiantesPorGrado`) o cargar los datos bajo demanda únicamente cuando el usuario despliegue la fila del docente.

- [ ] **2.2 `useReporteDirectores.tsx` - Bucle en `promesasEstudiantes` (Líneas 254-263)**
  - **Ubicación:** `features/hooks/useReporteDirectores.tsx`
  - **Problema:** Itera los profesores del director y realiza un `getDocs` individual a la subcolección `estudiantes-docentes` por cada profesor.
  - **Solución:** Usar `collectionGroup('estudiantes-docentes')` filtrado por `dniDirector`, o consolidar los datos de estudiantes a nivel de director.

- [ ] **2.3 `UseEvaluacionDocentes.tsx` (L659-672) y `UseEvaluacionDirectores.tsx` (L385-405)**
  - **Ubicación:** `features/hooks/UseEvaluacionDocentes.tsx` y `features/hooks/UseEvaluacionDirectores.tsx`
  - **Problema:** Trae los directores de la UGEL y luego ejecuta un `getDocs` por cada director a `/evaluaciones-docentes/${idEvaluacion}/${director}`.
  - **Solución:** Leer del consolidado regional o realizar una única consulta agrupada.

- [ ] **2.4 `useMatrizResultados.ts` - Resolución de directores sin región (Líneas 478-500)**
  - **Ubicación:** `features/hooks/useMatrizResultados.ts`
  - **Problema:** Para directores sin región, itera meses candidatos y directores haciendo `getDocs(qDir)` con `limit(1)` por cada uno (hasta cientos de lecturas).
  - **Solución:** Consultar los perfiles de esos directores directamente en `usuarios` por lotes con `where(documentId(), 'in', chunk)` en una sola consulta.

---

## ⚡ Fase 3: Unificación de Listeners Dobles y Redundantes

> **Problema:** Dos o tres listeners escuchan la misma subcolección de estudiantes al mismo tiempo en la misma pantalla.

### Tareas:
- [ ] **3.1 `EvaluarEstudianteForm.tsx` - Listeners cruzados en el formulario de evaluación**
  - **Ubicación:** `components/evaluar/EvaluarEstudianteForm.tsx` (Líneas 81 y 497)
  - **Problema:** El efecto en L81 monta un `onSnapshot` a `estudiantes-evaluados`. En L497, `obtenerEstudianteDeEvaluacion` monta otro `onSnapshot` a la misma ruta y anida un listener a `estudiantes-docentes`.
  - **Solución:** Unificar en un solo listener centralizado de estudiantes evaluados para el docente, derivando la lista de "pendientes" en memoria sin necesidad de listeners duplicados.

- [ ] **3.2 `useReporteDocente.tsx` - Doble escucha en vistas de reporte**
  - **Ubicación:** `features/hooks/useReporteDocente.tsx` y páginas de reporte
  - **Problema:** Se ejecuta `estudiantesQueDieronExamenPorMes` (que hace 12 queries `count()` + listeners a todos los meses con datos), y simultáneamente en el mismo `useEffect` se llama a `estadisticasEstudiantesDelDocente` (abriendo un segundo listener para el mes activo).
  - **Solución:** Mantener un solo listener activo para el mes que el docente está visualizando actualmente.

- [ ] **3.3 `useEvaluacionCurricular.tsx` - `getInstrumentos` doble lectura consecutiva (Líneas 1285-1294)**
  - **Ubicación:** `features/hooks/useEvaluacionCurricular.tsx`
  - **Problema:** Ejecuta `await getDocs(pathRef)` y en la línea siguiente ejecuta `onSnapshot(pathRef)`.
  - **Solución:** Eliminar el `await getDocs(pathRef)` innecesario, ya que `onSnapshot` entrega los datos iniciales de inmediato.

---

## 📦 Fase 4: Caché en Memoria para Tablas Maestras (`categorias`, `grados`)

> **Problema:** Tablas maestras estáticas se consultan mediante `getDocs` en cada cambio de ruta o al abrir cualquier modal.

### Tareas:
- [ ] **4.1 `getCategories` en `useAgregarEvaluaciones.tsx` (Línea 419)**
  - **Ubicación:** `features/hooks/useAgregarEvaluaciones.tsx`
  - **Páginas afectadas:** 9 vistas (secundaria, inicial, tercerNivel, modales de creación).
  - **Solución:** 
    ```tsx
    const getCategories = async () => {
      if (categorias && categorias.length > 0) return; // Ya existe en GlobalContext
      // Solo si está vacío, consultar Firestore
    };
    ```

- [ ] **4.2 `getGrades` en `useAgregarEvaluaciones.tsx` (Línea 405)**
  - **Ubicación:** `features/hooks/useAgregarEvaluaciones.tsx`
  - **Páginas afectadas:** 11 vistas y modales.
  - **Solución:** Verificar si `grados && grados.length > 0` en el estado global antes de hacer `getDocs(refGrados)`.

- [ ] **4.3 `todasLasEvaluaciones` en `useSeguimientoEvaluaciones.tsx` (Línea 64)**
  - **Ubicación:** `features/hooks/useSeguimientoEvaluaciones.tsx`
  - **Problema:** Hace un `getDocs(collection(db, 'evaluaciones'))` sin filtros ni paginación.
  - **Solución:** Añadir paginación o filtrar únicamente las evaluaciones activas/necesarias.

---

## 🧹 Fase 5: Eliminación de Consultas Fantasma para `console.log`

> **Problema:** Se descargan colecciones enteras de cientos de documentos solo para imprimir su tamaño en consola.

### Tareas:
- [x] **5.1 `useReporteAdmin.ts` (Líneas 341-372)**
  - **Ubicación:** `features/hooks/useReporteAdmin.ts`
  - **Problema:** Realizaba `const directores = await getDocs(q)` sobre todos los directores de la base de datos sin filtrar por nivel institucional solo para imprimir `directores.size`, y luego ejecutaba consultas redundantes en lotes de 30 contra `usuarios` para los directores participantes.
  - **Solución:** Se añadió filtro por `targetNivel` (`nivelDeInstitucion: array-contains targetNivel`) para leer solo los directores del nivel de la evaluación, se eliminaron los `console.log` de tamaño y se pobló `directorDetails` directamente desde `directores.docs` sin consultas secundarias duplicadas.

- [x] **5.2 `useReporteEspecialistas.tsx` (Líneas 778-781)**
  - **Ubicación:** `features/hooks/useReporteEspecialistas.tsx`
  - **Problema:** Consulta fantasma que descargaba todos los directores (`where('rol', '==', 2)`) únicamente para hacer `console.log('cantidad total de directores', directores.size)`, sin usar la variable en absoluto.
  - **Solución:** Se eliminó la consulta fantasma y los `console.log` asociados.

- [x] **5.3 Mejoras adicionales detectadas (`useEvaluacionCurricular.tsx`)**
  - **Ubicación:** `features/hooks/useEvaluacionCurricular.tsx`
  - **Problema:** En `createEvaluacionCurricular` se descargaban todos los documentos de `evaluacion-curricular` con `getDocs` únicamente para calcular `response.size + 1`. Además, en `getDirectoresDeLaRegionEvaluadosCC` existía una consulta `q2` no utilizada.
  - **Solución:** Se reemplazó la lectura masiva por `getCountFromServer` (0 lecturas de documentos) y se eliminó la consulta `q2` muerta.

---

## 🎯 Fase 6: Estabilización de Funciones en Custom Hooks (`useCallback`)

> **Problema:** Al no usar `useCallback`, cada re-render del componente crea nuevas referencias de función en memoria, disparando `useEffect` redundantes en componentes hijos.

### Tareas:
- [ ] Envolver funciones principales de los hooks en `useCallback`:
  - `useAgregarEvaluaciones.tsx`: `getEvaluacion`, `getPreguntasRespuestas`, `getCategories`, `getGrades`.
  - `useUsuario.ts`: `getUserData`, `getDirectorById`.
  - `useReporteDocente.tsx`: `estudiantesQueDieronExamenPorMes`.
- [ ] Evitar objetos literales como dependencias directas en `useEffect` cuando provienen de `useGlobalContext()`.

---

## 📈 Métricas de Seguimiento

Para comprobar la efectividad de cada fase implementada:
1. Ir a **Google Cloud Console** > **Firestore** > pestaña **Uso**.
2. Revisar la métrica de **Operaciones de Lectura de Documentos**.
3. Comparar las lecturas diarias antes y después de cada fase completada.
