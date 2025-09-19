import React, { useState } from 'react';
import Loader from './loader';
import styles from './ejemploUso.module.css';

const EjemploUsoLoader: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const simularCarga = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className={styles.container}>
      <h2>Ejemplos de Uso del Loader</h2>
      
      {/* Botón para simular carga */}
      <button onClick={simularCarga} className={styles.button}>
        Simular Carga
      </button>

      {/* Ejemplos de diferentes tamaños */}
      <div className={styles.section}>
        <h3>Tamaños</h3>
        <div className={styles.grid}>
          <div className={styles.example}>
            <h4>Small</h4>
            <div className={styles.loaderContainer}>
              <Loader size="small" variant="spinner" />
            </div>
          </div>
          
          <div className={styles.example}>
            <h4>Medium</h4>
            <div className={styles.loaderContainer}>
              <Loader size="medium" variant="spinner" />
            </div>
          </div>
          
          <div className={styles.example}>
            <h4>Large</h4>
            <div className={styles.loaderContainer}>
              <Loader size="large" variant="spinner" />
            </div>
          </div>
          
          <div className={styles.example}>
            <h4>Full</h4>
            <div className={styles.loaderContainer}>
              <Loader size="full" variant="spinner" />
            </div>
          </div>
        </div>
      </div>

      {/* Ejemplos de diferentes variantes */}
      <div className={styles.section}>
        <h3>Variantes</h3>
        <div className={styles.grid}>
          <div className={styles.example}>
            <h4>Spinner</h4>
            <div className={styles.loaderContainer}>
              <Loader variant="spinner" />
            </div>
          </div>
          
          <div className={styles.example}>
            <h4>Dots</h4>
            <div className={styles.loaderContainer}>
              <Loader variant="dots" />
            </div>
          </div>
          
          <div className={styles.example}>
            <h4>Pulse</h4>
            <div className={styles.loaderContainer}>
              <Loader variant="pulse" />
            </div>
          </div>
          
          <div className={styles.example}>
            <h4>Bars</h4>
            <div className={styles.loaderContainer}>
              <Loader variant="bars" />
            </div>
          </div>
        </div>
      </div>

      {/* Ejemplos de colores */}
      <div className={styles.section}>
        <h3>Colores</h3>
        <div className={styles.grid}>
          <div className={styles.example}>
            <h4>Azul</h4>
            <div className={styles.loaderContainer}>
              <Loader color="#3b82f6" />
            </div>
          </div>
          
          <div className={styles.example}>
            <h4>Verde</h4>
            <div className={styles.loaderContainer}>
              <Loader color="#10b981" />
            </div>
          </div>
          
          <div className={styles.example}>
            <h4>Rojo</h4>
            <div className={styles.loaderContainer}>
              <Loader color="#ef4444" />
            </div>
          </div>
          
          <div className={styles.example}>
            <h4>Naranja</h4>
            <div className={styles.loaderContainer}>
              <Loader color="#f59e0b" />
            </div>
          </div>
        </div>
      </div>

      {/* Ejemplo con texto */}
      <div className={styles.section}>
        <h3>Con Texto</h3>
        <div className={styles.grid}>
          <div className={styles.example}>
            <div className={styles.loaderContainer}>
              <Loader text="Cargando..." />
            </div>
          </div>
          
          <div className={styles.example}>
            <div className={styles.loaderContainer}>
              <Loader text="Procesando datos..." variant="dots" />
            </div>
          </div>
        </div>
      </div>

      {/* Ejemplo de adaptación a contenedor */}
      <div className={styles.section}>
        <h3>Adaptación a Contenedor</h3>
        <div className={styles.adaptiveGrid}>
          <div className={styles.smallContainer}>
            <Loader size="full" text="Pequeño" />
          </div>
          
          <div className={styles.mediumContainer}>
            <Loader size="full" text="Mediano" />
          </div>
          
          <div className={styles.largeContainer}>
            <Loader size="full" text="Grande" />
          </div>
        </div>
      </div>

      {/* Ejemplo de uso en overlay */}
      {loading && (
        <div className={styles.overlay}>
          <div className={styles.overlayContent}>
            <Loader size="large" variant="pulse" text="Cargando datos..." />
          </div>
        </div>
      )}
    </div>
  );
};

export default EjemploUsoLoader;
