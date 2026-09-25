import React from 'react';
import { useActiveUsers } from '@/features/hooks/useActiveUsers';
import styles from './ActiveUsersBadge.module.css';

interface Props {
  className?: string;
  showAlways?: boolean;
}

export const ActiveUsersBadge: React.FC<Props> = ({ className, showAlways = true }) => {
  const { activeUsers, isLoading } = useActiveUsers(60000); // Actualiza cada 60s

  if (!showAlways && activeUsers === 0 && !isLoading) {
    return null;
  }

  return (
    <div
      className={`${styles.badgeContainer} ${className || ''}`}
      title="Usuarios navegando en la plataforma (Google Analytics en tiempo real, actualizado cada minuto)"
    >
      <div className={styles.pulseWrapper}>
        <span className={styles.pulsePing} />
        <span className={styles.pulseDot} />
      </div>
      <div className={styles.badgeText}>
        <span>{isLoading ? '...' : activeUsers}</span>
        <span className={styles.badgeLabel}>
          {activeUsers === 1 ? 'en línea' : 'en línea'}
        </span>
      </div>
    </div>
  );
};

export default ActiveUsersBadge;
