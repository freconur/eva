import React from 'react';
import styles from './StatsCard.module.css';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  trend = 'neutral',
  trendValue
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return '#10b981';
      case 'down':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className={styles.statsCard} style={{ '--card-color': color } as React.CSSProperties}>
      <div className={styles.cardHeader}>
        <div className={styles.iconContainer}>
          {icon}
        </div>
        <div className={styles.trendIndicator} style={{ color: getTrendColor() }}>
          {getTrendIcon()}
        </div>
      </div>
      
      <div className={styles.cardContent}>
        <div className={styles.value}>{value}</div>
        <div className={styles.title}>{title}</div>
        {trendValue && (
          <div className={styles.trendValue} style={{ color: getTrendColor() }}>
            {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{trendValue}%
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
