import React from 'react'
import NoHayResultados from './index'

// Ejemplo de uso básico
export const EjemploBasico = () => {
  return (
    <NoHayResultados />
  )
}

// Ejemplo con mensaje personalizado
export const EjemploPersonalizado = () => {
  return (
    <NoHayResultados
      titulo="No se encontraron evaluaciones"
      mensaje="No hay evaluaciones disponibles para mostrar en este momento. Intenta más tarde o contacta al administrador."
    />
  )
}

// Ejemplo con icono personalizado
export const EjemploConIcono = () => {
  return (
    <NoHayResultados
      titulo="Sin datos disponibles"
      mensaje="No se encontraron registros que coincidan con los filtros aplicados."
      icono={<span>📊</span>}
    />
  )
}

// Ejemplo con botón de acción
export const EjemploConAccion = () => {
  const handleRecargar = () => {
    console.log('Recargando datos...')
    // Aquí iría la lógica para recargar los datos
  }

  return (
    <NoHayResultados
      titulo="Error al cargar datos"
      mensaje="Hubo un problema al obtener la información. Verifica tu conexión e intenta nuevamente."
      icono={<span>⚠️</span>}
      accion={{
        texto: "Reintentar",
        onClick: handleRecargar
      }}
    />
  )
}

// Ejemplo completo con todas las opciones
export const EjemploCompleto = () => {
  const handleCrearNuevo = () => {
    console.log('Creando nuevo elemento...')
    // Aquí iría la lógica para crear un nuevo elemento
  }

  return (
    <NoHayResultados
      titulo="No hay especialistas registrados"
      mensaje="Aún no se han registrado especialistas en el sistema. Puedes agregar el primero ahora mismo."
      icono={<span>👥</span>}
      accion={{
        texto: "Agregar Especialista",
        onClick: handleCrearNuevo
      }}
    />
  )
}

// Ejemplo de uso en diferentes contextos
export const EjemplosContexto = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Para búsquedas */}
      <NoHayResultados
        titulo="Sin resultados de búsqueda"
        mensaje="No se encontraron elementos que coincidan con tu búsqueda. Intenta con otros términos."
        icono={<span>🔍</span>}
      />
      
      {/* Para listas vacías */}
      <NoHayResultados
        titulo="Lista vacía"
        mensaje="No hay elementos para mostrar en este momento."
        icono={<span>📝</span>}
      />
      
      {/* Para errores */}
      <NoHayResultados
        titulo="Error de conexión"
        mensaje="No se pudo conectar con el servidor. Verifica tu conexión a internet."
        icono={<span>🌐</span>}
        accion={{
          texto: "Reintentar",
          onClick: () => window.location.reload()
        }}
      />
    </div>
  )
}
