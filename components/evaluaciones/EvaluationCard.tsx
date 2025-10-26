import React from 'react';
import Link from 'next/link';
import styles from './EvaluationCard.module.css';

interface EvaluationCardProps {
  href: string;
  title: string;
  backgroundColor: string;
  isActive?: boolean;
  isCompleted?: boolean;
  progress?: number;
}

const EvaluationCard: React.FC<EvaluationCardProps> = ({
  href,
  title,
  backgroundColor,
  isActive = false,
  isCompleted = false,
  progress = 0
}) => {
  return (
    <Link 
      href={href} 
      className={`${styles.evaluationCard} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
      style={{ '--card-bg': backgroundColor } as React.CSSProperties}
    >
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{title}</h3>
        
        {isCompleted && (
          <div className={styles.completedBadge}>
            <span className={styles.checkIcon}>✓</span>
            Completado
          </div>
        )}
        
        {progress > 0 && !isCompleted && (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className={styles.progressText}>{progress}%</span>
          </div>
        )}
        
        <div className={styles.cardStatus}>
          <span className={styles.statusText}>
            {isCompleted ? 'Finalizado' : isActive ? 'En progreso' : 'Disponible'}
          </span>
          <div className={styles.arrowIcon}>→</div>
        </div>
      </div>
    </Link>
  );
};

export default EvaluationCard;
