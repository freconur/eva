# Optimización de la Base de Datos — Plataforma COMPETENCE-LAB

## Resumen Ejecutivo

Se realizaron mejoras internas en la forma en que la plataforma almacena y procesa la información de las evaluaciones, logrando **reducir el tamaño de la base de datos de 85 GB a aproximadamente 30 GB** (una reducción del ~65%). Esto se traduce directamente en un **ahorro significativo en los costos mensuales** de operación del sistema.

---

## ¿Cuál era el problema?

La plataforma COMPETENCE-LAB maneja un volumen considerable de información: aproximadamente **100 evaluaciones activas** con un promedio de **10,000 estudiantes evaluados por cada una**, lo que suma cerca de **1,000,000 de registros de respuestas** almacenados.

Sin embargo, la base de datos estaba ocupando **85 GB de espacio**, un tamaño excesivo para la cantidad real de información contenida. Esto se debía a tres causas principales:

### 1. Información duplicada innecesariamente

Cuando un docente registraba la evaluación de un estudiante, el sistema guardaba **la misma información en tres lugares diferentes** dentro de la base de datos:

| Copia | Propósito original |
|-------|-------------------|
| Copia 1 | Para que el docente vea sus propios estudiantes |
| Copia 2 | Para el directorio general de alumnos |
| Copia 3 | Para los reportes y estadísticas generales |

Esta triplicación significa que por cada estudiante evaluado, se almacenaban **3 copias idénticas** de sus respuestas, multiplicando el espacio utilizado por 3.

### 2. Índices automáticos excesivos

La base de datos crea automáticamente un sistema interno de búsqueda rápida (llamado "índice") para cada dato almacenado. Con documentos que contienen ~30 datos cada uno (nombre, DNI, respuestas a 25 preguntas, etc.), se generaban **60 índices automáticos por cada registro de estudiante**.

Multiplicado por 1,000,000 de registros, estos índices llegaban a ocupar **3 a 4 veces más espacio** que la información real.

### 3. Procesos de consulta ineficientes

Cada vez que se generaba un reporte o consolidado, el sistema descargaba **toda la información de todos los estudiantes** (incluyendo el detalle completo de cada respuesta) aunque solo necesitara datos básicos como nombre, puntaje y nivel. Esto no solo era lento, sino que consumía un alto volumen de transferencia de datos facturada.

---

## ¿Qué se hizo para solucionarlo?

### A. Eliminación de datos duplicados (Fuente Única de Verdad)

Se reestructuró el sistema para que la información de cada estudiante evaluado se almacene **en un solo lugar** (la colección central de evaluaciones), eliminando las copias redundantes.

| Antes | Después |
|-------|---------|
| 3 copias de cada evaluación por estudiante | 1 sola copia por estudiante |
| ~3,000,000 de registros en total | ~1,000,000 de registros en total |

> **Impacto estimado:** Reducción de ~57 GB a ~19 GB solo en datos brutos.

### B. Desactivación de índices innecesarios

Se identificaron los campos que **nunca se usan para buscar o filtrar** información (como el detalle de cada respuesta individual de los alumnos) y se desactivaron sus índices automáticos. Esto libera espacio sin afectar ninguna funcionalidad del sistema.

> **Impacto estimado:** Reducción adicional de ~15-20 GB en índices eliminados.

### C. Consultas inteligentes (Proyección de campos)

Se optimizó la forma en que el sistema solicita información a la base de datos. Ahora, cuando se genera un reporte de Excel o un consolidado, el sistema **solo descarga los datos que realmente necesita** (nombre, DNI, puntaje, nivel), omitiendo el detalle pesado de las respuestas individuales que no se incluye en esos reportes.

| Antes | Después |
|-------|---------|
| Se descargaba el 100% de cada registro (~5 KB) | Se descarga solo lo necesario (~0.5 KB) |
| Descarga de ~5 GB por consolidado | Descarga de ~0.5 GB por consolidado |

### D. Corrección de errores en el procesamiento de reportes

Se corrigió un problema que causaba que el botón **"Generar Consolidado"** no actualizara correctamente todos los gráficos. El reporte de evaluación por pregunta mostraba datos antiguos (almacenados en caché) en lugar de los datos actualizados, produciendo inconsistencias visibles entre los diferentes gráficos del reporte (por ejemplo, el total de estudiantes no coincidía entre el gráfico de torta y la tabla).

---

## Impacto en Costos

### Almacenamiento mensual de la Base de Datos

| Concepto | Antes (85 GB) | Después (~30 GB) | Ahorro |
|----------|:-------------:|:-----------------:|:------:|
| Costo en USD | $15.31 USD/mes | ~$5.40 USD/mes | **~$9.91 USD/mes** |
| Costo en Soles (PEN) | S/. 53.31/mes | ~S/. 18.80/mes | **~S/. 34.51/mes** |

*Tipo de cambio referencial: 1 USD = 3.48 PEN. Tarifa de Google Cloud Firestore: $0.18 USD por GB al mes.*

### Operaciones de lectura (Transferencia de datos)

| Concepto | Antes | Después | Ahorro |
|----------|:-----:|:-------:|:------:|
| Lecturas mensuales estimadas | ~11.8 millones | ~4-5 millones | **~50-60% menos** |
| Costo en Soles (PEN) | S/. 21.89/mes | ~S/. 9-12/mes | **~S/. 10-13/mes** |

### Resumen de ahorro mensual estimado

| Rubro | Ahorro mensual |
|-------|:--------------:|
| Almacenamiento | ~S/. 34.51 |
| Lecturas | ~S/. 10.00 |
| **Total estimado** | **~S/. 44.51/mes** |
| **Ahorro anual estimado** | **~S/. 534.00/año** |

---

## ¿Qué cambia para los usuarios?

### Lo que NO cambia:
- ✅ La interfaz se ve y funciona exactamente igual
- ✅ Los reportes, gráficos y consolidados muestran la misma información
- ✅ Los docentes siguen evaluando a sus estudiantes de la misma manera
- ✅ Los directores y especialistas acceden a sus reportes sin cambios

### Lo que SÍ mejora:
- ⚡ **Reportes más rápidos:** La generación de consolidados y reportes Excel es significativamente más veloz
- 📊 **Datos más precisos:** Se corrigieron inconsistencias entre los gráficos del reporte de evaluación por pregunta
- 💰 **Menor costo de operación:** La factura mensual de la base de datos se reduce en aproximadamente un 60%
- 🛡️ **Mayor estabilidad:** Se reducen los riesgos de errores por falta de memoria al procesar grandes volúmenes de datos

---

## Cronología de los Cambios

| Fecha | Acción realizada |
|-------|-----------------|
| Junio 2026 | Análisis de la estructura de datos y diagnóstico de causas del consumo excesivo |
| Junio 2026 | Refactorización del modelo de datos: consolidación en fuente única de verdad |
| Junio 2026 | Optimización de consultas con proyección de campos |
| Junio 2026 | Corrección del bug de caché en reportes de evaluación por pregunta |
| Junio 2026 | Despliegue de las funciones optimizadas en producción |

---

## Consideración Importante sobre la Facturación del Mes Actual

> ⚠️ **El proceso de optimización en sí mismo genera consumo de operaciones.**

Para llevar a cabo esta reestructuración, fue necesario:

1. **Leer** todos los registros existentes para identificar los datos duplicados y verificar la integridad de la información (~1,000,000 de lecturas).
2. **Escribir** los datos consolidados en la nueva estructura unificada (escrituras de migración).
3. **Eliminar** las copias redundantes que ya no son necesarias (~2,000,000 de eliminaciones).

Estas operaciones de lectura, escritura y eliminación son **un costo único** que se refleja en la factura del **mes en curso** (Junio 2026).

Sin embargo, dado que estos cambios se realizaron a **mediados de mes**, los últimos ~15 días de Junio ya operan con la nueva estructura optimizada. Esto significa que durante esa segunda mitad del mes:

- 📉 El **almacenamiento** ya se redujo de 85 GB a ~30 GB, por lo que se cobra menos por cada día restante.
- 📉 Las **lecturas diarias** ya son menores porque el sistema consulta menos datos en cada operación.
- 📉 Las **eliminaciones** de datos duplicados ya liberaron espacio que deja de facturarse.

| Periodo | Qué sucede |
|---------|-----------|
| 1ra mitad de Junio (antes de la optimización) | Costos normales a tarifa de 85 GB |
| Proceso de migración (mediados de Junio) | Consumo puntual de operaciones de lectura, escritura y eliminación |
| 2da mitad de Junio (después de la optimización) | **Costos ya reducidos** por operar con ~30 GB y menos lecturas |
| **Julio 2026 en adelante** | **Primer mes completo con los ahorros al 100%** |

**En resumen:** Aunque el proceso de migración generó un consumo puntual de operaciones, los ahorros de la segunda mitad de Junio ya compensan parcialmente ese costo. A partir de **Julio 2026**, se verá el beneficio completo reflejado en la factura.

---

## Nota Final

> La reducción de 85 GB a ~30 GB se materializará progresivamente conforme Google Cloud procese la eliminación de los datos duplicados y los índices desactivados. Este proceso puede tomar entre **24 a 72 horas** desde el momento del despliegue para reflejarse completamente en el panel de almacenamiento y en la facturación.

---

*Documento preparado por el equipo de desarrollo — Junio 2026*
