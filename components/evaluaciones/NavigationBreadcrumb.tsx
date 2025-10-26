import React from 'react';
import Link from 'next/link';
import styles from './NavigationBreadcrumb.module.css';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface NavigationBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const NavigationBreadcrumb: React.FC<NavigationBreadcrumbProps> = ({ 
  items, 
  className = '' 
}) => {
  return (
    <nav className={`${styles.breadcrumb} ${className}`} aria-label="Navegación">
      <ol className={styles.breadcrumbList}>
        {items.map((item, index) => (
          <li key={index} className={styles.breadcrumbItem}>
            {item.href && !item.isActive ? (
              <Link href={item.href} className={styles.breadcrumbLink}>
                {item.label}
              </Link>
            ) : (
              <span 
                className={`${styles.breadcrumbText} ${item.isActive ? styles.active : ''}`}
                aria-current={item.isActive ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
            {index < items.length - 1 && (
              <span className={styles.separator} aria-hidden="true">
                ›
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default NavigationBreadcrumb;
