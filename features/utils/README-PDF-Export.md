# Exportación de PDF con @react-pdf/renderer

## 🚀 Ventajas sobre jsPDF

### @react-pdf/renderer vs jsPDF

| Característica | @react-pdf/renderer | jsPDF |
|----------------|---------------------|-------|
| **Sintaxis** | Componentes React | API imperativa |
| **Personalización** | Muy alta (CSS-like) | Limitada |
| **Mantenimiento** | Declarativo y legible | Imperativo y complejo |
| **Estilos** | StyleSheet con CSS-like | Métodos de configuración |
| **Componentes** | Reutilizables | No aplicable |
| **Layout** | Flexbox automático | Manual |
| **Tipografía** | Fuentes web nativas | Limitada |
| **Imágenes** | Soporte nativo completo | Básico |

## 📁 Archivos

- `pdfExportEstadisticasDocentes.tsx` - Funciones principales de exportación
- `ejemploUsoPDF.tsx` - Componente de ejemplo
- `testImagenesPDF.tsx` - Componente de prueba para imágenes
- `ejemploTamanosImagen.tsx` - Ejemplo de diferentes tamaños de imagen
- `ejemploUnaPreguntaPorPagina.tsx` - Ejemplo del nuevo formato una pregunta por página
- `README-PDF-Export.md` - Esta documentación

## 🛠️ Funciones Disponibles

### 1. `generarPDFReporte`
Descarga directa del PDF al navegador del usuario.

```typescript
import { generarPDFReporte } from './pdfExport';

await generarPDFReporte(datosReporte, {
  titulo: 'Reporte de Evaluación',
  nombreDocente: 'María González',
  fecha: '15 de Diciembre, 2024'
});
```

### 2. `generarPDFReporteComoBlob`
Genera un blob del PDF para envío a servidor o procesamiento adicional.

```typescript
import { generarPDFReporteComoBlob } from './pdfExport';

const blob = await generarPDFReporteComoBlob(datosReporte, opciones);

// Ejemplo: Enviar a servidor
const formData = new FormData();
formData.append('pdf', blob, 'reporte.pdf');
await fetch('/api/upload', { method: 'POST', body: formData });
```

### 3. `generarPDFReporteComoURL`
Genera una URL del PDF para previsualización en el navegador.

```typescript
import { generarPDFReporteComoURL } from './pdfExport';

const url = await generarPDFReporteComoURL(datosReporte, opciones);

// Abrir en nueva pestaña
window.open(url, '_blank');

// Limpiar URL después de uso
setTimeout(() => URL.revokeObjectURL(url), 60000);
```

## 🎨 Personalización de Estilos

Los estilos se definen usando `StyleSheet.create()` similar a React Native:

## 📄 Formato de Página: Una Pregunta por Página

El nuevo formato genera un PDF donde cada pregunta ocupa una página completa:

### Estructura del PDF
- **Página 1**: Datos del docente + Primera pregunta completa
- **Páginas 2+**: Una pregunta por página con encabezado simplificado

### Ventajas del Nuevo Formato
1. **Mejor Legibilidad**: Cada pregunta tiene su propio espacio
2. **Imágenes Más Grandes**: Gráficos de 350×200 píxeles
3. **Organización Clara**: Estructura navegable y fácil de seguir
4. **Impresión Optimizada**: Cada pregunta en una hoja separada
5. **Análisis Detallado**: Más espacio para estadísticas y observaciones

### Ejemplo de Uso
```typescript
// El PDF se genera automáticamente con el nuevo formato
await generarPDFReporte(datosReporte, {
  titulo: 'Reporte de Evaluación',
  nombreDocente: 'María González',
  fecha: '20 de Diciembre, 2024'
});
```

```typescript
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottom: '2 solid #333',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  }
});
```

## 🔧 Estructura de Datos

```typescript
interface ReporteItem {
  pregunta: string;
  actuacion: string;
  order: number;
  id: string;
  dataEstadistica: {
    a?: number;
    b?: number;
    c?: number;
    d?: number;
    total?: number;
  };
  respuesta: string;
  index: number;
  graficoImagen?: string;
}

interface GenerarPDFOptions {
  titulo?: string;
  nombreDocente?: string;
  fecha?: string;
}
```

## 📱 Componentes Disponibles

### Componentes de React PDF
- `<Document>` - Contenedor principal
- `<Page>` - Página individual
- `<View>` - Contenedor de layout
- `<Text>` - Texto renderizable
- `<Image>` - Imágenes con soporte completo para base64

### Componentes Personalizados
- `ReporteInfo` - Encabezado del reporte
- `DocenteInfo` - Información del docente
- `PreguntaItem` - Pregunta individual con estadísticas

## 🖼️ Manejo de Imágenes

### Soporte de Formatos
- **Base64**: PNG, JPG, JPEG
- **URLs**: Imágenes remotas
- **Dimensiones**: Personalizables con estilos

### Ejemplo de Uso
```typescript
import { Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  chartImage: {
    width: 350,
    height: 200,
    objectFit: 'contain',
    marginTop: 15,
    marginBottom: 10,
  }
});

<Image 
  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
  style={styles.chartImage}
  cache={false}
/>
```

### Mejores Prácticas para Imágenes
1. **Cache**: Usar `cache={false}` para imágenes dinámicas
2. **Dimensiones**: Definir width y height para mejor rendimiento
3. **Formato**: Preferir PNG para gráficos y JPG para fotos
4. **Tamaño**: Optimizar imágenes base64 para evitar PDFs muy pesados
5. **Escalado**: Usar `objectFit: 'contain'` para mantener proporciones
6. **Dimensiones Recomendadas**: 350x200px para gráficos en PDFs A4

### Personalización de Tamaños
Puedes personalizar fácilmente el tamaño de las imágenes modificando los estilos:

```typescript
// Tamaño actual (350x200px)
chartImage: {
  width: 350,
  height: 200,
  objectFit: 'contain',
  marginTop: 15,
  marginBottom: 10,
}

// Para imágenes más grandes
chartImage: {
  width: 500,    // Más ancho
  height: 300,   // Más alto
  objectFit: 'contain',
  marginTop: 20,
  marginBottom: 15,
}
```

**Tamaños recomendados por uso:**
- **200×120px**: Listas compactas
- **350×200px**: Reportes estándar (actual)
- **500×300px**: Análisis detallados
- **600×400px**: Presentaciones

## 🚨 Limitaciones

### Imágenes Base64
`@react-pdf/renderer` **SÍ soporta imágenes base64** en el navegador. Para gráficos:

```typescript
import { Image } from '@react-pdf/renderer';

{item.graficoImagen && (
  <View style={styles.chartContainer}>
    <Text style={styles.questionLabel}>Gráfico de resultados:</Text>
    <Image 
      src={item.graficoImagen} 
      style={styles.chartImage}
      cache={false}
    />
  </View>
)}
```

### Fuentes Web
Las fuentes web deben registrarse antes de usar:

```typescript
import { Font } from '@react-pdf/renderer';

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfB.ttf', fontWeight: 'bold' },
  ]
});
```

## 🔄 Migración desde jsPDF

### Antes (jsPDF)
```typescript
const doc = new jsPDF();
doc.setFontSize(20);
doc.text('Título', 20, 30);
doc.save('reporte.pdf');
```

### Después (@react-pdf/renderer)
```typescript
const blob = await pdf(
  <Document>
    <Page size="A4">
      <Text style={styles.title}>Título</Text>
    </Page>
  </Document>
).toBlob();
```

## 📊 Ejemplos de Uso

### Reporte Simple
```typescript
const datos = [
  {
    id: '1',
    pregunta: '¿Pregunta de ejemplo?',
    actuacion: 'Excelente',
    order: 1,
    dataEstadistica: { a: 10, b: 5, total: 15 },
    respuesta: 'Respuesta correcta',
    index: 1
  }
];

await generarPDFReporte(datos, {
  titulo: 'Reporte de Evaluación',
  nombreDocente: 'Docente Ejemplo'
});
```

### Múltiples Opciones
```typescript
await generarPDFReporte(datosReporte, {
  titulo: 'Evaluación Curricular 2024',
  nombreDocente: 'Ana Martínez',
  fecha: '20 de Diciembre, 2024'
});
```

## 🎯 Mejores Prácticas

1. **Manejo de Errores**: Siempre envuelve las llamadas en try-catch
2. **Limpieza de URLs**: Revoca URLs de blob después de su uso
3. **Estilos Consistentes**: Usa un sistema de estilos coherente
4. **Componentes Reutilizables**: Crea componentes para elementos comunes
5. **Validación de Datos**: Verifica que los datos tengan el formato correcto

## 🔍 Troubleshooting

### Error: "Cannot read property 'toBlob'"
- Asegúrate de que `@react-pdf/renderer` esté instalado
- Verifica que estés usando la versión correcta

### PDF no se descarga
- Verifica que el navegador permita descargas
- Revisa la consola para errores de JavaScript

### Estilos no se aplican
- Verifica que `StyleSheet.create()` esté siendo usado
- Asegúrate de que los estilos estén correctamente referenciados

## 📚 Recursos Adicionales

- [Documentación oficial de @react-pdf/renderer](https://react-pdf.org/)
- [Ejemplos de componentes](https://react-pdf.org/components)
- [Guía de estilos](https://react-pdf.org/styling)
- [Soporte de fuentes](https://react-pdf.org/fonts)
