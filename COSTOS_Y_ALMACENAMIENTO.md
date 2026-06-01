# Análisis de Costos y Almacenamiento - Cloud Firestore

Este documento detalla la estructura de costos de Cloud Firestore, la explicación de las discrepancias entre la facturación real de Google Cloud Platform (GCP) y el panel de administración, y estrategias para optimizar y reducir los costos de almacenamiento.

---

## 1. Desglose y Conciliación de la Factura de GCP

De acuerdo con el análisis de la facturación real del proyecto, los costos mensuales de Firestore se dividen en dos conceptos principales (bajo el servicio `App Engine` en la consola de facturación):

### A. Operaciones de Lectura (`Cloud Firestore Read Ops`)
* **Uso en Factura:** `11,839,859` lecturas.
* **Costo Facturado:** `S/. 21.89 PEN` (Soles).
* **Conciliación Matemática:**
  1. **Deducción de la Cuota Gratuita (Free Tier):** Firestore ofrece **50,000 lecturas gratuitas al día**. En un ciclo de 30 días, esto equivale a `1,500,000` lecturas gratis.
     $$\text{Lecturas Facturables} = 11,839,859 - 1,500,000 = 10,339,859$$
  2. **Cálculo de Costo en USD:** La tarifa estándar es de **$0.06 USD por cada 100,000 lecturas**.
     $$\text{Costo Neto (USD)} = \frac{10,339,859}{100,000} \times \$0.06 = \$6.2039\text{ USD}$$
  3. **Conversión a Soles (PEN):** Aplicando el tipo de cambio oficial de Google (aprox. **3.5284**):
     $$\$6.2039\text{ USD} \times 3.5284 = \mathbf{S/. 21.89\text{ PEN}}$$
     *(Coincide de forma exacta con la factura).*

### B. Almacenamiento en Base de Datos (`Cloud Firestore Storage`)
* **Uso en Factura:** `85.06` Gibibyte-Mes (GB-month).
* **Costo Facturado:** `S/. 53.31 PEN` (Soles).
* **Conciliación Matemática:**
  1. **Cálculo de Costo en USD:** La tarifa estándar para almacenamiento multi-región de Firestore es de **$0.18 USD por GB al mes**.
     $$85.06\text{ GB} \times \$0.18\text{ USD} = \$15.3108\text{ USD}$$
  2. **Conversión a Soles (PEN):** Aplicando el tipo de cambio oficial de Google (aprox. **3.4818**):
     $$\$15.3108\text{ USD} \times 3.4818 = \mathbf{S/. 53.31\text{ PEN}}$$
     *(Coincide de forma exacta con la factura).*

---

## 2. Diferencia entre Storage (Archivos) y Firestore (Base de Datos)

Es fundamental distinguir los dos servicios de almacenamiento que ofrece Firebase, ya que operan y se facturan de forma independiente:

| Servicio | Propósito | Tamaño Actual | Costo |
| :--- | :--- | :--- | :--- |
| **Firebase Storage** | Archivos binarios directos (Imágenes subidas por usuarios, PDFs, documentos adjuntos). | **`1.02 GB`** (aprox. 1,100 objetos) | Costo mínimo (dentro del rango gratuito o céntimos). |
| **Cloud Firestore** | Base de datos NoSQL estructurada (Documentos de texto de usuarios, respuestas, logs, evaluaciones e índices). | **`85.06 GB`** | **`S/. 53.31 PEN`** |

---

## 3. ¿Por qué la Base de Datos Pesa 85.06 GB?

Para una aplicación educativa o administrativa, 85.06 GB de texto puro es un tamaño considerable. Considerando la escala del proyecto (**100 evaluaciones activas con una media de 10,000 estudiantes evaluados en cada una**), el total de registros ronda **1,000,000 de documentos de respuestas**.

El tamaño de 85.06 GB se debe principalmente a tres factores:

1. **Repetición de Esquema (Metadata):** Al ser una base de datos NoSQL, cada documento individual guarda el nombre del campo junto con su valor (ej. `"dniEstudiante": "12345678"`). Al multiplicar esta metadata por 1,000,000 de documentos, la sobrecarga de bytes es significativa.
2. **Índices de Campo Único (Automáticos):** Por defecto, Firestore genera índices ascendentes y descendentes automáticos para **cada campo** en cada documento de una colección. Si un documento de respuestas contiene 25 preguntas e información del alumno (30 campos en total), Firestore crea **60 índices automáticos por registro**. El almacenamiento de estos índices automáticos es el principal responsable de inflar el tamaño de la base de datos (llegando a multiplicar por 3 o 4 el peso de los datos reales).
3. **Posibles Archivos en Base64:** Si en alguna sección de la aplicación (como firmas, fotos de perfil o respuestas de desarrollo) se guardan archivos codificados como cadenas de texto Base64 directamente dentro de un campo de Firestore en lugar de subirlos a Firebase Storage, el tamaño de cada documento individual se incrementará drásticamente.

---

## 4. Guía Práctica de Optimización de Costos

Para reducir el tamaño de la base de datos Firestore y disminuir el cobro por almacenamiento, se recomiendan las siguientes acciones:

### A. Crear Exenciones de Índices de Campo Único (Recomendado)
Puedes desactivar los índices automáticos para los campos que **nunca** vas a usar para realizar filtros (`where`) o para ordenar (`orderBy`). Por ejemplo, las respuestas a preguntas individuales de los alumnos no necesitan ser indexadas.

**Pasos para configurar exenciones:**
1. Ve a la **Consola de Firebase** > **Firestore Database** > pestaña **Índices**.
2. Selecciona la sub-pestaña **Campo único (Single Field)**.
3. Haz clic en **Agregar exención**.
4. Ingresa el ID de la colección (ej. `evaluaciones-docentes` o `evaluaciones`) y el nombre del campo (ej. `respuestas`).
5. Desmarca los índices de campo único (tanto Ascendente como Descendente) y la indexación de mapas/arreglos si no los necesitas.
6. Guarda la exención. 

*Nota: Google Cloud tardará unos minutos en procesar el cambio y eliminar los índices redundantes de sus servidores, lo que liberará espacio en disco de inmediato.*

### B. Validar Carga de Archivos
Asegúrate de que no existan flujos de registro donde el cliente envíe imágenes o archivos incrustados en formato Base64. Toda imagen o PDF debe subirse mediante el SDK de Firebase Storage, guardando en Firestore únicamente la URL de descarga (un string de pocos bytes).

### C. Políticas de Limpieza de Logs
Si mantienes una colección para registrar auditorías de usuario, inicios de sesión o eventos temporales, implementa una Cloud Function programada (Cron Job) que elimine los registros que tengan más de 30 o 90 días de antigüedad para evitar el crecimiento infinito.
