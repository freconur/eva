import React from 'react';
import styles from './loader.module.css';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large' | 'full';
  color?: string;
  text?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({
  size = 'medium',
  color = '#3b82f6',
  text,
  variant = 'spinner',
  className = ''
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small': return styles.small;
      case 'large': return styles.large;
      case 'full': return styles.full;
      default: return styles.medium;
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'dots': return styles.dots;
      case 'pulse': return styles.pulse;
      case 'bars': return styles.bars;
      default: return styles.spinner;
    }
  };

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={`${styles.dotsContainer} ${getSizeClass()}`}>
            <div className={styles.dot} style={{ backgroundColor: color }}></div>
            <div className={styles.dot} style={{ backgroundColor: color }}></div>
            <div className={styles.dot} style={{ backgroundColor: color }}></div>
          </div>
        );
      
      case 'pulse':
        return (
          <div className={`${styles.pulseContainer} ${getSizeClass()}`}>
            <div className={styles.pulse} style={{ backgroundColor: color }}></div>
          </div>
        );
      
      case 'bars':
        return (
          <div className={`${styles.barsContainer} ${getSizeClass()}`}>
            <div className={styles.bar} style={{ backgroundColor: color }}></div>
            <div className={styles.bar} style={{ backgroundColor: color }}></div>
            <div className={styles.bar} style={{ backgroundColor: color }}></div>
            <div className={styles.bar} style={{ backgroundColor: color }}></div>
            <div className={styles.bar} style={{ backgroundColor: color }}></div>
          </div>
        );
      
      default:
        return (
          <div className={`${styles.spinnerContainer} ${getSizeClass()}`}>
            <div className={styles.spinner} style={{ borderColor: `${color} transparent transparent transparent` }}></div>
          </div>
        );
    }
  };

  return (
    <div className={`${styles.loaderWrapper} ${className}`}>
      {renderLoader()}
      {text && (
        <div 
          className={`${styles.loaderText} ${getSizeClass()}`}
          style={{ color: color }}
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default Loader;
