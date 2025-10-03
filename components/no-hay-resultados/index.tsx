import React from 'react'
import styles from './no-hay-resultados.module.css'

interface NoHayResultadosProps {
  titulo?: string
  mensaje?: string
  icono?: React.ReactNode
  accion?: {
    texto: string
    onClick: () => void
  }
}

const NoHayResultados: React.FC<NoHayResultadosProps> = ({
  titulo = "No hay resultados",
  mensaje = "No se encontraron elementos que coincidan con tu búsqueda",
  icono,
  accion
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {icono && (
          <div className={styles.icono}>
            {icono}
          </div>
        )}
        
        <h3 className={styles.titulo}>
          {titulo}
        </h3>
        
        <p className={styles.mensaje}>
          {mensaje}
        </p>
        
        {accion && (
          <button 
            className={styles.botonAccion}
            onClick={accion.onClick}
          >
            {accion.texto}
          </button>
        )}
      </div>
    </div>
  )
}

export default NoHayResultados