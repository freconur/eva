import React from 'react';
import styles from './StandardHeader.module.css';

interface StandardHeaderProps {
  level: number;
  title: string;
  description?: string;
  totalEvaluations?: number;
  completedEvaluations?: number;
}

const StandardHeader: React.FC<StandardHeaderProps> = ({
  level,
  title,
  description,
  totalEvaluations = 0,
  completedEvaluations = 0
}) => {
  const progressPercentage = totalEvaluations > 0 ? (completedEvaluations / totalEvaluations) * 100 : 0;

  return (
    <div className={styles.standardHeader}>
      <div className={styles.headerContent}>
        <div className={styles.levelInfo}>
          <div className={styles.levelNumber}>
            {level}
          </div>
          <div className={styles.levelDetails}>
            <h2 className={styles.title}>{title}</h2>
            {description && (
              <p className={styles.description}>{description}</p>
            )}
          </div>
        </div>
        
        
      </div>
      
      <div className={styles.decorativeNumber}>
        {level}
      </div>
    </div>
  );
};

export default StandardHeader;
