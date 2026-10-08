---
name: ui-ux-design
description: >-
  Guía y estándares de excelencia para el diseño de interfaces (UI), experiencia de usuario (UX),
  accesibilidad (WCAG 2.1 AA) y microinteracciones con Tailwind CSS y React/Next.js.
  Activa este skill al crear, refactorizar o auditar componentes visuales, pantallas, modales,
  formularios, tablas, estados de carga y flujos interactivos para el portal educativo EVA.
---

# 🎨 Skill: UI & UX Design Excellence (UGEL - EVA)

Este skill define los principios, patrones de interacción y estándares visuales obligatorios para construir experiencias intuitivas, accesibles y profesionales en el portal de gestión de evaluaciones EVA.

---

## 🏛️ 1. Heurísticas de Usabilidad y Psicología UX

Aplica rigurosamente las heurísticas de usabilidad adaptadas al contexto educativo (docentes, directores y estudiantes):

### 1.1. Visibilidad del Estado del Sistema (Feedback Inmediato)
* **Carga perceptiva**: Nunca dejes la pantalla en blanco o congelada. Usa *Skeleton loaders* en tablas y tarjetas, o *spinners* discretos en botones.
* **Prevención de doble clic**: En toda acción asíncrona (guardar, actualizar, eliminar, activar), activa un estado `isSaving` o `isLoading` que deshabilite el botón e indique el progreso visualmente (ej. *"Guardando..."* + icono giratorio).
* **Notificaciones de resultado**: Comunica el éxito o fallo mediante toasts claros (`react-toastify`) o alertas contextuales con mensajes comprensibles, evitando códigos o jerga técnica cruda.

### 1.2. Prevención y Recuperación de Errores
* **Acciones destructivas o irreversibles**: Requiere confirmación explícita (modal o diálogo) con botones diferenciados antes de eliminar elementos o activar evaluaciones que bloqueen la edición posterior.
* **Validación en tiempo real (Inline Validation)**: Señala campos requeridos o errores de formato al perder el foco (`onBlur`) o antes de enviar, explicando exactamente cómo solucionarlo.
* **Preservación del trabajo**: Si un usuario tiene cambios sin guardar en un formulario extenso, advierte antes de descartar o cerrar por accidente.

### 1.3. Reducción de la Carga Cognitiva
* **Jerarquía clara**: Una pantalla debe tener **una sola acción primaria** destacada. Las acciones secundarias deben ser visualmente más ligeras (bordes, texto o variante *ghost*).
* **Agrupación lógica (Leyes de Gestalt)**: Agrupa controles relacionados con tarjetas (`card`), bordes sutiles o separadores visuales claros.

---

## 🎯 2. Anatomía de Componentes y Tailwind CSS Tokens

### 2.0. Estrategia de Estilos: Tailwind CSS vs. CSS Modules (`*.module.css`)

En el proyecto EVA conviven **Tailwind CSS** y **CSS Modules**. Aplica la regla **90/10** para garantizar coherencia visual, velocidad de desarrollo y evitar deuda técnica:

#### ✅ 1. Usar Tailwind CSS por Defecto (90% de los casos)
Usa clases de utilidad directamente en el JSX para:
* **Estructura y Layout**: `flex`, `grid`, `space-y-*`, contenedores, modales, barras segmentadas y tarjetas.
* **Espaciado y Tipografía**: `p-*`, `m-*`, `text-sm`, `font-bold`, escala armónica del sistema.
* **Tokens de Color del Proyecto**: `text-colorSegundo`, `bg-colorSegundo/10`, `text-slate-800`, `bg-slate-50`.
* **Estados Interactivos Estándar**: `hover:`, `focus-visible:`, `active:`, `disabled:`.
* **Diseño Responsivo**: Breakpoints fluidos y predecibles (`sm:`, `md:`, `lg:`).

#### 🛠️ 2. Cuándo recurrir a CSS Modules (`*.module.css`) (10% de los casos)
Crea un archivo local `NombreComponente.module.css` **únicamente** cuando se presente una necesidad técnica puntual:
* **Animaciones `@keyframes` complejas**: Efectos visuales con múltiples fotogramas que generarían clases kilométricas o ilegibles en el JSX.
* **Sobrescritura y aislamiento de librerías externas**: Componentes de terceros que inyectan sus propias clases o identificadores (ej. tours guiados interactivos como `OnboardingTour`, calendarios, datepickers o gráficos).
* **Selectores avanzados y pseudo-elementos profundos**: Encadenamientos complejos de `::before`, `::after` o reglas no estándar de WebKit para scrollbars.
* **Reglas de impresión especializadas**: Bloques extensos de estilos para documentos PDF / `@media print`.

#### ⚠️ Reglas de Oro para Evitar Deuda Técnica:
1. **Cero colisiones de especificidad**: Nunca definas la **misma propiedad CSS** en Tailwind y en el `.module.css` sobre el mismo elemento (ej. `bg-blue-600` en Tailwind y `background-color: ...` en CSS Module), ya que genera conflictos y fuerza el uso dañino de `!important`.
2. **Respetar tokens institucionales**: Si requieres un `.module.css`, aprovecha `@apply` con clases de Tailwind (ej. `@apply bg-colorSegundo text-white;`) o variables CSS en lugar de escribir colores hexadecimales manuales fuera del sistema de diseño.

### 2.1. Estados Interactivos Obligatorios
Todo elemento interactivo (`<button>`, `<a>`, `<input>`, `<select>`) **DEBE** definir y responder en los siguientes estados:

```html
<!-- Ejemplo de botón primario con todos sus estados -->
<button
  type="button"
  disabled={isSaving}
  className="
    inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-white
    bg-blue-600 hover:bg-blue-700 active:bg-blue-800
    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    transition-all duration-150 ease-in-out shadow-sm hover:shadow
  "
>
  {isSaving ? <Spinner className="w-4 h-4 animate-spin" /> : <IconSave className="w-4 h-4" />}
  <span>{isSaving ? "Guardando..." : "Guardar Pregunta"}</span>
</button>
```

### 2.2. Semántica de Colores del Sistema
| Rol Semántico | Clase / Tono Tailwind | Uso Exclusivo |
| :--- | :--- | :--- |
| **Primario (Acción)** | `bg-blue-600` / `hover:bg-blue-700` | Botón principal de la pantalla, foco activo, enlaces clave. |
| **Secundario / Neutro** | `bg-slate-100 dark:bg-slate-800` / `border-slate-300` | Botones de cancelar, filtros secundarios, bordes de inputs. |
| **Éxito (Success)** | `bg-emerald-600` / `text-emerald-700` | Guardado exitoso, evaluaciones activas, puntajes correctos. |
| **Advertencia (Warning)**| `bg-amber-500` / `text-amber-700` | Avisos de bloqueo, evaluación en borrador, confirmaciones. |
| **Peligro (Destructive)**| `bg-rose-600` / `hover:bg-rose-700` | Eliminar preguntas, descartar cambios irreversibles. |

### 2.3. Jerarquía Tipográfica y Espaciado
* **Escala de fuentes**:
  * Título de página: `text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white`
  * Título de sección / Modal: `text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100`
  * Texto estándar (Body): `text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed`
  * Metadatos / Badges: `text-xs font-medium uppercase tracking-wider`
  * **Regla estricta**: Nunca uses textos por debajo de `text-xs` (12px).
* **Espaciado predecible (Escala 4px/8px)**:
  * Paddings de tarjetas y modales: `p-4 sm:p-6`
  * Gap entre controles en formulario: `gap-4` o `gap-6`
  * Separación entre secciones: `my-6` o `space-y-6`

---

## ♿ 3. Accesibilidad Universal (WCAG 2.1 AA)

1. **Navegación por Teclado**:
   * Asegura que todos los controles sean alcanzables con la tecla `Tab`.
   * El anillo de foco debe ser siempre visible: `focus-visible:ring-2 focus-visible:ring-offset-2`.
   * Modales deben cerrarse con la tecla `Escape`.
2. **Semántica HTML**:
   * Usa etiquetas nativas: `<button>` para acciones, `<a href="...">` para navegación entre rutas.
   * Evita `div` interactivos sin `role="button"` ni `tabIndex={0}`.
3. **Botones de Solo Icono**:
   * Si un botón solo contiene un icono visual (ej. botón de cerrar `MdClose` o editar `MdEdit`), **es obligatorio** añadir `aria-label="Cerrar modal"` o `title="Editar"`.
4. **Tamaño Mínimo de Contacto Táctil**:
   * Botones e inputs deben tener una altura mínima de `min-h-[40px]` o `min-h-[44px]` para facilitar el toque en dispositivos móviles y pantallas táctiles.

---

## 🧩 4. Patrones de Diseño Específicos para EVA

### 4.1. Modales de Creación y Edición
* **Fondo con desenfoque**: Fondo oscuro semitransparente con `backdrop-blur-sm bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-4`.
* **Foco Automático (Autofocus)**: El foco debe colocarse automáticamente en el primer input editable (`textarea` del texto de la pregunta).
* **Atajos de Teclado**:
  * `Escape`: Cierra el modal de forma segura.
  * `Enter` (en campos de una sola línea o sin combinación `Shift`): Dispara el guardado si todos los campos obligatorios son válidos.
* **Header Dinámico**: Muestra el contexto exacto (ej. *"Pregunta N° 5"* si ya hay 4 registradas).
* **Footer de Acciones**:
  * Botón secundario a la izquierda o neutro (*"Cancelar"*).
  * Botón primario a la derecha con indicador de carga (*"Guardar"* / *"Actualizar"*).

### 4.2. Drag & Drop y Reordenamiento de Preguntas (`@dnd-kit`)
* **Handle de Arrastre**: Incluir indicador visual evidente (`MdDragIndicator`) con cursor `cursor-grab active:cursor-grabbing`.
* **Modo Evaluación Activa**:
  * Si `evaluacion.active === true`, **oculta** el indicador de arrastre y desactiva la propiedad `draggable` para evitar frustración en el usuario.
  * Muestra los controles de puntuación como **Badges de solo lectura** en lugar de inputs editables.

### 4.3. Estados Vacíos (*Empty States*)
Cuando una lista, tabla o evaluación no tenga registros:
* Presenta una tarjeta centrada con:
  1. Icono representativo con fondo circular suave (`p-3 bg-blue-50 text-blue-600 rounded-full`).
  2. Título claro (ej. *"No hay preguntas registradas"*).
  3. Descripción breve y orientadora (ej. *"Empieza agregando la primera pregunta para esta evaluación"*).
### 4.4. Barra de Filtros Segmentada y Responsiva (`SegmentedFilterBar`)
Patrón oficial para filtrado en listados y tablas (`components/common/SegmentedFilterBar.tsx`):
* **Desktop (`md:` en adelante)**:
  * Contenedor en píldora horizontal (`bg-white border border-slate-200/90 rounded-2xl shadow-xs divide-x divide-slate-200`).
  * Extremo izquierdo: Ícono de embudo con `rounded-l-2xl` para conservar la curvatura exterior ovalada.
  * Segmentos centrales: Dropdowns custom con flecha rotatoria (`RiArrowDownSLine`), indicador activo y popover flotante con checkmark (`RiCheckLine`).
  * Extremo derecho: Botón *"Restablecer Filtros"* con `rounded-r-2xl` y estilo suave en `text-rose-500 hover:bg-rose-50/50`.
* **Mobile / Pantallas estrechas (`< md`)**:
  * Se transforma automáticamente en tarjeta agrupada vertical con `divide-y divide-slate-100` y `rounded-2xl`.
  * Cabecera unificada: Ícono de embudo + *"Filtrar por"* en la parte superior con `rounded-t-2xl`.
  * Fila de cada filtro a ancho completo (`w-full`) con altura táctil cómoda (`min-h-[44px]`).
  * Botón de restablecer al pie ocupando el ancho completo con `rounded-b-2xl`.
* **Accesibilidad y UX**: Cierre seguro con `Escape` y clic exterior, `role="listbox"` / `role="option"`, foco accesible y soporte a navegación por teclado.

---

## 📋 5. Checklist de Verificación UI/UX antes de Finalizar

Antes de dar por completado cualquier cambio visual o funcional en la interfaz, verifica:

- [ ] **¿Hay feedback de carga?** ¿Los botones se deshabilitan y muestran estado de proceso?
- [ ] **¿Es responsivo?** ¿Se visualiza correctamente en pantallas móviles (`360px`), tablets y monitores grandes?
- [ ] **¿Tiene foco visible y soporte de teclado?** ¿Se puede navegar con `Tab`, activar con `Enter`/`Espacio` y cerrar modales con `Escape`?
- [ ] **¿Tiene contraste suficiente?** ¿El texto se lee nítidamente sobre su color de fondo?
- [ ] **¿Respeta el estado de la evaluación?** ¿Bloquea o protege controles cuando `evaluacion.active === true` conforme a [AGENTS.md](file:///home/frecodev/Documentos/eva/.agents/AGENTS.md)?
- [ ] **¿Los botones de solo icono tienen `aria-label`?**
- [ ] **¿El modal tiene autofocus en el primer campo editable?**
- [ ] **¿Estrategia de estilos consistente?** ¿Se usó Tailwind CSS por defecto (90%) y se reservó CSS Modules (`*.module.css`) únicamente para animaciones complejas o aislamiento de librerías externas?
